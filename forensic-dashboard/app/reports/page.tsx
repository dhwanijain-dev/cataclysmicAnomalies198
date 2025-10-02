import { DashboardLayout } from "@/components/dashboard-layout"
import { ReportsSystem } from "@/components/reports-system"

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Forensic Reports</h1>
            <p className="text-muted-foreground text-pretty">
              Generate comprehensive forensic analysis reports for legal proceedings
            </p>
          </div>
        </div>

        <ReportsSystem />
      </div>
    </DashboardLayout>
  )
}
