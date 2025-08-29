"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, Heart, Share2, MoreHorizontal, ExternalLink, Edit, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

const nftCollection = [
  {
    id: 1,
    name: "Cosmic Dream #001",
    description: "A surreal journey through space and time",
    price: "0.5 ETH",
    usdPrice: "$847.50",
    likes: 24,
    views: 156,
    chain: "ZetaChain",
    status: "Listed",
    category: "Art",
    rarity: "Rare",
    dateCreated: "2024-01-15"
  },
  {
    id: 2,
    name: "Abstract Emotions #042",
    description: "Digital representation of human feelings",
    price: "0.3 ETH",
    usdPrice: "$508.50",
    likes: 18,
    views: 89,
    chain: "Ethereum",
    status: "Owned",
    category: "Art",
    rarity: "Common",
    dateCreated: "2024-01-10"
  },
  {
    id: 3,
    name: "Neural Network Art #128",
    description: "AI-generated masterpiece with complex patterns",
    price: "0.8 ETH",
    usdPrice: "$1,356.00",
    likes: 47,
    views: 234,
    chain: "Polygon",
    status: "Sold",
    category: "AI Art",
    rarity: "Epic",
    dateCreated: "2024-01-08"
  },
  {
    id: 4,
    name: "Digital Landscape #067",
    description: "Breathtaking virtual world scenery",
    price: "0.4 ETH",
    usdPrice: "$678.00",
    likes: 31,
    views: 178,
    chain: "ZetaChain",
    status: "Listed",
    category: "Photography",
    rarity: "Uncommon",
    dateCreated: "2024-01-05"
  },
  {
    id: 5,
    name: "Cyberpunk Warrior #033",
    description: "Futuristic warrior in neon city",
    price: "0.6 ETH",
    usdPrice: "$1,017.00",
    likes: 52,
    views: 289,
    chain: "ZetaChain",
    status: "Listed",
    category: "Gaming",
    rarity: "Rare",
    dateCreated: "2024-01-03"
  },
  {
    id: 6,
    name: "Minimalist Zen #012",
    description: "Clean, peaceful digital art",
    price: "0.2 ETH",
    usdPrice: "$339.00",
    likes: 15,
    views: 67,
    chain: "Ethereum",
    status: "Owned",
    category: "Art",
    rarity: "Common",
    dateCreated: "2023-12-28"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Listed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    case "Owned":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
    case "Sold":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Common":
      return "text-gray-500 border-gray-200"
    case "Uncommon":
      return "text-emerald-500 border-emerald-200"
    case "Rare":
      return "text-blue-500 border-blue-200"
    case "Epic":
      return "text-purple-500 border-purple-200"
    case "Legendary":
      return "text-orange-500 border-orange-200"
    default:
      return "text-gray-500 border-gray-200"
  }
}

const getChainColor = (chain: string) => {
  switch (chain) {
    case "ZetaChain":
      return "bg-emerald-500"
    case "Ethereum":
      return "bg-blue-500"
    case "Polygon":
      return "bg-purple-500"
    case "BSC":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

export function CollectionGrid() {
  const [likedNFTs, setLikedNFTs] = useState<number[]>([])

  const toggleLike = (id: number) => {
    setLikedNFTs(prev => 
      prev.includes(id) 
        ? prev.filter(nftId => nftId !== id)
        : [...prev, id]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {nftCollection.map((nft, index) => (
        <motion.div
          key={nft.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          className="group"
        >
          <Card className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <div className="relative">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center border-b border-primary/10">
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
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Badge */}
              <Badge 
                className={`absolute top-3 left-3 ${getStatusColor(nft.status)}`}
              >
                {nft.status}
              </Badge>

              {/* Rarity Badge */}
              <Badge 
                variant="outline" 
                className={`absolute top-3 right-3 ${getRarityColor(nft.rarity)}`}
              >
                {nft.rarity}
              </Badge>

              {/* More Actions */}
              <div className="absolute bottom-3 right-3">
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
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Explorer
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title and Category */}
                <div>
                  <h3 className="font-semibold text-lg truncate">{nft.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {nft.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{nft.price}</p>
                    <p className="text-sm text-muted-foreground">{nft.usdPrice}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {nft.category}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => toggleLike(nft.id)}
                      className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          likedNFTs.includes(nft.id) ? 'fill-red-500 text-red-500' : ''
                        }`} 
                      />
                      <span>{nft.likes + (likedNFTs.includes(nft.id) ? 1 : 0)}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{nft.views}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getChainColor(nft.chain)}`} />
                    <span className="text-xs">{nft.chain}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {nft.status === "Owned" && (
                    <Button size="sm" className="flex-1">
                      List for Sale
                    </Button>
                  )}
                  {nft.status === "Listed" && (
                    <Button size="sm" variant="outline" className="flex-1">
                      Update Price
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
