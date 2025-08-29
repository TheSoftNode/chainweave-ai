"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Wand2, Loader2, Sparkles, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const artStyles = [
  { id: "digital-art", name: "Digital Art", popular: true },
  { id: "cyberpunk", name: "Cyberpunk", popular: true },
  { id: "abstract", name: "Abstract", popular: false },
  { id: "fantasy", name: "Fantasy", popular: true },
  { id: "minimalist", name: "Minimalist", popular: false },
  { id: "retro", name: "Retro Wave", popular: false },
  { id: "surreal", name: "Surreal", popular: false },
  { id: "photorealistic", name: "Photorealistic", popular: true }
]

const aspectRatios = [
  { id: "square", name: "Square (1:1)", value: "1:1" },
  { id: "portrait", name: "Portrait (3:4)", value: "3:4" },
  { id: "landscape", name: "Landscape (4:3)", value: "4:3" },
  { id: "wide", name: "Wide (16:9)", value: "16:9" }
]

export function AIGeneratorForm() {
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("digital-art")
  const [aspectRatio, setAspectRatio] = useState("square")
  const [creativity] = useState([70])
  const [quality] = useState([80])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setGenerating(false)
    }, 5000)
  }

  const promptSuggestions = [
    "A majestic dragon flying over a cyberpunk city",
    "Abstract geometric patterns in neon colors",
    "A mystical forest with glowing mushrooms",
    "Futuristic robot in a post-apocalyptic world"
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Main Generator Card */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <span>AI Art Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your artwork</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the artwork you want to create in detail..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              Be descriptive! Include style, colors, mood, and composition details.
            </p>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <Label>Quick Suggestions</Label>
            <div className="grid grid-cols-1 gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto p-3 text-xs"
                  onClick={() => setPrompt(suggestion)}
                >
                  <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating artwork...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate Artwork
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <span>Advanced Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-3">
                <Label>Art Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {artStyles.map((style) => (
                    <Button
                      key={style.id}
                      variant={selectedStyle === style.id ? "default" : "outline"}
                      size="sm"
                      className="justify-start h-auto p-3"
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">{style.name}</span>
                        {style.popular && (
                          <Badge variant="secondary" className="text-xs px-1">Hot</Badge>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              <div className="space-y-3">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((ratio) => (
                      <SelectItem key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Creativity Level</Label>
                    <span className="text-sm text-muted-foreground">{creativity[0]}%</span>
                  </div>
                  <Slider
                    value={creativity}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values create more unique and experimental results
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Quality</Label>
                    <span className="text-sm text-muted-foreground">{quality[0]}%</span>
                  </div>
                  <Slider
                    value={quality}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher quality takes longer but produces better results
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
