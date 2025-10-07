"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Calendar, User, Smartphone, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Report {
  id: string
  title: string
  reportType: string
  caseNumber: string
  caseName: string
  dateGenerated: string
  officer: string
  status: string
  findings: number
  pages: number
}

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getReports(1, 5) // Get first 5 reports
      
      if (response.success && response.data) {
        setReports(response.data.reports)
      } else {
        throw new Error(response.message || 'Failed to fetch reports')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports'
      setError(errorMessage)
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (reportId: string) => {
    // TODO: Navigate to report detail page
    toast({
      title: "View Report",
      description: `Opening report ${reportId}`,
    })
  }

  const handleDownloadReport = (reportId: string) => {
    // TODO: Implement report download
    toast({
      title: "Download Report", 
      description: `Downloading report ${reportId}`,
    })
  }

  const getPriorityFromStatus = (status: string): "default" | "secondary" | "destructive" => {
    switch (status?.toLowerCase()) {
      case 'final':
      case 'submitted':
        return 'secondary'
      case 'draft':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'final':
      case 'submitted':
        return 'secondary'
      case 'draft':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <Card className="border-1 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent UFDR Reports
          </CardTitle>
          <CardDescription>Latest forensic extraction reports and analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading reports...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-1 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent UFDR Reports
          </CardTitle>
          <CardDescription>Latest forensic extraction reports and analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-1 border-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Recent UFDR Reports
        </CardTitle>
        <CardDescription>Latest forensic extraction reports and analysis results</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No reports found</div>
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
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{report.title}</h4>
                      <Badge variant={getPriorityFromStatus(report.status)}>{report.reportType}</Badge>
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
                      <span>Case: {report.caseNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleViewReport(report.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
