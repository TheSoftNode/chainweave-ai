"use client"

import { motion } from "framer-motion"
import { MoreHorizontal, Eye, Share2, Download, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const nftCollection = [
  {
    id: 1,
    name: "Cosmic Dream #001",
    description: "A surreal journey through space and time",
    image: "/api/placeholder/300/300",
    price: "0.5 ETH",
    likes: 24,
    views: 156,
    chain: "ZetaChain",
    status: "minted",
    rarity: "Rare"
  },
  {
    id: 2,
    name: "Abstract Emotions #042",
    description: "Digital representation of human feelings",
    image: "/api/placeholder/300/300",
    price: "0.3 ETH",
    likes: 18,
    views: 89,
    chain: "Ethereum",
    status: "listed",
    rarity: "Common"
  },
  {
    id: 3,
    name: "Neural Network Art #128",
    description: "AI-generated masterpiece with complex patterns",
    image: "/api/placeholder/300/300",
    price: "0.8 ETH",
    likes: 47,
    views: 234,
    chain: "Polygon",
    status: "sold",
    rarity: "Epic"
  },
  {
    id: 4,
    name: "Digital Landscape #067",
    description: "Breathtaking virtual world scenery",
    image: "/api/placeholder/300/300",
    price: "0.4 ETH",
    likes: 31,
    views: 178,
    chain: "ZetaChain",
    status: "minted",
    rarity: "Uncommon"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "minted":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
    case "listed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    case "sold":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Common":
      return "text-gray-500"
    case "Uncommon":
      return "text-emerald-500"
    case "Rare":
      return "text-blue-500"
    case "Epic":
      return "text-purple-500"
    case "Legendary":
      return "text-orange-500"
    default:
      return "text-gray-500"
  }
}

export function NFTGallery() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My NFT Collection</span>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nftCollection.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/20">
                  <div className="relative">
                    {/* NFT Image */}
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎨</span>
                      </div>
                    </div>
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      className={`absolute top-2 left-2 ${getStatusColor(nft.status)}`}
                    >
                      {nft.status}
                    </Badge>

                    {/* More Actions */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>Set Price</DropdownMenuItem>
                          <DropdownMenuItem>Transfer</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Title and Rarity */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{nft.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {nft.description}
                          </p>
                        </div>
                        <Badge variant="outline" className={`ml-2 text-xs ${getRarityColor(nft.rarity)}`}>
                          {nft.rarity}
                        </Badge>
                      </div>

                      {/* Price and Stats */}
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{nft.price}</div>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{nft.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{nft.views}</span>
                          </div>
                        </div>
                      </div>

                      {/* Chain */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">{nft.chain}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
