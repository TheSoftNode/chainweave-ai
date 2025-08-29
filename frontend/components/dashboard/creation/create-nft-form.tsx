"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, Palette, Zap, Image as ImageIcon, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const chains = [
  { id: "zetachain", name: "ZetaChain", color: "bg-emerald-500" },
  { id: "ethereum", name: "Ethereum", color: "bg-blue-500" },
  { id: "polygon", name: "Polygon", color: "bg-purple-500" },
  { id: "bsc", name: "BSC", color: "bg-yellow-500" }
]

const aiStyles = [
  "Abstract Art", "Digital Painting", "Cyberpunk", "Fantasy", 
  "Minimalist", "Retro", "Surreal", "Photorealistic"
]

export function CreateNFTForm() {
  const [creationMethod, setCreationMethod] = useState<"upload" | "ai">("upload")
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    chain: "zetachain",
    royalty: "5",
    unlockable: false,
    aiPrompt: "",
    aiStyle: ""
  })

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setGenerating(false)
    }, 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-primary" />
            <span>Create Your NFT</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creation Method */}
          <Tabs value={creationMethod} onValueChange={(value) => setCreationMethod(value as "upload" | "ai")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Generate</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload your artwork</h3>
                <p className="text-muted-foreground mb-4">PNG, JPG, GIF, SVG or MP4. Max 100MB.</p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the artwork you want to create..."
                    value={formData.aiPrompt}
                    onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="style">Art Style</Label>
                  <Select value={formData.aiStyle} onValueChange={(value) => setFormData({ ...formData, aiStyle: value })}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select art style" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiStyles.map((style) => (
                        <SelectItem key={style} value={style.toLowerCase().replace(" ", "-")}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!formData.aiPrompt || generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* NFT Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">NFT Details</h3>
            
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter NFT name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your NFT"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blockchain Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Blockchain & Settings</h3>
            
            <div>
              <Label>Select Chain</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {chains.map((chain) => (
                  <Button
                    key={chain.id}
                    variant={formData.chain === chain.id ? "default" : "outline"}
                    className="justify-start h-auto p-3"
                    onClick={() => setFormData({ ...formData, chain: chain.id })}
                  >
                    <div className={`w-3 h-3 rounded-full ${chain.color} mr-2`} />
                    {chain.name}
                    {chain.id === "zetachain" && (
                      <Badge variant="secondary" className="ml-auto">Native</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="royalty">Royalty Percentage</Label>
              <Input
                id="royalty"
                type="number"
                min="0"
                max="50"
                placeholder="5"
                value={formData.royalty}
                onChange={(e) => setFormData({ ...formData, royalty: e.target.value })}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage you'll earn from secondary sales (0-50%)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Unlockable Content</Label>
                <p className="text-xs text-muted-foreground">
                  Include special content for the owner
                </p>
              </div>
              <Switch
                checked={formData.unlockable}
                onCheckedChange={(checked) => setFormData({ ...formData, unlockable: checked })}
              />
            </div>
          </div>

          {/* Create Button */}
          <Button className="w-full" size="lg">
            <Palette className="w-4 h-4 mr-2" />
            Create NFT
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
