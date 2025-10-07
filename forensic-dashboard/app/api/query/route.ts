import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeWithAI, generateEmbedding } from '@/lib/gemini';
import { cosineSimilarity, createAPIResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.log('JSON parsing failed:', jsonError);
      return NextResponse.json(
        createErrorResponse('Invalid JSON in request body', 400),
        { status: 400 }
      );
    }
    
    console.log('Query API received:', body);
    
    const { query, caseId, filters } = body;

    if (!query) {
      console.log('Query validation failed: missing query');
      return NextResponse.json(
        createErrorResponse('Query is required', 400),
        { status: 400 }
      );
    }

    // Parse the natural language query to understand intent
    const queryIntent = await parseQueryIntent(query);

    // Execute search based on intent
    let results: any = {};

    if (queryIntent.searchChats) {
      results.chats = await searchChats(query, caseId, filters);
    }

    if (queryIntent.searchCalls) {
      results.calls = await searchCalls(query, caseId, filters);
    }

    if (queryIntent.searchContacts) {
      results.contacts = await searchContacts(query, caseId, filters);
    }

    if (queryIntent.searchMedia) {
      results.media = await searchMedia(query, caseId, filters);
    }

    if (queryIntent.findEntities) {
      results.entities = await extractEntities(query, caseId);
    }

    if (queryIntent.findConnections) {
      results.connections = await findConnections(caseId, queryIntent.connectionParams);
    }

    // Generate AI summary (with error handling)
    let aiSummary = '';
    try {
      aiSummary = await generateAISummary(query, results);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      aiSummary = 'AI summary unavailable due to service error. Query results are still available above.';
    }

    // Save query to database only if we have a caseId
    let queryRecord;
    if (caseId) {
      queryRecord = await prisma.query.create({
        data: {
          queryText: query,
          queryType: 'natural_language',
          results: results,
          resultCount: getTotalResultCount(results),
          executionTime: Date.now() - startTime,
          caseId,
        },
      });
    }

    return NextResponse.json(
      createAPIResponse({
        queryId: queryRecord?.id || null,
        results,
        summary: aiSummary,
        executionTime: Date.now() - startTime,
        totalResults: getTotalResultCount(results),
        caseId: caseId || null,
      }, 'Query processed successfully')
    );
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to process query',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}

async function parseQueryIntent(query: string) {
  const lowerQuery = query.toLowerCase();
  
  return {
    searchChats: /\b(chats?|messages?|conversations?|whatsapp|telegram|sms|texts?)\b/i.test(query),
    searchCalls: /\b(calls?|phones?|dialed?|received?|missed?)\b/i.test(query),
    searchContacts: /\b(contacts?|persons?|people|numbers?)\b/i.test(query),
    searchMedia: /\b(images?|photos?|videos?|media|files?|documents?)\b/i.test(query),
    findEntities: /\b(crypto|bitcoin|address|email|ip|foreign|international)\b/i.test(query),
    findConnections: /\b(connect|link|relation|network|between|associate)\b/i.test(query),
    connectionParams: extractConnectionParams(query),
  };
}

function extractConnectionParams(query: string) {
  const params: any = {};
  
  // Extract phone numbers
  const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const phones = query.match(phoneRegex);
  if (phones) params.phoneNumbers = phones;
  
  // Extract crypto addresses (simplified)
  const cryptoRegex = /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g;
  const cryptoAddresses = query.match(cryptoRegex);
  if (cryptoAddresses) params.cryptoAddresses = cryptoAddresses;
  
  return params;
}

