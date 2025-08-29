"use client"

import { 
  DashboardLayout,
  WalletDashboard 
} from "@/components/dashboard"

export default function WalletPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Wallet
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your wallets, transactions, and blockchain settings
            </p>
          </div>
        </div>
        
        <WalletDashboard />
      </div>
    </DashboardLayout>
  )
}
