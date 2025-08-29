import { 
  AIGeneratorForm,
  DashboardLayout,
  GeneratedGallery 
} from "@/components/dashboard"

export default function GeneratePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            AI Art Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create unique artwork using advanced AI algorithms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AIGeneratorForm />
          <GeneratedGallery />
        </div>
      </div>
    </DashboardLayout>
  )
}
