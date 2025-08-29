"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Wallet, Image, Coins, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statsData = [
  {
    title: "Total NFTs Created",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Image,
    color: "text-blue-500"
  },
  {
    title: "Total Revenue",
    value: "$2,847.50",
    change: "+23%",
    trend: "up",
    icon: Coins,
    color: "text-emerald-500"
  },
  {
    title: "Active Collections",
    value: "3",
    change: "0%",
    trend: "neutral",
    icon: BarChart3,
    color: "text-purple-500"
  },
  {
    title: "Wallet Balance",
    value: "0.847 ETH",
    change: "-2.3%",
    trend: "down",
    icon: Wallet,
    color: "text-orange-500"
  }
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 bg-card/80 backdrop-blur-sm hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1">
                  {stat.trend === "up" && (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {stat.change}
                      </Badge>
                    </>
                  )}
                  {stat.trend === "down" && (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {stat.change}
                      </Badge>
                    </>
                  )}
                  {stat.trend === "neutral" && (
                    <Badge variant="outline">
                      {stat.change}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.trend === "up" && "↗ from last month"}
                {stat.trend === "down" && "↘ from last month"}
                {stat.trend === "neutral" && "→ from last month"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
