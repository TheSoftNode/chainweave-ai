"use client"

import { 
  DashboardLayout,
  CollectionFilters,
  CollectionGrid,
  CollectionStats 
} from "@/components/dashboard"

export default function CollectionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              My Collection
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage your NFT collection
            </p>
          </div>
        </div>
        
        <CollectionStats />
        <CollectionFilters />
        <CollectionGrid />
      </div>
    </DashboardLayout>
  )
}
