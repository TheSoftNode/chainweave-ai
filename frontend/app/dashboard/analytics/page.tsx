"use client"

import { 
  DashboardLayout,
  AnalyticsOverview 
} from "@/components/dashboard"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your NFT performance and engagement metrics
            </p>
          </div>
        </div>
        
        <AnalyticsOverview />
      </div>
    </DashboardLayout>
  )
}
