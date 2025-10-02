"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Eye, Calendar, User, Printer, Mail, Plus, Settings, BarChart3 } from "lucide-react"

interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  type: "standard" | "detailed" | "summary" | "court"
}

interface GeneratedReport {
  id: string
  title: string
  caseNumber: string
  officer: string
  dateGenerated: string
  status: "draft" | "final" | "submitted"
  type: string
  findings: number
  pages: number
}

const reportTemplates: ReportTemplate[] = [
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
]

const existingReports: GeneratedReport[] = [
  {
    id: "1",
    title: "Samsung Galaxy S21 - Drug Investigation Analysis",
    caseNumber: "CASE-2024-001",
    officer: "Det. Johnson",
    dateGenerated: "2024-01-15",
    status: "final",
    type: "Standard Forensic Report",
    findings: 847,
    pages: 45,
  },
  {
    id: "2",
    title: "iPhone 14 Pro - Financial Fraud Case Summary",
    caseNumber: "CASE-2024-002",
    officer: "Det. Smith",
    dateGenerated: "2024-01-14",
    status: "draft",
    type: "Executive Summary",
    findings: 1203,
    pages: 12,
  },
  {
    id: "3",
    title: "OnePlus 9 - Cybercrime Court Submission",
    caseNumber: "CASE-2024-003",
    officer: "Det. Williams",
    dateGenerated: "2024-01-13",
    status: "submitted",
    type: "Court Submission Report",
    findings: 456,
    pages: 78,
  },
]

export function ReportsSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportTitle, setReportTitle] = useState("")
  const [caseNumber, setCaseNumber] = useState("")
  const [officer, setOfficer] = useState("")
  const [description, setDescription] = useState("")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [reports, setReports] = useState<GeneratedReport[]>(existingReports)

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setSelectedSections(template.sections)
  }

  const handleSectionToggle = (section: string) => {
    setSelectedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportTitle || !caseNumber || !officer) return

    setIsGenerating(true)

    // Simulate report generation
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        title: reportTitle,
        caseNumber,
        officer,
        dateGenerated: new Date().toISOString().split("T")[0],
        status: "draft",
        type: selectedTemplate.name,
        findings: Math.floor(Math.random() * 1000) + 100,
        pages: Math.floor(Math.random() * 50) + 10,
      }

      setReports((prev) => [newReport, ...prev])
      setIsGenerating(false)

      // Reset form
      setReportTitle("")
      setCaseNumber("")
      setOfficer("")
      setDescription("")
      setSelectedTemplate(null)
      setSelectedSections([])
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "final":
        return "bg-green-100 text-green-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="existing">Existing Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Configuration */}
            <Card className="border-1 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Generate New Report
                </CardTitle>
                <CardDescription>Configure and generate a comprehensive forensic analysis report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-title">Report Title</Label>
                  <Input
                    id="report-title"
                    placeholder="e.g., Samsung Galaxy S21 - Drug Investigation Analysis"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-number">Case Number</Label>
                    <Input
                      id="case-number"
                      placeholder="CASE-2024-001"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officer">Investigating Officer</Label>
                    <Input
                      id="officer"
                      placeholder="Det. Johnson"
                      value={officer}
                      onChange={(e) => setOfficer(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Report Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the investigation and report purpose..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Report Template</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="space-y-2">
                    <Label>Report Sections</Label>
                    <div className="space-y-2">
                      {selectedTemplate.sections.map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <Checkbox
                            id={section}
                            checked={selectedSections.includes(section)}
                            onCheckedChange={() => handleSectionToggle(section)}
                          />
                          <Label htmlFor={section} className="text-sm">
                            {section}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedTemplate || !reportTitle || !caseNumber || !officer || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card className="border-1 border-black"> 
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Report Preview
                </CardTitle>
                <CardDescription>Preview of the report structure and content</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium">Included Sections:</h5>
                      <div className="space-y-1">
                        {selectedSections.map((section, index) => (
                          <div key={section} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            <span>{section}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>Estimated report length: {selectedSections.length * 8 - 15} pages</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a template to preview the report structure</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="existing" className="space-y-6">
          <Card className="border-1 border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generated Reports
              </CardTitle>
              <CardDescription>Manage and download your forensic analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{report.title}</h4>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {report.officer}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.dateGenerated}
                          </span>
                          <span>{report.findings} findings</span>
                          <span>{report.pages} pages</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="border-1 border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Report Templates
              </CardTitle>
              <CardDescription>Manage and customize report templates for different use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium mb-2">Sections:</h5>
                          <div className="space-y-1">
                            {template.sections.map((section, index) => (
                              <div key={section} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">{index + 1}.</span>
                                <span>{section}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <Button variant="outline" size="sm">
                            Customize
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
