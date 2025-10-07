import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAPIResponse, createErrorResponse, isForeignNumber } from '@/lib/utils';

// GET analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const timeframe = searchParams.get('timeframe') || '30d';

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const whereClause = caseId ? { case: { id: caseId } } : {};
    const deviceWhere = {
      ...whereClause,
      createdAt: { gte: startDate },
    };

    // Get device IDs for filtering
    const devices = await prisma.device.findMany({
      where: deviceWhere,
      select: { id: true },
    });
    const deviceIds = devices.map((d: any) => d.id);

    // Overall statistics
    const stats = {
      totalCases: await prisma.case.count(),
      totalDevices: await prisma.device.count({ where: deviceWhere }),
      totalQueries: await prisma.query.count({
        where: {
          createdAt: { gte: startDate },
          ...(caseId && { caseId }),
        },
      }),
      totalReports: await prisma.report.count({
        where: {
          generatedAt: { gte: startDate },
          ...(caseId && { caseId }),
        },
      }),
    };

    // Communication analytics
    const communications = {
      totalChats: await prisma.chat.count({
        where: { deviceId: { in: deviceIds } },
      }),
      totalCalls: await prisma.call.count({
        where: { deviceId: { in: deviceIds } },
      }),
      deletedMessages: await prisma.chat.count({
        where: {
          deviceId: { in: deviceIds },
          isDeleted: true,
        },
      }),
      uniqueContacts: await getUniqueContacts(deviceIds),
      foreignNumbers: await getForeignNumbers(deviceIds),
    };

    // Activity timeline (daily data for charts)
    const timeline = await getActivityTimeline(deviceIds, startDate);

    // Top contacts by interaction frequency
    const topContacts = await getTopContacts(deviceIds, 10);

    // Recent suspicious activity
    const suspiciousActivity = await getSuspiciousActivity(deviceIds, 5);

    return NextResponse.json(createAPIResponse({
      stats,
      communications,
      timeline,
      topContacts,
      suspiciousActivity,
      timeframe,
    }));
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch analytics data'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { caseId, analysisType } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const devices = await prisma.device.findMany({
      where: { caseId },
      select: { id: true },
    });

    const deviceIds = devices.map((d: any) => d.id);

    let analytics: any = {};

    switch (analysisType) {
      case 'communication_patterns':
        analytics = await analyzeCommunicationPatterns(deviceIds);
        break;

      case 'network_analysis':
        analytics = await analyzeNetwork(deviceIds);
        break;

      case 'temporal_analysis':
        analytics = await analyzeTemporalPatterns(deviceIds);
        break;

      case 'behavioral_analysis':
        analytics = await analyzeBehavior(deviceIds);
        break;

      case 'risk_assessment':
        analytics = await assessRisk(deviceIds);
        break;

      default:
        analytics = await getOverallAnalytics(deviceIds);
    }

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

async function analyzeCommunicationPatterns(deviceIds: string[]) {
  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: {
      platform: true,
      timestamp: true,
      participantNumber: true,
      message: true,
      messageType: true,
    },
  });

  const calls = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
    select: {
      phoneNumber: true,
      callType: true,
      duration: true,
      timestamp: true,
    },
  });

  // Frequency analysis
  const contactFrequency: { [key: string]: number } = {};
  [...chats, ...calls].forEach((item: any) => {
    const key = 'participantNumber' in item ? item.participantNumber : item.phoneNumber;
    if (key) {
      contactFrequency[key] = (contactFrequency[key] || 0) + 1;
    }
  });

  const topContacts = Object.entries(contactFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([number, count]) => ({ number, count }));

  // Platform usage
  const platformUsage: { [key: string]: number } = {};
  chats.forEach(chat => {
    platformUsage[chat.platform] = (platformUsage[chat.platform] || 0) + 1;
  });

  // Message length analysis
  const avgMessageLength = chats.reduce((sum, chat) => sum + chat.message.length, 0) / chats.length;

  return {
    topContacts,
    platformUsage,
    communicationStats: {
      totalMessages: chats.length,
      totalCalls: calls.length,
      avgMessageLength: Math.round(avgMessageLength),
      avgCallDuration: calls.reduce((sum, c) => sum + c.duration, 0) / calls.length,
    },
  };
}

