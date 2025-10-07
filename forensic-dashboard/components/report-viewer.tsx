"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  Building, 
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  Share2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface ReportViewerProps {
  report: GeneratedReport | null
  isOpen: boolean
  onClose: () => void
}

export function ReportViewer({ report, isOpen, onClose }: ReportViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  if (!report) return null

  const handleDownload = async (format: 'pdf' | 'docx' | 'html') => {
    setIsDownloading(true)
    try {
      // Create download data
      const downloadData = {
        reportId: report.id,
        format,
        includeImages: true,
        includeMetadata: true
      }

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadData),
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
      
      // Fallback: Generate a simple text report
      const reportContent = generateReportContent(report)
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.caseNumber}_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Downloaded as Text",
        description: "Report downloaded as plain text file.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    try {
      const printContent = printRef.current
      if (printContent) {
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
                  .finding { border-left: 3px solid #007bff; padding-left: 10px; margin: 10px 0; }
                  @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                  }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
          printWindow.close()
        }
      }

      toast({
        title: "Print Job Sent",
        description: "Report has been sent to the printer.",
      })
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Print Failed",
        description: "Failed to print the report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleShare = async () => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "final":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "submitted":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "draft":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {report.title}
            </DialogTitle>
            <DialogDescription>
              Case {report.caseNumber} • Generated on {report.dateGenerated}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('docx')}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-1" />
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div ref={printRef} className="space-y-6">
            {/* Report Header */}
            <div className="header">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{report.title}</h1>
                  <p className="text-muted-foreground">Forensic Analysis Report</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(report.status)}
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Case Number</p>
                    <p className="text-sm text-muted-foreground">{report.caseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Officer</p>
                    <p className="text-sm text-muted-foreground">{report.officer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date Generated</p>
                    <p className="text-sm text-muted-foreground">{report.dateGenerated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Pages</p>
                    <p className="text-sm text-muted-foreground">{report.pages}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="section">
              <h2 className="text-xl font-semibold mb-3">Executive Summary</h2>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {report.summary || `This forensic analysis report presents the findings from the investigation of ${report.caseName}. The analysis was conducted on digital evidence extracted from multiple devices as part of case ${report.caseNumber}. This report contains ${report.findings} significant findings across ${report.sections?.length || 0} analytical sections.`}
                </p>
              </div>
            </div>

            {/* Case Information */}
            <div className="section">
              <h2 className="text-xl font-semibold mb-3">Case Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Case Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Case Number:</span>
                      <span className="text-sm font-medium">{report.caseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Case Name:</span>
                      <span className="text-sm font-medium">{report.caseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Report Type:</span>
                      <span className="text-sm font-medium">{report.reportType}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Investigation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Findings:</span>
                      <span className="text-sm font-medium">{report.findings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Analysis Sections:</span>
                      <span className="text-sm font-medium">{report.sections?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Report Status:</span>
                      <Badge variant="outline" className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Key Findings */}
            {report.keyFindings && report.keyFindings.length > 0 && (
              <div className="section">
                <h2 className="text-xl font-semibold mb-3">Key Findings</h2>
                <div className="space-y-3">
                  {report.keyFindings.map((finding, index) => (
                    <div key={index} className="finding">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Sections */}
            {report.sections && report.sections.length > 0 && (
              <div className="section">
                <h2 className="text-xl font-semibold mb-3">Report Sections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {report.sections.map((section, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <div className="text-sm text-muted-foreground">{index + 1}.</div>
                      <div className="text-sm">{section}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <Separator />
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>This report was generated automatically by the UFDR Forensic Analysis System.</p>
              <p>Report ID: {report.id} • Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to generate text content for fallback download
function generateReportContent(report: GeneratedReport): string {
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
${report.keyFindings.map((finding, index) => `${index + 1}. ${finding}`).join('\n')}
` : ''}

${report.sections && report.sections.length > 0 ? `
REPORT SECTIONS
===============
${report.sections.map((section, index) => `${index + 1}. ${section}`).join('\n')}
` : ''}

---
This report was generated automatically by the UFDR Forensic Analysis System.
Report ID: ${report.id}
Generated: ${new Date().toLocaleString()}
  `.trim()
}