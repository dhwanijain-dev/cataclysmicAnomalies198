import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Phone, ImageIcon, AlertTriangle, TrendingUp, Database } from "lucide-react"

const stats = [
  {
    title: "Total Reports",
    value: "24",
    change: "+3 this week",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    title: "Messages Analyzed",
    value: "15,847",
    change: "+2,341 today",
    icon: MessageSquare,
    color: "text-green-600",
  },
  {
    title: "Call Records",
    value: "3,256",
    change: "+156 today",
    icon: Phone,
    color: "text-purple-600",
  },
  {
    title: "Media Files",
    value: "8,923",
    change: "+89 today",
    icon: ImageIcon,
    color: "text-orange-600",
  },
]

const alerts = [
  {
    type: "High Priority",
    message: "Suspicious crypto wallet addresses detected in recent messages",
    time: "5 minutes ago",
    severity: "high",
  },
  {
    type: "Pattern Match",
    message: "Multiple contacts using similar communication patterns",
    time: "1 hour ago",
    severity: "medium",
  },
  {
    type: "Location Alert",
    message: "Device activity detected in restricted area",
    time: "3 hours ago",
    severity: "high",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts and Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Security Alerts
            </CardTitle>
            <CardDescription>High-priority findings requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${
                    alert.severity === "high" ? "bg-destructive" : "bg-yellow-500"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>{alert.type}</Badge>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Processing Status
            </CardTitle>
            <CardDescription>Current analysis and processing activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Message Analysis</span>
                <Badge variant="secondary">Complete</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-full"></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Image Processing</span>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-3/4"></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Call Log Analysis</span>
                <Badge variant="outline">Queued</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-muted-foreground h-2 rounded-full w-1/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
