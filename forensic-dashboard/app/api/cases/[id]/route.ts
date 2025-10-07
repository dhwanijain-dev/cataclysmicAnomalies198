import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAPIResponse, createErrorResponse, isForeignNumber } from '@/lib/utils';

// GET single case with details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        devices: {
          include: {
            _count: {
              select: {
                chats: true,
                calls: true,
                contacts: true,
                media: true,
              },
            },
          },
        },
        queries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reports: {
          orderBy: { generatedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        createErrorResponse('Case not found', 404),
        { status: 404 }
      );
    }

    // Get statistics
    const deviceIds = caseData.devices.map((d: any) => d.id);

    const stats = {
      totalChats: await prisma.chat.count({
        where: { deviceId: { in: deviceIds } },
      }),
      totalCalls: await prisma.call.count({
        where: { deviceId: { in: deviceIds } },
      }),
      totalContacts: await prisma.contact.count({
        where: { deviceId: { in: deviceIds } },
      }),
      totalMedia: await prisma.media.count({
        where: { deviceId: { in: deviceIds } },
      }),
      uniqueNumbers: await getUniquePhoneNumbers(deviceIds),
      foreignNumbers: await getForeignNumbers(deviceIds),
      deletedMessages: await prisma.chat.count({
        where: {
          deviceId: { in: deviceIds },
          isDeleted: true,
        },
      }),
    };

    return NextResponse.json(createAPIResponse({
      case: caseData,
      stats,
    }));
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch case'),
      { status: 500 }
    );
  }
}

// PUT update case
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { caseName, description, status, priority, officerName } = body;

    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        ...(caseName && { caseName }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(officerName && { officerName }),
      },
    });

    return NextResponse.json(
      createAPIResponse(updatedCase, 'Case updated successfully')
    );
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      createErrorResponse('Failed to update case'),
      { status: 500 }
    );
  }
}

// DELETE case
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.case.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      createAPIResponse(null, 'Case deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      createErrorResponse('Failed to delete case'),
      { status: 500 }
    );
  }
}

async function getUniquePhoneNumbers(deviceIds: string[]): Promise<number> {
  const calls = await prisma.call.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { phoneNumber: true },
  });

  const chats = await prisma.chat.findMany({
    where: { deviceId: { in: deviceIds } },
    select: { participantNumber: true },
  });

  const uniqueNumbers = new Set([
    ...calls.map((c: any) => c.phoneNumber),
    ...chats.map((c: any) => c.participantNumber).filter(Boolean),
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