"use client"

import { motion } from "framer-motion"
import { TrendingUp, Eye, Heart, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const statsData = [
  {
    title: "Total NFTs",
    value: "24",
    change: "+3 this month",
    icon: Eye,
    color: "text-blue-500"
  },
  {
    title: "Total Value",
    value: "$12,847.50",
    change: "+15.3% from last month",
    icon: DollarSign,
    color: "text-emerald-500"
  },
  {
    title: "Total Likes",
    value: "1,284",
    change: "+124 this week",
    icon: Heart,
    color: "text-red-500"
  },
  {
    title: "Best Performer",
    value: "Cosmic Dream #001",
    change: "0.8 ETH value",
    icon: TrendingUp,
    color: "text-purple-500"
  }
]

export function CollectionStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
