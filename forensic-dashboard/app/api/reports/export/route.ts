import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, format = 'txt', includeImages = false, includeMetadata = true } = body;

    if (!reportId) {
      return NextResponse.json(
        createErrorResponse('Report ID is required', 400),
        { status: 400 }
      );
    }

    // Fetch the report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
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

    if (!report) {
      return NextResponse.json(
        createErrorResponse('Report not found', 404),
        { status: 404 }
      );
    }

    // Generate report content based on format
    let content: string;
    let mimeType: string;
    let filename: string;

    const reportData = {
      id: report.id,
      title: report.reportName,
      caseNumber: report.case.caseNumber,
      caseName: report.case.caseName,
      reportType: report.reportType,
      dateGenerated: report.generatedAt.toISOString().split('T')[0],
      officer: (report.content as any)?.officer || 'Unknown',
      status: (report.content as any)?.status || 'draft',
      findings: (report.content as any)?.findings || 0,
      pages: (report.content as any)?.pages || 0,
      sections: (report.content as any)?.sections || [],
      summary: (report.content as any)?.summary || '',
      keyFindings: (report.content as any)?.keyFindings || [],
    };

    switch (format.toLowerCase()) {
      case 'html':
        content = generateHtmlReport(reportData);
        mimeType = 'text/html';
        filename = `${reportData.caseNumber}_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        break;
      
      case 'json':
        content = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
        filename = `${reportData.caseNumber}_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        break;
      
      case 'csv':
        content = generateCsvReport(reportData);
        mimeType = 'text/csv';
        filename = `${reportData.caseNumber}_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
        break;
      
      default: // txt
        content = generateTextReport(reportData);
        mimeType = 'text/plain';
        filename = `${reportData.caseNumber}_${reportData.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        break;
    }

    // Return the file as a blob
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(content).toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      createErrorResponse('Failed to export report'),
      { status: 500 }
    );
  }
}

function generateTextReport(report: any): string {
  return `
FORENSIC ANALYSIS REPORT
========================

Title: ${report.title}
Case Number: ${report.caseNumber}
Case Name: ${report.caseName}
Investigating Officer: ${report.officer}
Date Generated: ${report.dateGenerated}
Status: ${report.status.toUpperCase()}
Report Type: ${report.reportType}

EXECUTIVE SUMMARY
=================
${report.summary || `This forensic analysis report presents the findings from the investigation of ${report.caseName}. The analysis was conducted on digital evidence extracted from multiple devices as part of case ${report.caseNumber}. This report contains ${report.findings} significant findings across ${report.sections?.length || 0} analytical sections.`}

CASE INFORMATION
================
Case Number: ${report.caseNumber}
Case Name: ${report.caseName}
Report Type: ${report.reportType}
Total Findings: ${report.findings}
Analysis Sections: ${report.sections?.length || 0}
Report Status: ${report.status}

${report.keyFindings && report.keyFindings.length > 0 ? `
KEY FINDINGS
============
${report.keyFindings.map((finding: string, index: number) => `${index + 1}. ${finding}`).join('\n')}
` : ''}

${report.sections && report.sections.length > 0 ? `
REPORT SECTIONS
===============
${report.sections.map((section: string, index: number) => `${index + 1}. ${section}`).join('\n')}
` : ''}

---
This report was generated automatically by the UFDR Forensic Analysis System.
Report ID: ${report.id}
Generated: ${new Date().toLocaleString()}
  `.trim();
}

function generateHtmlReport(report: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #007bff;
            margin-bottom: 10px;
        }
        .badge {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            display: inline-block;
        }
        .status-final { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        .status-submitted { background: #cce7ff; color: #004085; border-color: #80bdff; }
        .status-draft { background: #fff3cd; color: #856404; border-color: #ffecb5; }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #495057;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #6c757d;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .summary-box {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
        }
        .finding-item {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #007bff;
        }
        .finding-number {
            background: #007bff;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${report.title}</h1>
        <p>Forensic Analysis Report</p>
        <span class="badge status-${report.status}">${report.status.toUpperCase()}</span>
    </div>

    <div class="info-grid">
        <div class="info-item">
            <div class="info-label">Case Number</div>
            <div>${report.caseNumber}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Investigating Officer</div>
            <div>${report.officer}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Date Generated</div>
            <div>${report.dateGenerated}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total Pages</div>
            <div>${report.pages}</div>
        </div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="summary-box">
            <p>${report.summary || `This forensic analysis report presents the findings from the investigation of ${report.caseName}. The analysis was conducted on digital evidence extracted from multiple devices as part of case ${report.caseNumber}. This report contains ${report.findings} significant findings across ${report.sections?.length || 0} analytical sections.`}</p>
        </div>
    </div>

    <div class="section">
        <h2>Case Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Case Name</div>
                <div>${report.caseName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Report Type</div>
                <div>${report.reportType}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Findings</div>
                <div>${report.findings}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Analysis Sections</div>
                <div>${report.sections?.length || 0}</div>
            </div>
        </div>
    </div>

    ${report.keyFindings && report.keyFindings.length > 0 ? `
    <div class="section">
        <h2>Key Findings</h2>
        ${report.keyFindings.map((finding: string, index: number) => `
        <div class="finding-item">
            <span class="finding-number">${index + 1}</span>
            ${finding}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.sections && report.sections.length > 0 ? `
    <div class="section">
        <h2>Report Sections</h2>
        <ol>
            ${report.sections.map((section: string) => `<li>${section}</li>`).join('')}
        </ol>
    </div>
    ` : ''}

    <div class="footer">
        <p>This report was generated automatically by the UFDR Forensic Analysis System.</p>
        <p>Report ID: ${report.id} • Generated: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `.trim();
}

function generateCsvReport(report: any): string {
  const headers = ['Field', 'Value'];
  const rows = [
    ['Title', report.title],
    ['Case Number', report.caseNumber],
    ['Case Name', report.caseName],
    ['Officer', report.officer],
    ['Date Generated', report.dateGenerated],
    ['Status', report.status],
    ['Report Type', report.reportType],
    ['Total Findings', report.findings.toString()],
    ['Pages', report.pages.toString()],
    ['Sections Count', (report.sections?.length || 0).toString()],
  ];

  if (report.sections && report.sections.length > 0) {
    report.sections.forEach((section: string, index: number) => {
      rows.push([`Section ${index + 1}`, section]);
    });
  }

  if (report.keyFindings && report.keyFindings.length > 0) {
    report.keyFindings.forEach((finding: string, index: number) => {
      rows.push([`Key Finding ${index + 1}`, finding]);
    });
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}