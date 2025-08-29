import { 
  CreateNFTForm,
  DashboardLayout,
  NFTPreview 
} from "@/components/dashboard"


export default function CreateNFTPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Create New NFT
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload your artwork or generate with AI to mint a unique NFT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CreateNFTForm />
          <NFTPreview />
        </div>
      </div>
    </DashboardLayout>
  )
}
