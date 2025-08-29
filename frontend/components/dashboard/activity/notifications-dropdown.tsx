"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Eye, Check, X, ExternalLink, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const notifications = [
  {
    id: 1,
    type: "offer",
    title: "New offer received",
    description: "@collector offered 0.5 ETH for Cosmic Dream #001",
    timestamp: "2 minutes ago",
    read: false,
    icon: "💰",
    color: "bg-primary"
  },
  {
    id: 2,
    type: "sale",
    title: "NFT sold!",
    description: "Neural Network Art #128 sold for 0.8 ETH",
    timestamp: "1 hour ago",
    read: false,
    icon: "🎉",
    color: "bg-emerald-500"
  },
  {
    id: 3,
    type: "follow",
    title: "New follower",
    description: "@artlover started following you",
    timestamp: "3 hours ago",
    read: true,
    icon: "👤",
    color: "bg-blue-500"
  },
  {
    id: 4,
    type: "like",
    title: "Your NFT received likes",
    description: "Cyberpunk Warrior #033 received 25 new likes",
    timestamp: "5 hours ago",
    read: true,
    icon: "❤️",
    color: "bg-pink-500"
  },
  {
    id: 5,
    type: "mint",
    title: "Minting successful",
    description: "Digital Landscape #067 has been minted successfully",
    timestamp: "1 day ago",
    read: true,
    icon: "✨",
    color: "bg-purple-500"
  },
  {
    id: 6,
    type: "system",
    title: "Weekly report ready",
    description: "Your analytics report for this week is now available",
    timestamp: "2 days ago",
    read: true,
    icon: "📊",
    color: "bg-orange-500"
  }
]

interface NotificationsDropdownProps {
  unreadCount?: number
}

export function NotificationsDropdown({ unreadCount = 3 }: NotificationsDropdownProps) {
  const [notificationList, setNotificationList] = useState(notifications)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const markAsRead = (id: number) => {
    setNotificationList(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: number) => {
    setNotificationList(prev => prev.filter(notif => notif.id !== id))
  }

  const recentNotifications = notificationList.slice(0, 3)
  const unreadNotifications = notificationList.filter(n => !n.read)
  const readNotifications = notificationList.filter(n => n.read)

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            <div className="p-1">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.read ? 'bg-gray-400' : notification.color
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.read ? '' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp}
                          </p>
                        </div>
                        <span className="text-lg ml-2">{notification.icon}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t border-border">
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-center">
                <Eye className="w-4 h-4 mr-2" />
                View all notifications
              </Button>
            </DialogTrigger>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Notifications Modal */}
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>All Notifications</span>
          </DialogTitle>
          <DialogDescription>
            Manage all your notifications and activity updates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({notificationList.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {notificationList.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="read" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <div className="flex space-x-2">
            <Link href="/dashboard/activity">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Activity
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                Notification Settings
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface NotificationItemProps {
  notification: typeof notifications[0]
  onMarkAsRead: () => void
  onDelete: () => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200"
    >
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 ${notification.color} rounded-full flex items-center justify-center`}>
          <span className="text-lg">{notification.icon}</span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`text-sm ${notification.read ? '' : 'font-semibold'}`}>
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {notification.timestamp}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.read && (
                <DropdownMenuItem onClick={onMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <ExternalLink className="w-4 h-4 mr-2" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <X className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {!notification.read && (
          <div className="flex items-center mt-3">
            <div className="w-2 h-2 bg-primary rounded-full mr-2" />
            <span className="text-xs text-primary font-medium">Unread</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
