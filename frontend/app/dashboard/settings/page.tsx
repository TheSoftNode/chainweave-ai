"use client"

import { 
  DashboardLayout,
  SettingsPanel 
} from "@/components/dashboard"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account preferences and configurations
            </p>
          </div>
        </div>
        
        <SettingsPanel />
      </div>
    </DashboardLayout>
  )
}
