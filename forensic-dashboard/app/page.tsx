import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { QueryInterface } from "@/components/query-interface"
import { RecentReports } from "@/components/recent-reports"

export default function ForensicDashboard() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Forensic Data Analysis Dashboard</h1>
            <p className="text-muted-foreground text-pretty">
              AI-powered analysis of UFDR reports for law enforcement investigations
            </p>
          </div>
        </div>

        <QueryInterface />
        {/* <DashboardOverview /> */}
        <RecentReports />
      </div>
    </DashboardLayout>
  )
}