async function searchChats(query: string, caseId?: string, filters?: any) {
  // Get devices for this case or all devices if no case specified
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true },
  });

  const deviceIds = devices.map(d => d.id);

  // Check if this is a general "show all" type query
  const isGeneralQuery = /\b(all|show|list|display)\s+(chat|message|conversation)s?\b/i.test(query);

  // First, get all chats for the case
  const allChats = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
      ...(filters?.platform && { platform: filters.platform }),
    },
    include: {
      device: {
        select: {
          deviceName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  // If it's a general query, return recent chats
  if (isGeneralQuery) {
    return allChats.slice(0, 50);
  }

  let combinedResults: any[] = [];

  try {
    // Try semantic search if embeddings are available
    const queryEmbedding = await generateEmbedding(query);
    
    const chatsWithEmbeddings = allChats.filter((chat: any) => chat.embedding && chat.embedding.length > 0);
    
    if (chatsWithEmbeddings.length > 0) {
      const semanticResults = chatsWithEmbeddings
        .map((chat: any) => ({
          ...chat,
          similarityScore: cosineSimilarity(queryEmbedding, chat.embedding),
        }))
        .filter((chat: any) => chat.similarityScore > 0.3) // Lower threshold
        .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
        .slice(0, 30);
      
      combinedResults = [...semanticResults];
    }
  } catch (error) {
    console.warn('Semantic search failed, falling back to keyword search:', error);
  }

  // Always perform keyword search as fallback/supplement
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  const keywordMatches = allChats.filter((chat: any) => {
    const searchText = `${chat.message} ${chat.participantName || ''} ${chat.participantNumber || ''}`.toLowerCase();
    
    // Check for crypto addresses
    if (/\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/.test(searchText)) {
      return true;
    }
    
    // Check for foreign numbers (country codes)
    if (/\+(?!91)\d{1,3}/.test(searchText)) {
      return true;
    }
    
    // Check for any query words in the message
    const hasQueryWords = queryWords.some(word => searchText.includes(word));
    if (hasQueryWords) return true;
    
    // Check for suspicious keywords
    const suspiciousKeywords = ['payment', 'transfer', 'money', 'bitcoin', 'crypto', 'wallet', 'bank', 'deal', 'package', 'pickup', 'delivery'];
    return suspiciousKeywords.some(keyword => searchText.includes(keyword));
  });

  // Merge and deduplicate results
  keywordMatches.forEach((match: any) => {
    if (!combinedResults.find((r: any) => r.id === match.id)) {
      // Calculate relevance score for keyword matches
      const searchText = `${match.message} ${match.participantName || ''}`.toLowerCase();
      let relevanceScore = 0.4; // Base score for keyword match
      
      // Boost score for exact query word matches
      queryWords.forEach(word => {
        if (searchText.includes(word)) relevanceScore += 0.1;
      });
      
      combinedResults.push({ ...match, similarityScore: relevanceScore });
    }
  });

  return combinedResults
    .sort((a: any, b: any) => (b.similarityScore || 0) - (a.similarityScore || 0))
    .slice(0, 100);
}

async function searchCalls(query: string, caseId?: string, filters?: any) {
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true },
  });

  const deviceIds = devices.map((d: any) => d.id);

  // Check if this is a general "show all" type query  
  const isGeneralQuery = /\b(all|show|list|display)\s+(call|phone)s?\b/i.test(query);

  const calls = await prisma.call.findMany({
    where: {
      deviceId: { in: deviceIds },
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
      ...(filters?.callType && { callType: filters.callType }),
    },
    include: {
      device: {
        select: {
          deviceName: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: isGeneralQuery ? 100 : 50,
  });

  // Filter for foreign numbers if mentioned in query
  if (/foreign|international/i.test(query)) {
    return calls.filter((call: any) => /\+(?!91)\d{1,3}/.test(call.phoneNumber));
  }

  return calls;
}

async function searchContacts(query: string, caseId?: string, filters?: any) {
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true },
  });

  const deviceIds = devices.map((d: any) => d.id);

  // Check if this is a general "show all" type query
  const isGeneralQuery = /\b(all|show|list|display)\s+(contacts?|people?)\b/i.test(query);
  
  let contacts;
  
  if (isGeneralQuery) {
    // Return all contacts for general queries
    contacts = await prisma.contact.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      include: {
        device: {
          select: {
            deviceName: true,
          },
        },
      },
      take: 100,
    });
  } else {
    // Use specific search for targeted queries
    contacts = await prisma.contact.findMany({
      where: {
        deviceId: { in: deviceIds },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phoneNumbers: { hasSome: [query] } },
          { emails: { hasSome: [query] } },
        ],
      },
      include: {
        device: {
          select: {
            deviceName: true,
          },
        },
      },
      take: 50,
    });
  }

  return contacts;
}

