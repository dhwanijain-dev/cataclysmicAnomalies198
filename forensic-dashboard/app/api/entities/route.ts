import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAPIResponse, createErrorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        createErrorResponse('Case ID is required', 400),
        { status: 400 }
      );
    }

    const devices = await prisma.device.findMany({
      where: { caseId },
      select: { id: true },
    });

    const deviceIds = devices.map((d: any) => d.id);
    
    const contacts = await prisma.contact.findMany({
      where: { deviceId: { in: deviceIds } },
      take: 50,
    });

    return NextResponse.json(createAPIResponse({ contacts }));
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch entities'),
      { status: 500 }
    );
  }
}
