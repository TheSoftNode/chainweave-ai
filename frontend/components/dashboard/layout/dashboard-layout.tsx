"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  X, 
  Home, 
  Palette, 
  Plus, 
  Images, 
  BarChart3, 
  Activity, 
  Settings, 
  Wallet, 
  Bell, 
  Search, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { NotificationsDropdown } from "@/components/dashboard/activity/notifications-dropdown"
import { ChainWeaveLogo, ChainWeaveLogoCompact } from "@/components/ui/chainweave-logo"
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
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
    badge: null
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

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card/95 backdrop-blur-xl border-r border-border transition-all duration-300 flex flex-col",
          "lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-80",
          "w-80" // Mobile width
        )}>
          {/* Logo Section */}
          <div className={cn(
            "p-6 border-b border-border flex items-center justify-between",
            sidebarCollapsed && "lg:p-4 lg:justify-center"
          )}>
            <div className={cn(
              "flex items-center space-x-3",
              sidebarCollapsed && "lg:space-x-0"
            )}>
              {sidebarCollapsed ? (
                <ChainWeaveLogoCompact 
                  size="md" 
                  className="flex-shrink-0" 
                  href="/"
                />
              ) : (
                <ChainWeaveLogo 
                  size="md"
                  showText={true}
                  animated={false}
                  className="flex-shrink-0"
                  href="/"
                />
              )}
              <div className={cn(
                "transition-all duration-300",
                sidebarCollapsed && "lg:hidden"
              )}>
                <p className="text-xs text-muted-foreground">NFT Creator Studio</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className={cn(
            "p-4",
            sidebarCollapsed && "lg:p-2"
          )}>
            <div className={cn(
              "flex items-center space-x-3 p-3 bg-primary/5 rounded-xl border border-primary/10 transition-all duration-300",
              sidebarCollapsed && "lg:flex-col lg:space-x-0 lg:space-y-2 lg:p-2"
            )}>
              <Avatar className="w-10 h-10 ring-2 ring-primary/20 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                  CW
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                sidebarCollapsed && "lg:hidden"
              )}>
                <p className="text-sm font-medium truncate">Creator Wallet</p>
                <p className="text-xs text-muted-foreground truncate">0x1234...5678</p>
              </div>
              <div className={cn(
                "w-2 h-2 bg-emerald-400 rounded-full animate-pulse",
                sidebarCollapsed && "lg:w-3 lg:h-3"
              )} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      sidebarCollapsed && "lg:justify-center lg:px-2"
                    )}
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <div className={cn(
                      "flex items-center space-x-3 relative z-10",
                      sidebarCollapsed && "lg:space-x-0"
                    )}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className={cn(
                        "transition-all duration-300",
                        sidebarCollapsed && "lg:hidden"
                      )}>
                        {item.title}
                      </span>
                    </div>
                    {item.badge && !sidebarCollapsed && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className={cn(
                          "text-xs relative z-10 ml-auto",
                          isActive && "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.badge && sidebarCollapsed && (
                      <div className="hidden lg:block absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Settings and Collapse Button */}
          <div className="p-4 border-t border-border space-y-2">
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200",
                sidebarCollapsed && "lg:justify-center lg:px-2"
              )}
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "transition-all duration-300",
                sidebarCollapsed && "lg:hidden"
              )}>
                Settings
              </span>
            </Link>
            
            {/* Collapse button - desktop only */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden lg:flex items-center justify-center w-full transition-all duration-300",
                sidebarCollapsed && "px-2"
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Top navbar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                {/* Search */}
                <div className="hidden md:block relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search NFTs, collections..."
                    className="pl-10 w-64 bg-background/50 border-border"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                
                {/* Notifications */}
                <NotificationsDropdown unreadCount={3} />

                {/* Wallet Status */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Connected</span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm">
                          CW
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center space-x-2 w-full">
                        <User className="w-4 h-4" />
                        <span>Profile & Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center space-x-2 w-full">
                        <Wallet className="w-4 h-4" />
                        <span>Wallet Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/analytics" className="flex items-center space-x-2 w-full">
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center space-x-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
