import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalysisEngine } from "@/components/analysis-engine"

export default function AnalysisPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">AI Data Analysis</h1>
            <p className="text-muted-foreground text-pretty">
              Advanced AI-powered analysis of forensic data with natural language queries
            </p>
          </div>
        </div>

        <AnalysisEngine />
      </div>
    </DashboardLayout>
  )
}
