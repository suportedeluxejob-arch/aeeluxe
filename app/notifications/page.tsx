"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { ResponsiveLayout } from "@/components/desktop/responsive-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Heart, MessageCircle, UserPlus, Sparkles, X } from "lucide-react"
import { useState, useEffect } from "react"
import {
  getActiveUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/firebase/firestore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const [user] = useAuthState(auth)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = getActiveUserNotifications(user.uid, (activeNotifications) => {
      setNotifications(activeNotifications)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      toast({
        title: "Notificação marcada como lida",
        duration: 2000,
      })
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      toast({
        title: "Notificação removida",
        duration: 2000,
      })
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
      toast({
        title: "Erro ao remover notificação",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Agora"

    const now = new Date()
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""} atrás`
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hora${hours > 1 ? "s" : ""} atrás`
    }
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} dia${days > 1 ? "s" : ""} atrás`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "comment":
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      case "welcome":
        return <Sparkles className="h-5 w-5 text-primary" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <ResponsiveLayout showMessages={false}>
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block bg-background border-b border-border/50 p-6 sticky top-0 z-10">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notificações
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">Fique por dentro de tudo que acontece na plataforma</p>
        </div>

        <div className="p-4 lg:p-6 space-y-4 min-h-[calc(100vh-200px)]">
          <Card className="border-border/50 lg:max-w-3xl mx-auto">
            <CardHeader className="lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg lg:text-xl">Centro de Notificações</CardTitle>
                </div>
                {notifications.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {notifications.length} notificação{notifications.length > 1 ? "ões" : ""}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="lg:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-muted-foreground">Carregando notificações...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-muted/30 rounded-full">
                      <Bell className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-lg mb-1">Você está em dia</p>
                    <p className="text-sm text-muted-foreground">Você não tem notificações no momento</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 group relative ${
                        notification.read ? "bg-card border-border/50" : "bg-primary/5 border-primary/20"
                      } hover:bg-muted/50`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => notification.id && handleDeleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="flex items-start gap-3">
                        {notification.fromProfileImage ? (
                          <Avatar className="h-10 w-10 ring-1 ring-border flex-shrink-0">
                            <AvatarImage
                              src={notification.fromProfileImage || "/placeholder.svg"}
                              alt={notification.fromDisplayName || "Perfil"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {notification.fromDisplayName?.[0] || "I"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground leading-tight">{notification.title}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notification.message}</p>

                          {!notification.read && notification.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleMarkAsRead(notification.id!)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
