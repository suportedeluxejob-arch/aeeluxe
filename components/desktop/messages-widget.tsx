"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase/config"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { collection, query, where, onSnapshot, limit } from "firebase/firestore"

interface ChatPreview {
  userId: string
  userName: string
  userImage: string
  unreadCount: number
}

export function DesktopMessagesWidget() {
  const [user] = useAuthState(auth)
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)")
    setIsDesktop(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!user) return

    const messagesRef = collection(db, "chatMessages")
    const q = query(messagesRef, where("participants", "array-contains", user.uid), limit(50))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMap = new Map<string, ChatPreview>()

      snapshot.docs
        .sort((a, b) => {
          const aTime = a.data().timestamp?.toDate() || new Date(0)
          const bTime = b.data().timestamp?.toDate() || new Date(0)
          return bTime.getTime() - aTime.getTime()
        })
        .forEach((doc) => {
          const data = doc.data()
          const otherUserId = data.participants?.find((id: string) => id !== user.uid)

          if (otherUserId) {
            const chatId = [user.uid, otherUserId].sort().join("_")
            if (!chatMap.has(chatId)) {
              chatMap.set(chatId, {
                userId: otherUserId,
                userName: data.senderName || "Usuário",
                userImage: data.senderImage || "",
                unreadCount: data.senderId !== user.uid && !data.read ? 1 : 0,
              })
            }
          }
        })

      const chatsList = Array.from(chatMap.values()).slice(0, 4)
      setChats(chatsList)
      setUnreadTotal(chatsList.reduce((sum, chat) => sum + chat.unreadCount, 0))
    })

    return () => unsubscribe()
  }, [user])

  if (!user || !isDesktop) return null

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-background border border-border/50 rounded-2xl shadow-2xl backdrop-blur-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/30">
            <h3 className="font-bold flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Mensagens</span>
            </h3>
            <Button variant="ghost" size="sm" className="rounded-full p-1 h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conversa recente</p>
            ) : (
              chats.map((chat) => (
                <Link key={chat.userId} href={`/chat/${chat.userId}`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start space-x-3 h-12 hover:bg-primary/10 rounded-xl"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={chat.userImage || "/placeholder.svg"} alt={chat.userName} />
                      <AvatarFallback>{chat.userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1 text-left">{chat.userName}</span>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))
            )}
          </div>

          <Link href="/chat" className="block">
            <Button className="w-full rounded-full h-10 text-sm">Ver todas as mensagens</Button>
          </Link>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white shadow-2xl hover:shadow-3xl transition-all duration-200 flex items-center justify-center"
      >
        <MessageCircle className="h-8 w-8" />
        {unreadTotal > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </Button>
    </div>
  )
}
