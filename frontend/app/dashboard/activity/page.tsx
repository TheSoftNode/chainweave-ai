"use client"

import { 
  DashboardLayout,
  ActivityFeed 
} from "@/components/dashboard"

export default function ActivityPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Activity
            </h1>
            <p className="text-muted-foreground mt-2">
              Track all your NFT activities and notifications
            </p>
          </div>
        </div>
        
        <ActivityFeed />
      </div>
    </DashboardLayout>
  )
}