async function analyzeNetwork(deviceIds: string[]) {
  const [chats, calls] = await Promise.all([
    prisma.chat.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { participantNumber: true, timestamp: true },
    }),
    prisma.call.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { phoneNumber: true, timestamp: true },
    }),
  ]);

  // Build adjacency matrix
  const nodes = new Set<string>();
  const edges: { [key: string]: Set<string> } = {};

  chats.forEach(chat => {
    if (chat.participantNumber) nodes.add(chat.participantNumber);
  });

  calls.forEach(call => {
    if (call.phoneNumber) nodes.add(call.phoneNumber);
  });

  // Calculate network metrics
  const networkSize = nodes.size;
  const connections = Object.keys(edges).length;

  // Identify clusters
  const clusters = identifyClusters(Array.from(nodes), chats, calls);

  return {
    networkSize,
    connections,
    clusters,
    centralNodes: Array.from(nodes).slice(0, 10),
  };
}

async function analyzeTemporalPatterns(deviceIds: string[]) {
  const communications = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { timestamp: true, participantNumber: true },
  });

  // Hour of day analysis
  const hourlyDistribution = new Array(24).fill(0);
  communications.forEach(comm => {
    const hour = new Date(comm.timestamp).getHours();
    hourlyDistribution[hour]++;
  });

  // Day of week analysis
  const weeklyDistribution = new Array(7).fill(0);
  communications.forEach(comm => {
    const day = new Date(comm.timestamp).getDay();
    weeklyDistribution[day]++;
  });

  // Identify anomalous times
  const avgHourly = hourlyDistribution.reduce((a, b) => a + b, 0) / 24;
  const anomalousHours = hourlyDistribution
    .map((count, hour) => ({ hour, count, deviation: Math.abs(count - avgHourly) }))
    .filter(h => h.deviation > avgHourly * 0.5)
    .sort((a, b) => b.deviation - a.deviation);

  return {
    hourlyDistribution,
    weeklyDistribution,
    anomalousHours: anomalousHours.slice(0, 5),
    peakHours: hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
}

async function analyzeBehavior(deviceIds: string[]) {
  const [chats, deletedChats, calls] = await Promise.all([
    prisma.chat.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.chat.count({ where: { deviceId: { in: deviceIds }, isDeleted: true } }),
    prisma.call.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { duration: true, callType: true },
    }),
  ]);

  const missedCalls = calls.filter(c => c.callType === 'missed').length;
  const avgCallDuration = calls.reduce((sum, c) => sum + c.duration, 0) / calls.length;

  // Behavioral indicators
  const deletionRate = deletedChats / chats;
  const missedCallRate = missedCalls / calls.length;

  const behavioralFlags = [];
  if (deletionRate > 0.1) {
    behavioralFlags.push({
      type: 'high_deletion_rate',
      severity: 'medium',
      description: `${(deletionRate * 100).toFixed(1)}% of messages are deleted`,
    });
  }

  if (missedCallRate > 0.3) {
    behavioralFlags.push({
      type: 'high_missed_calls',
      severity: 'low',
      description: `${(missedCallRate * 100).toFixed(1)}% of calls are missed`,
    });
  }

  return {
    deletionRate: (deletionRate * 100).toFixed(2),
    missedCallRate: (missedCallRate * 100).toFixed(2),
    avgCallDuration: Math.round(avgCallDuration),
    behavioralFlags,
  };
}

