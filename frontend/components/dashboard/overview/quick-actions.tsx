"use client"

import { motion } from "framer-motion"
import { Plus, Palette, Upload, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const quickActions = [
  {
    title: "Generate with AI",
    description: "Create unique NFT artwork using our AI generator",
    icon: Palette,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    href: "/dashboard/generate"
  },
  {
    title: "Upload Artwork",
    description: "Upload your own artwork to mint as NFT",
    icon: Upload,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    href: "/dashboard/create"
  },
  {
    title: "View Collection",
    description: "Browse and manage your existing NFTs",
    icon: Zap,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    href: "/dashboard/collection"
  },
  {
    title: "Analytics",
    description: "Check your NFT performance and earnings",
    icon: Plus,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    href: "/dashboard/analytics"
  }
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Quick Actions
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View Activity
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Card className={`cursor-pointer hover:shadow-lg transition-all duration-300 border ${action.color.split(' ')[2]} hover:shadow-primary/10 group`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${action.color.split(' ').slice(0, 2).join(' ')} group-hover:scale-110 transition-transform duration-200`}>
                          <action.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
