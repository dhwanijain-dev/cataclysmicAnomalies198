import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCaseId, createAPIResponse, createErrorResponse } from '@/lib/utils';

// GET all cases
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { caseName: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, totalCount] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          _count: {
            select: {
              devices: true,
              queries: true,
              reports: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(createAPIResponse({
      cases,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }));
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch cases'),
      { status: 500 }
    );
  }
}

// POST create new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseName, description, officerName, priority = 'medium' } = body;

    if (!caseName) {
      return NextResponse.json(
        createErrorResponse('Case name is required', 400),
        { status: 400 }
      );
    }

    const caseNumber = generateCaseId();

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        caseName,
        description,
      },
      include: {
        _count: {
          select: {
            devices: true,
            queries: true,
            reports: true,
          },
        },
      },
    });

    return NextResponse.json(
      createAPIResponse(newCase, 'Case created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create case'),
      { status: 500 }
    );
  }
}