async function assessRisk(deviceIds: string[]) {
  const [chats, calls, media] = await Promise.all([
    prisma.chat.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { message: true, participantNumber: true, isDeleted: true, timestamp: true },
    }),
    prisma.call.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { phoneNumber: true, timestamp: true },
    }),
    prisma.media.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { mediaType: true },
    }),
  ]);

  const riskIndicators = [];
  let riskScore = 0;

  // Check for crypto-related content
  const cryptoMessages = chats.filter(c => 
    /bitcoin|crypto|btc|eth|wallet|blockchain|binance|coinbase/i.test(c.message)
  );
  if (cryptoMessages.length > 5) {
    riskIndicators.push({
      type: 'crypto_activity',
      severity: 'high',
      count: cryptoMessages.length,
      description: 'Multiple cryptocurrency-related communications detected',
    });
    riskScore += 30;
  }

  // Check for foreign communications
  const foreignNumbers = new Set([
    ...chats.filter(c => c.participantNumber && /\+(?!91)\d{1,3}/.test(c.participantNumber)).map(c => c.participantNumber),
    ...calls.filter(c => /\+(?!91)\d{1,3}/.test(c.phoneNumber)).map(c => c.phoneNumber),
  ]);
  if (foreignNumbers.size > 3) {
    riskIndicators.push({
      type: 'foreign_contacts',
      severity: 'medium',
      count: foreignNumbers.size,
      description: 'Communications with multiple foreign numbers',
    });
    riskScore += 20;
  }

  // Check deletion patterns
  const deletedCount = chats.filter(c => c.isDeleted).length;
  const deletionRate = deletedCount / chats.length;
  if (deletionRate > 0.15) {
    riskIndicators.push({
      type: 'high_deletion',
      severity: 'medium',
      count: deletedCount,
      description: 'High rate of deleted messages',
    });
    riskScore += 15;
  }

  // Check for suspicious keywords
  const suspiciousKeywords = [
    'transfer', 'payment', 'deal', 'package', 'delivery',
    'cash', 'money', 'account', 'offshore', 'anonymous'
  ];
  const suspiciousMessages = chats.filter(c => 
    suspiciousKeywords.some(keyword => c.message.toLowerCase().includes(keyword))
  );
  if (suspiciousMessages.length > 10) {
    riskIndicators.push({
      type: 'suspicious_content',
      severity: 'medium',
      count: suspiciousMessages.length,
      description: 'Messages containing potentially suspicious keywords',
    });
    riskScore += 15;
  }

  // Check late-night activity
  const lateNightComms = chats.filter(c => {
    const hour = new Date(c.timestamp).getHours();
    return hour >= 23 || hour <= 5;
  });
  if (lateNightComms.length > 50) {
    riskIndicators.push({
      type: 'unusual_hours',
      severity: 'low',
      count: lateNightComms.length,
      description: 'Significant activity during late night hours',
    });
    riskScore += 10;
  }

  // Calculate overall risk level
  let riskLevel = 'low';
  if (riskScore > 50) riskLevel = 'high';
  else if (riskScore > 25) riskLevel = 'medium';

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    riskIndicators,
    summary: `${riskIndicators.length} risk indicator(s) detected`,
  };
}

async function getOverallAnalytics(deviceIds: string[]) {
  const [
    totalChats,
    totalCalls,
    totalContacts,
    totalMedia,
    platforms,
  ] = await Promise.all([
    prisma.chat.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.call.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.contact.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.media.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.chat.groupBy({
      by: ['platform'],
      where: { deviceId: { in: deviceIds } },
      _count: { platform: true },
    }),
  ]);

  return {
    overview: {
      totalChats,
      totalCalls,
      totalContacts,
      totalMedia,
    },
    platforms: platforms.map(p => ({
      name: p.platform,
      count: p._count.platform,
    })),
  };
}

