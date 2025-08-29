"use client"

import { motion } from "framer-motion"
import { Clock, ExternalLink, Copy, Check } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, formatAddress } from "@/lib/utils"
import { useState } from "react"

const activities = [
  {
    id: 1,
    type: "mint",
    title: "Cosmic Dream #001 Minted",
    description: "Successfully minted on ZetaChain",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    hash: "0x1234567890abcdef1234567890abcdef12345678",
    status: "completed",
    chain: "ZetaChain"
  },
  {
    id: 2,
    type: "transfer",
    title: "NFT Transfer",
    description: "Abstract Art #042 transferred",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
    status: "completed",
    chain: "Ethereum"
  },
  {
    id: 3,
    type: "sale",
    title: "Digital Landscape Sold",
    description: "Sold for 0.5 ETH",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    hash: "0x9876543210fedcba9876543210fedcba98765432",
    status: "completed",
    chain: "Polygon"
  },
  {
    id: 4,
    type: "create",
    title: "AI Generation Complete",
    description: "Neural Network Art #128 created",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    hash: "0xfedcba9876543210fedcba9876543210fedcba98",
    status: "completed",
    chain: "ZetaChain"
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "mint":
      return "🎨"
    case "transfer":
      return "↗️"
    case "sale":
      return "💰"
    case "create":
      return "✨"
    default:
      return "📋"
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

export function RecentActivity() {
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
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
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className="text-lg">
                  {getActivityIcon(activity.type)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getChainColor(activity.chain)}`} />
                    <span className="text-xs text-muted-foreground">{activity.chain}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(activity.hash)}
                    >
                      {copiedHash === activity.hash ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="ml-1">{formatAddress(activity.hash)}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2"
          >
            <Button variant="ghost" className="w-full text-sm group">
              <Link href="/dashboard/activity" className="flex items-center space-x-2">
                <span>View All Activity</span>
                <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