async function searchMedia(query: string, caseId?: string, filters?: any) {
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true },
  });

  const deviceIds = devices.map((d: any) => d.id);

  const media = await prisma.media.findMany({
    where: {
      deviceId: { in: deviceIds },
      ...(filters?.mediaType && { mediaType: filters.mediaType }),
      ...(filters?.startDate && { createdDate: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { createdDate: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: {
          deviceName: true,
        },
      },
    },
    orderBy: { createdDate: 'desc' },
    take: 50,
  });

  return media;
}

async function extractEntities(query: string, caseId?: string) {
  // Search for specific entity patterns across all data
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true },
  });

  const deviceIds = devices.map((d: any) => d.id);

  // Search chats for entities
  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { message: true, participantNumber: true, timestamp: true },
  });

  const entities: {
    cryptoAddresses: any[];
    phoneNumbers: any[];
    emails: any[];
    urls: any[];
    ipAddresses: any[];
  } = {
    cryptoAddresses: [],
    phoneNumbers: [],
    emails: [],
    urls: [],
    ipAddresses: [],
  };

  const cryptoRegex = /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g;
  const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

  chats.forEach((chat: any) => {
    const text = chat.message;
    
    const cryptos = text.match(cryptoRegex);
    if (cryptos) {
      cryptos.forEach((crypto: string) => {
        entities.cryptoAddresses.push({
          value: crypto,
          context: text.substring(0, 100),
          timestamp: chat.timestamp,
        });
      });
    }

    const phones = text.match(phoneRegex);
    if (phones) {
      phones.forEach((phone: string) => {
        entities.phoneNumbers.push({
          value: phone,
          context: text.substring(0, 100),
          timestamp: chat.timestamp,
        });
      });
    }

    const emails = text.match(emailRegex);
    if (emails) {
      emails.forEach((email: string) => {
        entities.emails.push({
          value: email,
          context: text.substring(0, 100),
          timestamp: chat.timestamp,
        });
      });
    }

    const urls = text.match(urlRegex);
    if (urls) {
      urls.forEach((url: string) => {
        entities.urls.push({
          value: url,
          context: text.substring(0, 100),
          timestamp: chat.timestamp,
        });
      });
    }

    const ips = text.match(ipRegex);
    if (ips) {
      ips.forEach((ip: string) => {
        entities.ipAddresses.push({
          value: ip,
          context: text.substring(0, 100),
          timestamp: chat.timestamp,
        });
      });
    }
  });

  // Store unique entities in database
  for (const [entityType, entityList] of Object.entries(entities)) {
    for (const entity of entityList as any[]) {
      await prisma.entity.upsert({
        where: {
          entityType_value: {
            entityType,
            value: entity.value,
          },
        },
        update: {
          occurrences: { increment: 1 },
          contexts: { push: entity },
        },
        create: {
          entityType,
          value: entity.value,
          occurrences: 1,
          contexts: [entity],
        },
      });
    }
  }

  return entities;
}

async function findConnections(caseId?: string, params?: any) {
  const devices = await prisma.device.findMany({
    where: caseId ? { caseId } : {},
    select: { id: true, phoneNumber: true },
  });

  const deviceIds = devices.map((d: any) => d.id);

  // Find common contacts across devices
  const contacts = await prisma.contact.findMany({
    where: { deviceId: { in: deviceIds } },
  });

  // Find call patterns
  const calls = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
  });

  // Analyze communication patterns
  const phoneNumberFrequency: { [key: string]: number } = {};
  calls.forEach((call: any) => {
    phoneNumberFrequency[call.phoneNumber] = (phoneNumberFrequency[call.phoneNumber] || 0) + 1;
  });

  // Get top communicators
  const topCommunicators = Object.entries(phoneNumberFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([number, count]) => ({ phoneNumber: number, contactCount: count }));

  // Find chat-call correlations
  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { participantNumber: true, timestamp: true },
  });

  const connections = {
    topCommunicators,
    commonContacts: findCommonContacts(contacts),
    timelineCorrelations: findTimelineCorrelations(chats, calls),
  };

  return connections;
}

function findCommonContacts(contacts: any[]) {
  const contactMap: { [key: string]: Set<string> } = {};
  
  contacts.forEach(contact => {
    contact.phoneNumbers.forEach((number: string) => {
      if (!contactMap[number]) {
        contactMap[number] = new Set();
      }
      contactMap[number].add(contact.deviceId);
    });
  });

  return Object.entries(contactMap)
    .filter(([, devices]) => devices.size > 1)
    .map(([number, devices]) => ({
      phoneNumber: number,
      sharedAcrossDevices: Array.from(devices),
    }));
}

function findTimelineCorrelations(chats: any[], calls: any[]) {
  // Find calls followed by chats within 1 hour
  const correlations: any[] = [];
  
  calls.forEach(call => {
    const relatedChats = chats.filter(chat => {
      const timeDiff = Math.abs(
        new Date(chat.timestamp).getTime() - new Date(call.timestamp).getTime()
      );
      return (
        chat.participantNumber === call.phoneNumber &&
        timeDiff < 3600000 // 1 hour in milliseconds
      );
    });

    if (relatedChats.length > 0) {
      correlations.push({
        call,
        relatedChats: relatedChats.length,
        timeGap: relatedChats[0] ? 
          Math.abs(new Date(relatedChats[0].timestamp).getTime() - new Date(call.timestamp).getTime()) / 60000 : 0,
      });
    }
  });

  return correlations.slice(0, 20);
}

