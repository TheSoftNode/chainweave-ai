"use client"

import { motion } from "framer-motion"
import { Eye, Heart, Share2, Download, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export function NFTPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Preview Card */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-primary" />
            <span>Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NFT Image */}
          <div className="aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <p className="text-muted-foreground">Your NFT will appear here</p>
            </div>
          </div>

          {/* NFT Info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold">Untitled NFT</h3>
              <p className="text-muted-foreground text-sm">
                Add a name and description to see preview
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm">
                    CW
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Creator Wallet</p>
                  <p className="text-xs text-muted-foreground">0x1234...5678</p>
                </div>
              </div>
              <Badge variant="outline" className="text-primary border-primary/20">
                ZetaChain
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">0</span>
                </div>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div>
                <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">0</span>
                </div>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
              <div>
                <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">0</span>
                </div>
                <p className="text-xs text-muted-foreground">Shares</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-background/50 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Chain</p>
              <p className="text-sm font-medium">ZetaChain</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Royalty</p>
              <p className="text-sm font-medium">5%</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Token Standard</p>
              <p className="text-sm font-medium">ERC-721</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
              <p className="text-sm font-medium">Art</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download Preview
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Share2 className="w-4 h-4 mr-2" />
            Share Preview
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
