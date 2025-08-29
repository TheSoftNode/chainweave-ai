"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Eye, Heart, Share2, MessageCircle, TrendingUp, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

const activityData = [
  {
    id: 1,
    type: "sale",
    title: "Cosmic Dream #001 sold",
    description: "Sold to @cryptoCollector for 0.5 ETH",
    timestamp: "2 hours ago",
    value: "+0.5 ETH",
    trend: "up",
    nft: "Cosmic Dream #001",
    buyer: "@cryptoCollector",
    chain: "ZetaChain"
  },
  {
    id: 2,
    type: "mint",
    title: "New NFT minted",
    description: "Neural Network Art #129 created successfully",
    timestamp: "4 hours ago",
    value: "+1 NFT",
    trend: "up",
    nft: "Neural Network Art #129",
    chain: "ZetaChain"
  },
  {
    id: 3,
    type: "like",
    title: "Cyberpunk Warrior #033 liked",
    description: "Received 15 new likes in the last hour",
    timestamp: "6 hours ago",
    value: "+15 likes",
    trend: "up",
    nft: "Cyberpunk Warrior #033",
    chain: "Ethereum"
  },
  {
    id: 4,
    type: "listing",
    title: "Digital Landscape #067 listed",
    description: "Listed for sale at 0.4 ETH",
    timestamp: "8 hours ago",
    value: "0.4 ETH",
    trend: "neutral",
    nft: "Digital Landscape #067",
    chain: "ZetaChain"
  },
  {
    id: 5,
    type: "offer",
    title: "Offer received",
    description: "@nftEnthusiast offered 0.3 ETH for Abstract Emotions #042",
    timestamp: "12 hours ago",
    value: "0.3 ETH",
    trend: "neutral",
    nft: "Abstract Emotions #042",
    buyer: "@nftEnthusiast",
    chain: "Ethereum"
  },
  {
    id: 6,
    type: "view",
    title: "High engagement",
    description: "Minimalist Zen #012 gained 200+ views",
    timestamp: "1 day ago",
    value: "+200 views",
    trend: "up",
    nft: "Minimalist Zen #012",
    chain: "Polygon"
  },
  {
    id: 7,
    type: "transfer",
    title: "NFT transferred",
    description: "Cosmic Dream #002 transferred to new wallet",
    timestamp: "1 day ago",
    value: "Transfer",
    trend: "neutral",
    nft: "Cosmic Dream #002",
    chain: "ZetaChain"
  },
  {
    id: 8,
    type: "price_update",
    title: "Price updated",
    description: "Neural Network Art #128 price reduced to 0.7 ETH",
    timestamp: "2 days ago",
    value: "-0.1 ETH",
    trend: "down",
    nft: "Neural Network Art #128",
    chain: "ZetaChain"
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sale":
      return "💰"
    case "mint":
      return "✨"
    case "like":
      return "❤️"
    case "listing":
      return "🏷️"
    case "offer":
      return "💼"
    case "view":
      return "👁️"
    case "transfer":
      return "🔄"
    case "price_update":
      return "📊"
    default:
      return "📋"
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "sale":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    case "mint":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
    case "like":
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400"
    case "listing":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
    case "offer":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
    case "view":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
    case "transfer":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
    case "price_update":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
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

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    case "down":
      return <ArrowDownRight className="w-4 h-4 text-red-500" />
    default:
      return null
  }
}

const recentNotifications = [
  {
    id: 1,
    message: "Your NFT 'Cosmic Dream #001' has a new offer",
    timestamp: "5 minutes ago",
    read: false
  },
  {
    id: 2,
    message: "Price alert: ZetaChain NFTs trending up 15%",
    timestamp: "1 hour ago",
    read: false
  },
  {
    id: 3,
    message: "Weekly analytics report is ready",
    timestamp: "2 hours ago",
    read: true
  },
  {
    id: 4,
    message: "New follower: @artLover started following you",
    timestamp: "4 hours ago",
    read: true
  }
]

export function ActivityFeed() {
  const [filter, setFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("7d")

  const filteredActivity = activityData.filter(item => {
    if (filter === "all") return true
    return item.type === filter
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Activity Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="mint">Mints</SelectItem>
              <SelectItem value="like">Likes</SelectItem>
              <SelectItem value="listing">Listings</SelectItem>
              <SelectItem value="offer">Offers</SelectItem>
              <SelectItem value="view">Views</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          {/* Activity List */}
          <div className="space-y-3">
            {filteredActivity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Activity Icon */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getActivityIcon(item.type)}</span>
                        </div>
                        
                        {/* Activity Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <Badge className={getActivityColor(item.type)} variant="secondary">
                              {item.type.replace("_", " ")}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.timestamp}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getChainColor(item.chain)}`} />
                              <span>{item.chain}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Value and Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium">{item.value}</span>
                            {getTrendIcon(item.trend)}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share Activity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          {/* Notifications List */}
          <div className="space-y-3">
            {recentNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200 ${
                  !notification.read ? 'border-primary/40' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Notification Indicator */}
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          !notification.read ? 'bg-primary' : 'bg-muted'
                        }`} />
                        
                        {/* Notification Content */}
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Mark as {notification.read ? 'Unread' : 'Read'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Delete Notification
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
