"use client"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { getUserProfile, isUserCreator, type UserProfile } from "@/lib/firebase/firestore"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageCircle, Crown, Users, Heart } from "lucide-react"
import { UsersListForCreators } from "@/components/users-list-for-creators"
import { CreatorsListForUsers } from "@/components/creators-list-for-users"
import { ResponsiveLayout } from "@/components/desktop/responsive-layout"

export default function ChatPage() {
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        router.push("/")
        return
      }

      try {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)

        const creatorStatus = await isUserCreator(user.uid)
        setIsCreator(creatorStatus)
      } catch (error) {
        // Silently handle error
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, router])

  if (!user) {
    return (
      <ResponsiveLayout showSuggestions={true} showMessages={false}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center space-y-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">Login Necessário</h2>
              <p className="text-muted-foreground">Você precisa estar logado para acessar o chat.</p>
              <Button className="w-full rounded-full glow-pink-hover" onClick={() => router.push("/")}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>
    )
  }

  if (loading) {
    return (
      <ResponsiveLayout showSuggestions={true} showMessages={false}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando chats...</p>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout showSuggestions={true}>
      <div className="min-h-screen bg-background">
        <div className="lg:hidden">
          <div className="bg-background border-b border-border/50 p-4 sticky top-0 z-10 backdrop-blur-sm bg-background/95">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1">
                <h1 className="font-semibold text-lg">Mensagens</h1>
                <p className="text-sm text-muted-foreground">
                  {isCreator ? "Suas conversas com usuários" : "Suas conversas com criadoras"}
                </p>
              </div>

              {isCreator && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Criadora
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block bg-background border-b border-border/50 p-6 sticky top-0 z-10">
          <h1 className="text-2xl font-bold mb-2">Mensagens</h1>
          <p className="text-muted-foreground">
            {isCreator ? "Suas conversas com usuários" : "Suas conversas com criadoras"}
          </p>
        </div>

        <div className="p-4 lg:p-6 space-y-4 min-h-[calc(100vh-200px)]">
          {isCreator && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-lg">Área da Criadora</h3>
                    <p className="text-sm text-muted-foreground">
                      Aqui você pode ver e responder mensagens dos seus seguidores
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isCreator ? <UsersListForCreators /> : <CreatorsListForUsers />}

          {!isCreator && userProfile?.level !== "platinum" && userProfile?.level !== "diamante" && (
            <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200/50 dark:border-rose-800/30">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                    <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-rose-700 dark:text-rose-300 text-lg">
                      Upgrade para Chat Premium 💎
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Faça upgrade para Platinum ou Diamante para conversar com as criadoras
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full lg:w-fit rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  onClick={() => router.push("/subscription")}
                >
                  Fazer Upgrade Agora
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  )
}
