import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAPIResponse, createErrorResponse } from '@/lib/utils';

// GET all reports
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const caseId = url.searchParams.get('caseId');
    const status = url.searchParams.get('status');
    const reportType = url.searchParams.get('reportType');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (caseId) {
      where.caseId = caseId;
    }

    if (status && ['draft', 'final', 'submitted'].includes(status)) {
      where.content = {
        path: ['status'],
        equals: status
      };
    }

    if (reportType) {
      where.reportType = { contains: reportType, mode: 'insensitive' };
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              caseName: true,
            }
          }
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Transform reports to include flattened content data
    const transformedReports = reports.map(report => ({
      id: report.id,
      title: report.reportName,
      reportType: report.reportType,
      caseNumber: report.case.caseNumber,
      caseName: report.case.caseName,
      dateGenerated: report.generatedAt.toISOString().split('T')[0],
      officer: (report.content as any)?.officer || 'Unknown',
      status: (report.content as any)?.status || 'draft',
      findings: (report.content as any)?.findings || 0,
      pages: (report.content as any)?.pages || 0,
      sections: (report.content as any)?.sections || [],
      summary: (report.content as any)?.summary || '',
      keyFindings: (report.content as any)?.keyFindings || [],
      caseId: report.caseId,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(createAPIResponse({
      reports: transformedReports,
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
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch reports'),
      { status: 500 }
    );
  }
}

// POST create new report (for manual report creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reportName, 
      reportType, 
      caseId, 
      content,
      officer,
      sections = [],
      status = 'draft'
    } = body;

    if (!reportName || !reportType || !caseId) {
      return NextResponse.json(
        createErrorResponse('Report name, type, and case ID are required', 400),
        { status: 400 }
      );
    }

    // Verify case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      return NextResponse.json(
        createErrorResponse('Case not found', 404),
        { status: 404 }
      );
    }

    // Create report content structure
    const reportContent = {
      officer: officer || 'Unknown',
      status,
      sections,
      findings: 0, // Will be calculated based on actual data
      pages: Math.max(10, sections.length * 8), // Estimate based on sections
      summary: content?.summary || '',
      keyFindings: content?.keyFindings || [],
      ...content
    };

    const newReport = await prisma.report.create({
      data: {
        reportName,
        reportType,
        content: reportContent,
        caseId,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            caseName: true,
          }
        }
      }
    });

    // Transform the response
    const transformedReport = {
      id: newReport.id,
      title: newReport.reportName,
      reportType: newReport.reportType,
      caseNumber: newReport.case.caseNumber,
      caseName: newReport.case.caseName,
      dateGenerated: newReport.generatedAt.toISOString().split('T')[0],
      officer: reportContent.officer,
      status: reportContent.status,
      findings: reportContent.findings,
      pages: reportContent.pages,
      sections: reportContent.sections,
      summary: reportContent.summary,
      keyFindings: reportContent.keyFindings,
      caseId: newReport.caseId,
    };

    return NextResponse.json(
      createAPIResponse(transformedReport, 'Report created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create report'),
      { status: 500 }
    );
  }
}