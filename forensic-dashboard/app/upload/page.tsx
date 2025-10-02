import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadSystem } from "@/components/upload-system"

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6 ">
        <div className="flex items-center justify-between border-1 ">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Upload UFDR Files</h1>
            <p className="text-muted-foreground text-pretty">
              Upload and process Universal Forensic Data Report files for analysis
            </p>
          </div>
        </div>

        <UploadSystem />
      </div>
    </DashboardLayout>
  )
}
