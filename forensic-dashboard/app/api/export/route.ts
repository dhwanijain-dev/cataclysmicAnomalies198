import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAPIResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { caseId, exportType, format } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        devices: true,
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const deviceIds = caseData.devices.map(d => d.id);
    let exportData: any = {};

    switch (exportType) {
      case 'full':
        exportData = await exportFullCase(deviceIds, caseData);
        break;

      case 'chats':
        exportData = await exportChats(deviceIds);
        break;

      case 'calls':
        exportData = await exportCalls(deviceIds);
        break;

      case 'timeline':
        exportData = await exportTimeline(deviceIds);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Format the data
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
      });
    } else if (format === 'csv') {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="case-${caseData.caseNumber}-export.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function exportFullCase(deviceIds: string[], caseData: any) {
  const [chats, calls, contacts, media] = await Promise.all([
    prisma.chat.findMany({
      where: { deviceId: { in: deviceIds } },
      include: { device: { select: { deviceName: true } } },
    }),
    prisma.call.findMany({
      where: { deviceId: { in: deviceIds } },
      include: { device: { select: { deviceName: true } } },
    }),
    prisma.contact.findMany({
      where: { deviceId: { in: deviceIds } },
      include: { device: { select: { deviceName: true } } },
    }),
    prisma.media.findMany({
      where: { deviceId: { in: deviceIds } },
      include: { device: { select: { deviceName: true } } },
    }),
  ]);

  return {
    case: {
      caseNumber: caseData.caseNumber,
      caseName: caseData.caseName,
      description: caseData.description,
      devices: caseData.devices,
    },
    statistics: {
      totalChats: chats.length,
      totalCalls: calls.length,
      totalContacts: contacts.length,
      totalMedia: media.length,
    },
    data: {
      chats: chats.map(c => ({
        platform: c.platform,
        participant: c.participantName || c.participantNumber,
        message: c.message,
        timestamp: c.timestamp,
        device: c.device.deviceName,
        direction: c.direction,
        isDeleted: c.isDeleted,
      })),
      calls: calls.map(c => ({
        phoneNumber: c.phoneNumber,
        contactName: c.contactName,
        callType: c.callType,
        duration: c.duration,
        timestamp: c.timestamp,
        device: c.device.deviceName,
      })),
      contacts: contacts.map(c => ({
        name: c.name,
        phoneNumbers: c.phoneNumbers,
        emails: c.emails,
        organization: c.organization,
        device: c.device.deviceName,
      })),
      media: media.map(m => ({
        fileName: m.fileName,
        mediaType: m.mediaType,
        fileSize: m.fileSize,
        createdDate: m.createdDate,
        device: m.device.deviceName,
      })),
    },
  };
}

async function exportChats(deviceIds: string[]) {
  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    include: { device: { select: { deviceName: true, phoneNumber: true } } },
    orderBy: { timestamp: 'asc' },
  });

  return chats.map(chat => ({
    timestamp: chat.timestamp,
    platform: chat.platform,
    device: chat.device.deviceName,
    deviceNumber: chat.device.phoneNumber,
    participant: chat.participantName || chat.participantNumber || 'Unknown',
    participantNumber: chat.participantNumber,
    direction: chat.direction,
    messageType: chat.messageType,
    message: chat.message,
    isDeleted: chat.isDeleted,
  }));
}

async function exportCalls(deviceIds: string[]) {
  const calls = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
    include: { device: { select: { deviceName: true, phoneNumber: true } } },
    orderBy: { timestamp: 'asc' },
  });

  return calls.map(call => ({
    timestamp: call.timestamp,
    device: call.device.deviceName,
    deviceNumber: call.device.phoneNumber,
    phoneNumber: call.phoneNumber,
    contactName: call.contactName || 'Unknown',
    callType: call.callType,
    duration: call.duration,
    durationFormatted: formatDuration(call.duration),
  }));
}

async function exportTimeline(deviceIds: string[]) {
  const [chats, calls, locations] = await Promise.all([
    prisma.chat.findMany({
      where: { deviceId: { in: deviceIds } },
      select: {
        timestamp: true,
        platform: true,
        participantName: true,
        participantNumber: true,
        message: true,
        device: { select: { deviceName: true } },
      },
    }),
    prisma.call.findMany({
      where: { deviceId: { in: deviceIds } },
      select: {
        timestamp: true,
        phoneNumber: true,
        contactName: true,
        callType: true,
        duration: true,
        device: { select: { deviceName: true } },
      },
    }),
    prisma.location.findMany({
      where: { deviceId: { in: deviceIds } },
      select: {
        timestamp: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        source: true,
      },
    }),
  ]);

  const timeline = [
    ...chats.map(c => ({
      timestamp: c.timestamp,
      type: 'chat',
      platform: c.platform,
      participant: c.participantName || c.participantNumber,
      content: c.message.substring(0, 100),
      device: c.device.deviceName,
    })),
    ...calls.map(c => ({
      timestamp: c.timestamp,
      type: 'call',
      callType: c.callType,
      phoneNumber: c.phoneNumber,
      contactName: c.contactName,
      duration: formatDuration(c.duration),
      device: c.device.deviceName,
    })),
    ...locations.map(l => ({
      timestamp: l.timestamp,
      type: 'location',
      latitude: l.latitude,
      longitude: l.longitude,
      accuracy: l.accuracy,
      source: l.source,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return timeline;
}

function convertToCSV(data: any): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Handle different data structures
  let rows = data;
  if (data.data && Array.isArray(data.data.chats)) {
    rows = data.data.chats;
  } else if (!Array.isArray(data)) {
    rows = [data];
  }

  // Get headers from first row
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  // Add data rows
  rows.forEach((row: any) => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}