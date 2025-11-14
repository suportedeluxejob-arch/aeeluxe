"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Compass, MessageCircle, Heart, Plus, BarChart3, LogOut, Crown } from "lucide-react"
import { useUserContext } from "@/lib/contexts/user-context"
import CreatePostModal from "@/components/modals/create-post-modal"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

export function SidebarDesktop() {
  const router = useRouter()
  const pathname = usePathname()
  const [user] = useAuthState(auth)
  const { isCreator, currentUserData } = useUserContext()
  const [notificationCount, setNotificationCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024

  if (!isDesktop) return null

  const baseNavItems: NavItem[] = [
    { icon: <Home className="h-6 w-6" />, label: "Página inicial", href: "/feed" },
    { icon: <Compass className="h-6 w-6" />, label: "Explorar", href: "/explore" },
    { icon: <Crown className="h-6 w-6" />, label: "Criadoras", href: "/creators" },
    { icon: <MessageCircle className="h-6 w-6" />, label: "Mensagens", href: "/chat", badge: notificationCount },
    { icon: <Heart className="h-6 w-6" />, label: "Notificações", href: "/notifications" },
  ]

  const userNavItems: NavItem[] = [
    ...baseNavItems,
    { icon: <Crown className="h-6 w-6" />, label: "Meus Planos", href: "/my-subscriptions" },
  ]

  const creatorNavItems: NavItem[] = [
    ...baseNavItems,
    { icon: <Plus className="h-6 w-6" />, label: "Criar", href: "#" },
    { icon: <BarChart3 className="h-6 w-6" />, label: "Painel", href: "/creator-dashboard" },
  ]

  const navItems = isCreator ? creatorNavItems : userNavItems

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  const handleNavClick = (item: NavItem) => {
    if (item.label === "Criar") {
      setShowCreateModal(true)
    } else {
      router.push(item.href)
    }
  }

  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-border/50 lg:bg-gradient-to-b lg:from-background lg:to-muted/20 lg:flex lg:flex-col lg:z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border/30">
        <Link href="/feed" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            DeLuxe
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href}>
            <Button
              onClick={() => handleNavClick(item)}
              variant={isActive(item.href) ? "default" : "ghost"}
              className={`w-full justify-start space-x-4 rounded-full h-12 text-base font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg"
                  : "hover:bg-primary/10"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto bg-destructive text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Button>
          </div>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border/30 space-y-4">
        {currentUserData && (
          <Link href={isCreator ? `/creator/${currentUserData.username}` : `/user/${currentUserData.username}`}>
            <Button variant="ghost" className="w-full justify-start space-x-3 rounded-full h-12 hover:bg-primary/10">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={currentUserData.profileImage || "/placeholder.svg"}
                  alt={currentUserData.displayName}
                />
                <AvatarFallback>{currentUserData.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold line-clamp-1">{currentUserData.displayName}</p>
                <p className="text-xs text-muted-foreground">@{currentUserData.username}</p>
              </div>
            </Button>
          </Link>
        )}
        <Button
          variant="outline"
          className="w-full rounded-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}
    </aside>
  )
}
