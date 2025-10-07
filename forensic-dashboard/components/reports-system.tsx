"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Printer, 
  Mail, 
  Plus, 
  Settings, 
  BarChart3, 
  Loader2,
  Share2,
  ExternalLink
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ReportViewer } from "@/components/report-viewer"

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
  caseName: string
  officer: string
  dateGenerated: string
  status: "draft" | "final" | "submitted"
  reportType: string
  findings: number
  pages: number
  sections?: string[]
  summary?: string
  keyFindings?: string[]
  caseId: string
}

interface Case {
  id: string
  caseNumber: string
  caseName: string
}

export function ReportsSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportTitle, setReportTitle] = useState("")
  const [caseNumber, setCaseNumber] = useState("")
  const [officer, setOfficer] = useState("")
  const [description, setDescription] = useState("")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const { toast } = useToast()

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch reports, templates, and cases in parallel
      const [reportsResponse, templatesResponse, casesResponse] = await Promise.all([
        apiClient.getReports(),
        apiClient.getReportTemplates(),
        apiClient.getCases()
      ])

      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data.reports)
      }

      if (templatesResponse.success && templatesResponse.data) {
        setReportTemplates(templatesResponse.data.templates)
      } else {
        // Fallback to default templates if API fails
        setReportTemplates(defaultTemplates)
      }

      if (casesResponse.success && casesResponse.data) {
        // Handle different response formats
        const casesData = Array.isArray(casesResponse.data) 
          ? casesResponse.data 
          : (casesResponse.data as any).cases || []
        setCases(casesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      
      // Set default templates on error
      setReportTemplates(defaultTemplates)
      
      toast({
        title: "Error",
        description: "Failed to load some data. Using defaults where possible.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Default templates if API doesn't work
  const defaultTemplates: ReportTemplate[] = [
    {
      id: "standard",
      name: "Standard Investigation Report",
      description: "Comprehensive forensic analysis for general investigations",
      type: "standard",
      sections: [
        "Executive Summary",
        "Case Information", 
        "Device Analysis",
        "Communication Analysis",
        "Media Analysis",
        "Timeline Reconstruction",
        "Key Findings",
        "Conclusions",
        "Appendices"
      ]
    },
    {
      id: "court",
      name: "Court Presentation Report", 
      description: "Formal report suitable for legal proceedings",
      type: "court",
      sections: [
        "Expert Qualifications",
        "Executive Summary",
        "Evidence Handling Chain",
        "Methodology",
        "Findings and Analysis", 
        "Technical Appendix",
        "Glossary of Terms"
      ]
    },
    {
      id: "summary",
      name: "Executive Summary Report",
      description: "High-level overview for management and stakeholders", 
      type: "summary",
      sections: [
        "Executive Summary",
        "Key Findings",
        "Risk Assessment",
        "Recommendations",
        "Next Steps"
      ]
    },
    {
      id: "detailed",
      name: "Detailed Technical Report",
      description: "In-depth technical analysis for forensic specialists",
      type: "detailed", 
      sections: [
        "Technical Overview",
        "Device Specifications",
        "Extraction Methods",
        "Data Recovery",
        "Network Analysis",
        "Artifact Analysis",
        "Technical Findings",
        "Tools and Techniques",
        "Raw Data Appendix"
      ]
    }
  ]

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setSelectedSections(template.sections)
  }

  const handleSectionToggle = (section: string) => {
    setSelectedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportTitle || !selectedCaseId || !officer) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a case.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await apiClient.createReport({
        reportName: reportTitle,
        reportType: selectedTemplate.name,
        caseId: selectedCaseId,
        officer,
        sections: selectedSections,
        content: {
          summary: description,
          keyFindings: [],
        },
        status: 'draft'
      })

      if (response.success && response.data) {
        setReports((prev) => [response.data, ...prev])
        
        toast({
          title: "Success",
          description: "Report created successfully!",
        })

        // Reset form
        setReportTitle("")
        setSelectedCaseId("")
        setOfficer("")
        setDescription("")
        setSelectedTemplate(null)
        setSelectedSections([])
      } else {
        throw new Error(response.error || 'Failed to create report')
      }
    } catch (error) {
      console.error('Error creating report:', error)
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
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

  const handleViewReport = (report: GeneratedReport) => {
    setSelectedReport(report)
    setIsViewerOpen(true)
  }

  const handleDownloadReport = async (report: GeneratedReport, format: 'txt' | 'html' | 'csv' | 'json' = 'txt') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          format,
          includeImages: true,
          includeMetadata: true
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.caseNumber}_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download Started",
          description: `Report downloaded as ${format.toUpperCase()}.`,
        })
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePrintReport = (report: GeneratedReport) => {
    // Open the report in a new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${report.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .badge { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${report.title}</h1>
              <p>Case: ${report.caseNumber} - ${report.caseName}</p>
              <p>Officer: ${report.officer} | Date: ${report.dateGenerated}</p>
              <span class="badge">${report.status.toUpperCase()}</span>
            </div>
            <div class="section">
              <h2>Executive Summary</h2>
              <p>${report.summary || `This forensic analysis report presents the findings from the investigation of ${report.caseName}.`}</p>
            </div>
            <div class="section">
              <h2>Report Information</h2>
              <p><strong>Report Type:</strong> ${report.reportType}</p>
              <p><strong>Total Findings:</strong> ${report.findings}</p>
              <p><strong>Pages:</strong> ${report.pages}</p>
            </div>
            ${report.keyFindings && report.keyFindings.length > 0 ? `
            <div class="section">
              <h2>Key Findings</h2>
              <ol>
                ${report.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
              </ol>
            </div>
            ` : ''}
            ${report.sections && report.sections.length > 0 ? `
            <div class="section">
              <h2>Report Sections</h2>
              <ol>
                ${report.sections.map(section => `<li>${section}</li>`).join('')}
              </ol>
            </div>
            ` : ''}
            <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>This report was generated automatically by the UFDR Forensic Analysis System.</p>
              <p>Report ID: ${report.id} | Generated: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()

      toast({
        title: "Print Job Sent",
        description: "Report has been sent to the printer.",
      })
    }
  }

  const handleShareReport = async (report: GeneratedReport) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: report.title,
          text: `Forensic Report: ${report.title} (Case: ${report.caseNumber})`,
          url: window.location.href
        })
      } else {
        // Fallback: Copy to clipboard
        const shareText = `Forensic Report: ${report.title}\nCase: ${report.caseNumber}\nOfficer: ${report.officer}\nDate: ${report.dateGenerated}`
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Copied to Clipboard",
          description: "Report details copied to clipboard.",
        })
      }
    } catch (error) {
      console.error('Share error:', error)
      toast({
        title: "Share Failed",
        description: "Failed to share the report.",
        variant: "destructive",
      })
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

                <div className="space-y-2">
                  <Label htmlFor="case-selection">Select Case</Label>
                  <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((case_) => (
                        <SelectItem key={case_.id} value={case_.id}>
                          {case_.caseNumber} - {case_.caseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  disabled={!selectedTemplate || !reportTitle || !selectedCaseId || !officer || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Report
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading reports...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-sm">Create your first report to get started</p>
                </div>
              ) : (
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          title="View Report"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadReport(report, 'html')}
                          title="Download as HTML"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePrintReport(report)}
                          title="Print Report"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareReport(report)}
                          title="Share Report"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading templates...</span>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Viewer Dialog */}
      <ReportViewer
        report={selectedReport}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false)
          setSelectedReport(null)
        }}
      />
    </div>
  )
}
