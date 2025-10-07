import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;

    // Verify the case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId }
    });

    if (!existingCase) {
      return NextResponse.json({
        success: false,
        message: 'Case not found'
      }, { status: 404 });
    }

    // Fetch queries for this case
    const queries = await prisma.query.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      include: {
        case: {
          select: {
            caseName: true,
            caseNumber: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: queries.map(query => ({
        id: query.id,
        queryText: query.queryText,
        queryType: query.queryType,
        results: query.results,
        resultCount: query.resultCount,
        executionTime: query.executionTime,
        createdAt: query.createdAt,
        caseId: query.caseId,
        caseName: query.case.caseName,
        caseNumber: query.case.caseNumber
      }))
    });

  } catch (error) {
    console.error('Error fetching queries:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch queries'
    }, { status: 500 });
  }
}