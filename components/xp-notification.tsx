"use client"

import { useEffect } from "react"
import { Sparkles } from "lucide-react"

interface XPNotificationProps {
  show: boolean
  xpGained: number
  action: string
  onClose: () => void
}

export function XPNotification({ show, xpGained, action, onClose }: XPNotificationProps) {
  useEffect(() => {
    if (show && xpGained > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show, xpGained, onClose])

  if (!show || xpGained <= 0) return null

  const getActionText = (action: string) => {
    switch (action) {
      case "like":
        return "Curtida"
      case "comment":
        return "Comentário"
      case "retweet":
        return "Retweet"
      default:
        return "Ação"
    }
  }

  return (
    <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-5 duration-300">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 backdrop-blur-xl border border-pink-500/30 rounded-lg shadow-2xl shadow-pink-500/50 p-4 flex items-center gap-3 max-w-[300px]">
        <div className="p-2 bg-pink-500/20 rounded-full flex-shrink-0">
          <Sparkles className="w-5 h-5 text-pink-100 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-pink-50">+{xpGained} XP</span>
            <span className="text-sm text-pink-200/80">• {getActionText(action)}</span>
          </div>
          <p className="text-xs text-pink-100/80 mt-1">Continue interagindo!</p>
        </div>
      </div>
    </div>
  )
}