async function generateAISummary(query: string, results: any) {
  // Build comprehensive context with actual message content
  let detailedChats = '';
  if (results.chats && results.chats.length > 0) {
    detailedChats = results.chats.slice(0, 20).map((chat: any, index: number) => 
      `${index + 1}. [${chat.platform}] ${chat.participantName || chat.participantNumber} (${new Date(chat.timestamp).toLocaleDateString()}): "${chat.message}"`
    ).join('\n');
  }

  let detailedCalls = '';
  if (results.calls && results.calls.length > 0) {
    detailedCalls = results.calls.slice(0, 10).map((call: any, index: number) => 
      `${index + 1}. ${call.callType} call to ${call.contactName || call.phoneNumber} on ${new Date(call.timestamp).toLocaleDateString()} (Duration: ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')})`
    ).join('\n');
  }

  let detailedContacts = '';
  if (results.contacts && results.contacts.length > 0) {
    detailedContacts = results.contacts.slice(0, 10).map((contact: any, index: number) => 
      `${index + 1}. ${contact.name} - ${contact.phoneNumbers?.join(', ') || 'No phone'} ${contact.emails?.length ? `(${contact.emails.join(', ')})` : ''}`
    ).join('\n');
  }

  let entityDetails = '';
  if (results.entities) {
    Object.entries(results.entities).forEach(([type, items]: [string, any]) => {
      if (Array.isArray(items) && items.length > 0) {
        entityDetails += `\n${type.toUpperCase()}:\n${items.slice(0, 5).map((item: any, index: number) => `${index + 1}. ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n')}\n`;
      }
    });
  }

  const context = `
FORENSIC INVESTIGATION QUERY: "${query}"

COMPREHENSIVE RESULTS ANALYSIS:

SUMMARY STATISTICS:
- Total Chats Found: ${results.chats?.length || 0}
- Total Calls Found: ${results.calls?.length || 0} 
- Total Contacts Found: ${results.contacts?.length || 0}
- Total Media Files Found: ${results.media?.length || 0}

DETAILED CHAT MESSAGES:
${detailedChats || 'No chat messages found'}

DETAILED CALL RECORDS:
${detailedCalls || 'No call records found'}

DETAILED CONTACT INFORMATION:
${detailedContacts || 'No contacts found'}

EXTRACTED ENTITIES:
${entityDetails || 'No entities extracted'}

CONNECTIONS AND CORRELATIONS:
${results.connections ? 'Connection analysis available' : 'No connections identified'}

DEVICE INFORMATION:
${results.chats?.length > 0 ? `Primary device: ${results.chats[0].device?.deviceName || 'Unknown'}` : 'No device information'}
  `;

  try {
    const summary = await analyzeWithAI(
      `You are a forensic analyst. Analyze these digital investigation results and provide a professional forensic analysis summary.

IMPORTANT: Base your analysis ONLY on the actual data provided. Do NOT make assumptions about missing data.

If the results show actual evidence (chats, calls, contacts), analyze that evidence thoroughly.
If the results show no data, then explain what this means in a forensic context.

Provide your analysis in this structure:

## Forensic Analysis Summary

### 1. Key Findings Relevant to the Query
- List specific evidence found
- Include actual message content, call details, contact information
- Quantify findings with exact numbers

### 2. Suspicious Patterns or Anomalies  
- Analyze communication patterns
- Identify unusual timestamps, locations, or behaviors
- Highlight security concerns or red flags
- Look for crypto addresses, foreign numbers, suspicious keywords

### 3. Important Connections or Relationships
- Map relationships between contacts
- Identify communication patterns and frequencies
- Note cross-references between chats, calls, and contacts

### 4. Recommended Next Steps for the Investigation
1. Specific actions based on the evidence found
2. Additional search queries to run
3. External verification steps (CDR requests, etc.)
4. Evidence preservation recommendations

Be specific, professional, and actionable. Use the actual data provided to support your analysis.`,
      context
    );

    return formatSummaryForDisplay(summary);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return '## Summary Generation Failed\n\nPlease review the raw results above. The AI analysis service is currently unavailable.';
  }
}

function formatSummaryForDisplay(summary: string): string {
  // Ensure proper markdown formatting
  let formatted = summary.trim();
  
  // Fix common formatting issues
  formatted = formatted
    // Ensure headers have proper spacing
    .replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2\n')
    // Ensure bullet points have proper spacing
    .replace(/^[\*\-\+]\s*(.+)$/gm, '- $1')
    // Ensure numbered lists have proper spacing
    .replace(/^(\d+\.)\s*(.+)$/gm, '$1 $2')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure sections are separated
    .replace(/(#{2,3}\s*.+)\n([^\n#])/g, '$1\n\n$2');
  
  return formatted;
}

function getTotalResultCount(results: any): number {
  let count = 0;
  if (results.chats) count += results.chats.length;
  if (results.calls) count += results.calls.length;
  if (results.contacts) count += results.contacts.length;
  if (results.media) count += results.media.length;
  return count;
}