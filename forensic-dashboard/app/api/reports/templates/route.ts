import { NextRequest, NextResponse } from 'next/server';
import { createAPIResponse } from '@/lib/utils';

const reportTemplates = [
  {
    id: "standard",
    name: "Standard Forensic Report",
    description: "Comprehensive analysis report with all findings and evidence",
    sections: ["Executive Summary", "Device Information", "Data Analysis", "Findings", "Conclusions", "Appendices"],
    type: "standard",
  },
  {
    id: "court",
    name: "Court Submission Report",
    description: "Formal report formatted for legal proceedings and court submission",
    sections: [
      "Case Overview",
      "Methodology",
      "Chain of Custody",
      "Technical Analysis",
      "Evidence Summary",
      "Expert Opinion",
      "Certifications",
    ],
    type: "court",
  },
  {
    id: "summary",
    name: "Executive Summary",
    description: "High-level overview for supervisors and stakeholders",
    sections: ["Key Findings", "Risk Assessment", "Recommendations", "Next Steps"],
    type: "summary",
  },
  {
    id: "detailed",
    name: "Detailed Technical Report",
    description: "In-depth technical analysis for forensic specialists",
    sections: [
      "Technical Specifications",
      "Extraction Methods",
      "Data Recovery",
      "Analysis Techniques",
      "Detailed Findings",
      "Technical Appendices",
    ],
    type: "detailed",
  },
];

// GET all report templates
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(createAPIResponse({
      templates: reportTemplates,
    }));
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    );
  }
}