import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Calendar, User, Smartphone } from "lucide-react"

const reports = [
  {
    id: "RPT-2024-001",
    title: "Samsung Galaxy S21 - Drug Investigation",
    device: "Samsung Galaxy S21",
    officer: "Det. Johnson",
    date: "2024-01-15",
    status: "Completed",
    findings: 847,
    priority: "High",
  },
  {
    id: "RPT-2024-002",
    title: "iPhone 14 Pro - Financial Fraud Case",
    device: "iPhone 14 Pro",
    officer: "Det. Smith",
    date: "2024-01-14",
    status: "In Progress",
    findings: 1203,
    priority: "Medium",
  },
  {
    id: "RPT-2024-003",
    title: "OnePlus 9 - Cybercrime Investigation",
    device: "OnePlus 9",
    officer: "Det. Williams",
    date: "2024-01-13",
    status: "Completed",
    findings: 456,
    priority: "High",
  },
]

export function RecentReports() {
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
                    <Badge variant={report.priority === "High" ? "destructive" : "secondary"}>{report.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {report.officer}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {report.date}
                    </span>
                    <span>{report.findings} findings</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={report.status === "Completed" ? "secondary" : "outline"}>{report.status}</Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
