"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Download, Heart, Share2, RefreshCw, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

const generatedImages = [
  {
    id: 1,
    prompt: "Cyberpunk dragon in neon city",
    style: "Cyberpunk",
    timestamp: "2 minutes ago",
    liked: false,
    status: "completed"
  },
  {
    id: 2,
    prompt: "Abstract geometric patterns",
    style: "Abstract",
    timestamp: "5 minutes ago",
    liked: true,
    status: "completed"
  },
  {
    id: 3,
    prompt: "Mystical forest with glowing mushrooms",
    style: "Fantasy",
    timestamp: "10 minutes ago",
    liked: false,
    status: "completed"
  },
  {
    id: 4,
    prompt: "Futuristic robot warrior",
    style: "Digital Art",
    timestamp: "15 minutes ago",
    liked: true,
    status: "completed"
  }
]

export function GeneratedGallery() {
  const [images, setImages] = useState(generatedImages)

  const toggleLike = (id: number) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, liked: !img.liked } : img
    ))
  }

  const deleteImage = (id: number) => {
    setImages(images.filter(img => img.id !== id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Gallery Header */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Gallery</span>
            <Badge variant="outline" className="text-primary border-primary/20">
              {images.length} Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your AI-generated artworks will appear here. You can save, edit, or mint them as NFTs.
          </p>
        </CardContent>
      </Card>

      {/* Generated Images Grid */}
      <div className="space-y-4">
        {images.length === 0 ? (
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No artworks yet</h3>
              <p className="text-muted-foreground">
                Generate your first AI artwork to see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    {/* Image Preview */}
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-primary/20 flex-shrink-0">
                      <span className="text-2xl">🎨</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{image.prompt}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {image.style}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {image.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="w-4 h-4 mr-2" />
                              Create NFT
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteImage(image.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleLike(image.id)}
                        >
                          <Heart 
                            className={`w-3 h-3 mr-1 ${
                              image.liked ? 'fill-red-500 text-red-500' : ''
                            }`} 
                          />
                          {image.liked ? 'Liked' : 'Like'}
                        </Button>

                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Save
                        </Button>

                        <Button size="sm" className="h-7 px-3 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          Mint NFT
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Generation Tips */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">💡 Generation Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Be specific:</strong> Include details about colors, composition, and mood</p>
            <p><strong>Use styles:</strong> Mention art styles like "cyberpunk", "minimalist", or "watercolor"</p>
            <p><strong>Add context:</strong> Describe the setting, lighting, and atmosphere</p>
            <p><strong>Experiment:</strong> Try different creativity levels for unique results</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
