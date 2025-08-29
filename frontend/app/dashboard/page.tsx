import { 
  DashboardHeader,
  StatsCards,
  QuickActions,
  RecentActivity,
  NFTGallery,
  DashboardLayout 
} from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />
        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <NFTGallery />
          </div>
          
          <div className="space-y-6">
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
