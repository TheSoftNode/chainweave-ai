"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Palette, 
  Image, 
  BarChart3, 
  Settings, 
  Wallet,
  Plus,
  Images,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
    badge: null
  },
  {
    title: "Create NFT",
    href: "/dashboard/create",
    icon: Plus,
    badge: "New"
  },
  {
    title: "AI Generator",
    href: "/dashboard/generate",
    icon: Palette,
    badge: null
  },
  {
    title: "My Collection",
    href: "/dashboard/collection",
    icon: Images,
    badge: "12"
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    badge: null
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    badge: null
  }
]

const quickActions = [
  {
    title: "Quick Mint",
    icon: Image,
    action: "mint"
  },
  {
    title: "Connect Wallet",
    icon: Wallet,
    action: "wallet"
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-80 bg-card border-r border-border h-screen sticky top-16 overflow-y-auto"
    >
      <div className="p-6">
        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">CW</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Creator Wallet</p>
              <p className="text-xs text-muted-foreground truncate">0x1234...5678</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"} 
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <Separator className="mb-6" />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-4"
                >
                  <action.icon className="w-4 h-4 mr-3" />
                  {action.title}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Separator className="my-6" />

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Link
            href="/dashboard/settings"
            className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </motion.div>
      </div>
    </motion.aside>
  )
}
