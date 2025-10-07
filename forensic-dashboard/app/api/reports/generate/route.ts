import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeWithAI } from '@/lib/gemini';
import { createAPIResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { caseId, reportType, filters } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        createErrorResponse('Case ID is required', 400),
        { status: 400 }
      );
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { devices: true },
    });

    if (!caseData) {
      return NextResponse.json(
        createErrorResponse('Case not found', 404),
        { status: 404 }
      );
    }

    const deviceIds = caseData.devices.map((d: any) => d.id);
    
    let reportContent: any = {};
    let reportName = '';

    switch (reportType) {
      case 'summary':
        reportContent = await generateSummaryReport(deviceIds, caseData);
        reportName = `Case Summary Report - ${caseData.caseNumber}`;
        break;
      case 'communications':
        reportContent = await generateCommunicationsReport(deviceIds, filters);
        reportName = `Communications Analysis - ${caseData.caseNumber}`;
        break;
      default:
        return NextResponse.json(
          createErrorResponse('Invalid report type', 400),
          { status: 400 }
        );
    }

    const aiInsights = await generateReportInsights(reportContent, reportType);
    reportContent.aiInsights = aiInsights;

    const report = await prisma.report.create({
      data: {
        reportName,
        reportType,
        content: reportContent,
        caseId,
      },
    });

    return NextResponse.json(
      createAPIResponse(report, 'Report generated successfully')
    );
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to generate report',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}

async function generateSummaryReport(deviceIds: string[], caseData: any) {
  const [totalChats, totalCalls] = await Promise.all([
    prisma.chat.count({ where: { deviceId: { in: deviceIds } } }),
    prisma.call.count({ where: { deviceId: { in: deviceIds } } }),
  ]);

  return {
    caseInfo: {
      caseNumber: caseData.caseNumber,
      caseName: caseData.caseName,
      devices: caseData.devices.length,
    },
    overview: { totalChats, totalCalls },
    generatedAt: new Date(),
  };
}

async function generateCommunicationsReport(deviceIds: string[], filters?: any) {
  const whereClause: any = { deviceId: { in: deviceIds } };
  
  const [chats, calls] = await Promise.all([
    prisma.chat.findMany({ where: whereClause, take: 1000 }),
    prisma.call.findMany({ where: whereClause, take: 1000 }),
  ]);

  return {
    totalCommunications: chats.length + calls.length,
    chats: { total: chats.length },
    calls: { total: calls.length },
  };
}

async function generateReportInsights(reportContent: any, reportType: string) {
  try {
    const prompt = `Analyze this forensic ${reportType} report and provide insights.`;
    const context = JSON.stringify(reportContent, null, 2).substring(0, 1000);
    return await analyzeWithAI(prompt, context);
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate AI insights at this time.';
  }
}