function identifyClusters(nodes: string[], chats: any[], calls: any[]) {
  // Simple clustering based on communication frequency
  const connections: { [key: string]: Set<string> } = {};

  chats.forEach(chat => {
    if (chat.participantNumber) {
      if (!connections[chat.participantNumber]) {
        connections[chat.participantNumber] = new Set();
      }
    }
  });

  // Identify strongly connected components
  const clusters: string[][] = [];
  const visited = new Set<string>();

  Object.keys(connections).forEach(node => {
    if (!visited.has(node)) {
      const cluster = [node];
      visited.add(node);
      clusters.push(cluster);
    }
  });

  return clusters.slice(0, 5).map((cluster, idx) => ({
    id: idx,
    size: cluster.length,
    nodes: cluster.slice(0, 10),
  }));
}

// Helper functions for GET route
async function getUniqueContacts(deviceIds: string[]): Promise<number> {
  const contacts = await prisma.contact.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { phoneNumbers: true },
  });

  const chatParticipants = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { participantNumber: true },
  });

  const callNumbers = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { phoneNumber: true },
  });

  const uniqueNumbers = new Set([
    ...contacts.map((c: any) => c.phoneNumber),
    ...chatParticipants.map((c: any) => c.participantNumber).filter(Boolean),
    ...callNumbers.map((c: any) => c.phoneNumber),
  ]);

  return uniqueNumbers.size;
}

async function getForeignNumbers(deviceIds: string[]): Promise<number> {
  const calls = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { phoneNumber: true },
  });

  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { participantNumber: true },
  });

  const allNumbers = [
    ...calls.map((c: any) => c.phoneNumber),
    ...chats.map((c: any) => c.participantNumber).filter(Boolean),
  ];

  const foreignNumbers = allNumbers.filter(num => isForeignNumber(num));
  return new Set(foreignNumbers).size;
}

async function getActivityTimeline(deviceIds: string[], startDate: Date) {
  // Get daily chat and call counts for the timeline
  const chats = await prisma.chat.groupBy({
    by: ['timestamp'],
    where: {
      deviceId: { in: deviceIds },
      timestamp: { gte: startDate },
    },
    _count: {
      id: true,
    },
  });

  const calls = await prisma.call.groupBy({
    by: ['timestamp'],
    where: {
      deviceId: { in: deviceIds },
      timestamp: { gte: startDate },
    },
    _count: {
      id: true,
    },
  });

  // Group by date
  const timeline: { [key: string]: { chats: number; calls: number } } = {};

  chats.forEach((item: any) => {
    const date = item.timestamp.toISOString().split('T')[0];
    if (!timeline[date]) timeline[date] = { chats: 0, calls: 0 };
    timeline[date].chats += item._count.id;
  });

  calls.forEach((item: any) => {
    const date = item.timestamp.toISOString().split('T')[0];
    if (!timeline[date]) timeline[date] = { chats: 0, calls: 0 };
    timeline[date].calls += item._count.id;
  });

  return Object.entries(timeline).map(([date, data]) => ({
    date,
    ...data,
  }));
}

async function getTopContacts(deviceIds: string[], limit: number) {
  // Get most frequently contacted numbers
  const chatCounts = await prisma.chat.groupBy({
    by: ['participantNumber'],
    where: {
      deviceId: { in: deviceIds },
      participantNumber: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });

  return chatCounts.map((item: any) => ({
    phoneNumber: item.participantNumber,
    count: item._count.id,
    type: 'chat',
  }));
}

async function getSuspiciousActivity(deviceIds: string[], limit: number) {
  // Find deleted messages and foreign communications
  const deletedMessages = await prisma.chat.findMany({
    where: {
      deviceId: { in: deviceIds },
      isDeleted: true,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      device: {
        select: { deviceName: true },
      },
    },
  });

  return deletedMessages.map((chat: any) => ({
    id: chat.id,
    type: 'deleted_message',
    description: `Deleted message from ${chat.participantNumber || 'Unknown'}`,
    timestamp: chat.timestamp,
    deviceName: chat.device.deviceName,
    severity: 'medium',
  }));
}