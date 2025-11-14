"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase/config"
import type { UserProfile } from "@/lib/firebase/firestore"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Sparkles, CheckCircle2 } from "lucide-react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { useUserContext } from "@/lib/contexts/user-context"

interface CreatorSuggestion extends UserProfile {
  mutualFollowers?: number
}

export function DesktopSuggestionsPanel() {
  const [user] = useAuthState(auth)
  const { isCreator } = useUserContext()
  const [suggestions, setSuggestions] = useState<CreatorSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const creatorsRef = collection(db, "users")
        const q = query(creatorsRef, where("userType", "==", "creator"), limit(8))

        const snapshot = await getDocs(q)
        const creatorsList = snapshot.docs
          .map((doc) => ({ ...doc.data(), uid: doc.id }) as CreatorSuggestion)
          .filter((creator) => creator.uid !== user.uid)
          .slice(0, 6)

        setSuggestions(creatorsList)
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [user])

  const filteredSuggestions = suggestions.filter(
    (creator) =>
      creator.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!user) return null

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar criadoras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full bg-muted/50 border-border/30 h-10"
            />
          </div>
        </div>

        {/* Suggestions Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Sugestões</span>
            </h2>
            <Link href="/creators" className="text-xs text-primary hover:underline font-medium">
              Ver tudo
            </Link>
          </div>
        </div>

        {/* Suggestions List - Compact Design */}
        <div className="space-y-3 mb-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <Card className="bg-muted/30 border-border/30">
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma criadora encontrada
              </CardContent>
            </Card>
          ) : (
            filteredSuggestions.map((creator) => (
              <div
                key={creator.uid}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-primary/20"
              >
                <Link href={`/creator/${creator.username}`} className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 shadow-sm">
                      <AvatarImage src={creator.profileImage || "/placeholder.svg"} alt={creator.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm">
                        {creator.displayName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {creator.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm ring-2 ring-background">
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </Link>

                <Link href={`/creator/${creator.username}`} className="flex-1 min-w-0">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm line-clamp-1">{creator.displayName}</h3>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                    {creator.followerCount && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{creator.followerCount.toLocaleString()}</span>{" "}
                        seguidores
                      </p>
                    )}
                  </div>
                </Link>

                <Button
                  size="sm"
                  className="rounded-full h-8 px-4 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-xs font-semibold flex-shrink-0"
                  asChild
                >
                  <Link href={`/creator/${creator.username}`}>Ver</Link>
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer Links */}
        <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border/30">
          <p className="text-center">Sobre • Ajuda • Imprensa</p>
          <p className="text-center">© 2025 DeLuxe Job</p>
        </div>
      </div>
    </div>
  )
}
