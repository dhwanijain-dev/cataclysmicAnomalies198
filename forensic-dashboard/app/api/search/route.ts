import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/gemini';
import { cosineSimilarity } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { query, caseId, searchType, filters } = await request.json();

    if (!query || !caseId) {
      return NextResponse.json(
        { error: 'Query and caseId are required' },
        { status: 400 }
      );
    }

    const devices = await prisma.device.findMany({
      where: { caseId },
      select: { id: true },
    });

    const deviceIds = devices.map(d => d.id);
    let results: any = {};

    switch (searchType) {
      case 'semantic':
        results = await semanticSearch(query, deviceIds, filters);
        break;

      case 'keyword':
        results = await keywordSearch(query, deviceIds, filters);
        break;

      case 'phone':
        results = await phoneSearch(query, deviceIds, filters);
        break;

      case 'entity':
        results = await entitySearch(query, deviceIds, filters);
        break;

      default:
        results = await hybridSearch(query, deviceIds, filters);
    }

    return NextResponse.json({
      success: true,
      results,
      count: getTotalCount(results),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function semanticSearch(query: string, deviceIds: string[], filters?: any) {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get all chats with embeddings
  const chats = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      ...(filters?.platform && { platform: filters.platform }),
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
  });

  // Calculate similarity scores
  const chatsWithScores = chats
    .filter(chat => chat.embedding && chat.embedding.length > 0)
    .map(chat => ({
      ...chat,
      similarityScore: cosineSimilarity(queryEmbedding, chat.embedding),
    }))
    .filter(chat => chat.similarityScore > 0.6)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 100);

  return {
    chats: chatsWithScores,
    searchType: 'semantic',
  };
}

async function keywordSearch(query: string, deviceIds: string[], filters?: any) {
  const keywords = query.toLowerCase().split(' ').filter(k => k.length > 2);

  const chats = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      OR: keywords.map(keyword => ({
        message: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      })),
      ...(filters?.platform && { platform: filters.platform }),
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const calls = await prisma.call.findMany({
    where: {
      deviceId: { in: deviceIds },
      OR: [
        { contactName: { contains: query, mode: 'insensitive' as const } },
        { phoneNumber: { contains: query } },
      ],
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return {
    chats,
    calls,
    searchType: 'keyword',
  };
}

async function phoneSearch(query: string, deviceIds: string[], filters?: any) {
  // Normalize phone number
  const normalizedPhone = query.replace(/[^\d+]/g, '');

  const chats = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      participantNumber: {
        contains: normalizedPhone,
      },
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  const calls = await prisma.call.findMany({
    where: {
      deviceId: { in: deviceIds },
      phoneNumber: {
        contains: normalizedPhone,
      },
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  const contacts = await prisma.contact.findMany({
    where: {
      deviceId: { in: deviceIds },
      phoneNumbers: {
        hasSome: [normalizedPhone],
      },
    },
    include: {
      device: {
        select: { deviceName: true },
      },
    },
  });

  return {
    chats,
    calls,
    contacts,
    searchType: 'phone',
  };
}

async function entitySearch(query: string, deviceIds: string[], filters?: any) {
  // Detect entity type
  let entityType = 'unknown';
  let pattern: RegExp;

  if (/\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/.test(query)) {
    entityType = 'crypto';
    pattern = /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/;
  } else if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(query)) {
    entityType = 'email';
    pattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  } else if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(query)) {
    entityType = 'ip';
    pattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  } else {
    // Default to keyword search
    return keywordSearch(query, deviceIds, filters);
  }

  const chats = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      ...(filters?.startDate && { timestamp: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { timestamp: { lte: new Date(filters.endDate) } }),
    },
    include: {
      device: {
        select: { deviceName: true, phoneNumber: true },
      },
    },
  });

  // Filter chats containing the entity
  const matchingChats = chats.filter(chat => pattern.test(chat.message));

  return {
    chats: matchingChats,
    entityType,
    searchType: 'entity',
  };
}

async function hybridSearch(query: string, deviceIds: string[], filters?: any) {
  // Combine semantic and keyword search
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, deviceIds, filters),
    keywordSearch(query, deviceIds, filters),
  ]);

  // Merge and deduplicate results
  const chatIds = new Set(semanticResults.chats.map((c: any) => c.id));
  const mergedChats = [
    ...semanticResults.chats,
    ...keywordResults.chats.filter((c: any) => !chatIds.has(c.id)),
  ];

  return {
    chats: mergedChats.slice(0, 100),
    calls: keywordResults.calls,
    searchType: 'hybrid',
  };
}

function getTotalCount(results: any): number {
  let count = 0;
  if (results.chats) count += results.chats.length;
  if (results.calls) count += results.calls.length;
  if (results.contacts) count += results.contacts.length;
  return count;
}