"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Pause, Play, Trash2, Heart, MessageCircle, Send, Share2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Input } from "@/components/ui/input"
import {
  deleteTemporaryStory,
  markStoryAsViewed,
  toggleStoryLike,
  addStoryComment,
  checkStoryLiked,
  getStoryComments,
} from "@/lib/firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"

interface StoryItem {
  id?: string
  imageUrl?: string
  videoUrl?: string
  images?: string[]
  name?: string
  isTemporary?: boolean
  expiresAt?: any
  createdAt?: any
  creatorId?: string
  duration?: number
  likes?: string[] | number
  comments?: Array<{
    id: string
    userId: string
    userName: string
    userAvatar: string
    text: string
    createdAt: any
  }>
}

interface StoryViewerProps {
  isOpen: boolean
  onClose: () => void
  stories: StoryItem[]
  initialStoryIndex?: number
  creatorName: string
  creatorUsername: string
  creatorAvatar: string
  currentUserId?: string
  isOwner?: boolean
  onStoryDeleted?: () => void
}

export function StoryViewer({
  isOpen,
  onClose,
  stories,
  initialStoryIndex = 0,
  creatorName,
  creatorUsername,
  creatorAvatar,
  currentUserId,
  isOwner = false,
  onStoryDeleted,
}: StoryViewerProps) {
  const [user] = useAuthState(auth)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [shouldClose, setShouldClose] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [expirationProgress, setExpirationProgress] = useState<number>(100)

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [storyComments, setStoryComments] = useState<any[]>([])
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true)

  const { toast } = useToast()

  const currentStory = stories[currentStoryIndex]
  const currentStoryImages =
    currentStory?.images ||
    (currentStory?.videoUrl ? [currentStory.videoUrl] : currentStory?.imageUrl ? [currentStory.imageUrl] : [])
  const totalImages = currentStoryImages.length

  useEffect(() => {
    const loadStoryInteractions = async () => {
      if (!currentStory?.id || !user) {
        setIsLoadingInteractions(false)
        return
      }

      setIsLoadingInteractions(true)

      try {
        const liked = await checkStoryLiked(user.uid, currentStory.id)
        setIsLiked(liked)

        const likeCount = typeof currentStory.likes === "number" ? currentStory.likes : 0
        setLikesCount(likeCount)

        const comments = await getStoryComments(currentStory.id)
        setStoryComments(comments)
      } catch (error) {
        console.error("Error loading story interactions:", error)
      } finally {
        setIsLoadingInteractions(false)
      }
    }

    loadStoryInteractions()
  }, [currentStory?.id, user])

  useEffect(() => {
    if (!currentStory?.createdAt || !currentStory?.isTemporary) return

    const updateTimeRemaining = () => {
      const now = Date.now()
      const createdAt = currentStory.createdAt?.toMillis ? currentStory.createdAt.toMillis() : currentStory.createdAt
      const duration = (currentStory.duration || 24) * 60 * 60 * 1000
      const expiresAt = createdAt + duration
      const remaining = expiresAt - now

      if (remaining <= 0) {
        setTimeRemaining("Expirado")
        setExpirationProgress(0)
        return
      }

      const progressPercent = (remaining / duration) * 100
      setExpirationProgress(progressPercent)

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeRemaining(`${hours}h`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m`)
      } else {
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
        setTimeRemaining(`${seconds}s`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [currentStory?.createdAt, currentStory?.duration, currentStory?.isTemporary])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.height = "100%"
    } else {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.body.style.height = ""
    }

    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.body.style.height = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (shouldClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [shouldClose, onClose])

  useEffect(() => {
    if (isOpen && currentStory?.id && currentUserId) {
      markStoryAsViewed(currentStory.id, currentUserId)
        .then(() => {
          console.log("[v0] Story marked as viewed successfully")
        })
        .catch((error) => {
          console.error("[v0] Error marking story as viewed:", error)
        })
    }
  }, [isOpen, currentStory?.id, currentUserId])

  useEffect(() => {
    if (!isOpen || isPaused || !currentStory || totalImages === 0) {
      return
    }

    const duration = 5000
    const interval = 50

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (interval / duration) * 100

        if (newProgress >= 100) {
          if (currentImageIndex < totalImages - 1) {
            setCurrentImageIndex((prev) => prev + 1)
            return 0
          } else if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex((prev) => prev + 1)
            setCurrentImageIndex(0)
            return 0
          } else {
            return 100
          }
        }

        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isOpen, isPaused, currentStoryIndex, currentImageIndex, totalImages, stories.length, currentStory])

  useEffect(() => {
    setProgress(0)
  }, [currentStoryIndex, currentImageIndex])

  const handleLike = async () => {
    if (!user || !currentStory?.id) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para curtir stories",
        variant: "destructive",
      })
      return
    }

    const previousLiked = isLiked
    const previousCount = likesCount

    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    if (!isLiked) {
      setShowLikeAnimation(true)
      setTimeout(() => setShowLikeAnimation(false), 1000)
    }

    try {
      const storyType = currentStory.isTemporary ? "temporary" : "highlight"
      const result = await toggleStoryLike(user.uid, currentStory.id, storyType)

      setIsLiked(result.liked)
      setLikesCount(result.likeCount)

      toast({
        title: result.liked ? "Story curtido!" : "Curtida removida",
        description: result.liked ? "Você curtiu este story" : "Você removeu a curtida",
      })
    } catch (error: any) {
      setIsLiked(previousLiked)
      setLikesCount(previousCount)

      console.error("Error liking story:", error)
      toast({
        title: "Erro ao curtir",
        description: error.message || "Não foi possível curtir o story",
        variant: "destructive",
      })
    }
  }

  const handleComment = async () => {
    if (!user || !currentStory?.id) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      })
      return
    }

    if (!commentText.trim()) return

    const textToSend = commentText
    setCommentText("")

    try {
      const storyType = currentStory.isTemporary ? "temporary" : "highlight"
      const newComment = await addStoryComment(user.uid, currentStory.id, storyType, textToSend)

      setStoryComments((prev) => [newComment, ...prev])
      setShowCommentInput(false)

      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi adicionado ao story",
      })
    } catch (error: any) {
      setCommentText(textToSend)

      console.error("Error commenting:", error)
      toast({
        title: "Erro ao comentar",
        description: error.message || "Não foi possível enviar o comentário",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/creator/${creatorUsername}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Story de ${creatorName}`,
          text: `Confira o story de ${creatorName} na DeLuxe Job!`,
          url: shareUrl,
        })
      } catch (error) {
        console.log("[v0] Share cancelled or failed")
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copiado!",
        description: "O link do perfil foi copiado para a área de transferência",
      })
    }
    setShowShareMenu(false)
  }

  const handlePrevious = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1)
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1)
      const prevStory = stories[currentStoryIndex - 1]
      const prevImages =
        prevStory?.images ||
        (prevStory?.videoUrl ? [prevStory.videoUrl] : prevStory?.imageUrl ? [prevStory.imageUrl] : [])
      setCurrentImageIndex(prevImages.length - 1)
    }
  }, [currentImageIndex, currentStoryIndex, stories])

  const handleNext = useCallback(() => {
    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex((prev) => prev + 1)
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1)
      setCurrentImageIndex(0)
    } else {
      setShouldClose(true)
    }
  }, [currentImageIndex, totalImages, currentStoryIndex, stories.length])

  const handleDeleteStory = async () => {
    if (!currentStory?.id || !currentStory?.creatorId || !isOwner) {
      return
    }

    if (!confirm("Tem certeza que deseja deletar este story?")) {
      return
    }

    try {
      await deleteTemporaryStory(currentStory.id, currentStory.creatorId)

      toast({
        title: "Story deletado",
        description: "O story foi removido com sucesso",
      })

      setTimeout(() => {
        onClose()
        if (onStoryDeleted) {
          onStoryDeleted()
        }
      }, 0)
    } catch (error) {
      console.error("Error deleting story:", error)
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o story",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
        case " ":
          e.preventDefault()
          setIsPaused((prev) => !prev)
          break
      }
    },
    [isOpen, onClose, handlePrevious, handleNext],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen || !currentStory || totalImages === 0) {
    return null
  }

  const currentImage = currentStoryImages[currentImageIndex]
  const isVideo =
    currentImage &&
    (currentImage.includes(".mp4") ||
      currentImage.includes(".webm") ||
      currentImage.includes("video") ||
      currentStory?.videoUrl)

  const isExpiringSoon = expirationProgress < 10
  const isExpiring = expirationProgress < 25

  return (
    <div className="fixed inset-0 z-[9999] bg-black touch-none overscroll-none flex items-center justify-center">
      <div className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-3 flex space-x-1.5 max-w-md mx-auto">
        {currentStoryImages.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 sm:h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < currentImageIndex ? "100%" : index === currentImageIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 pt-8 sm:pt-10 pb-3 px-3 sm:px-4 bg-gradient-to-b from-black/70 to-transparent max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white/20">
              <AvatarImage src={creatorAvatar || "/placeholder.svg"} alt={creatorName} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {creatorName?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-xs sm:text-sm truncate">{creatorName}</p>
              {currentStory.name && (
                <p className="text-white/70 text-[10px] sm:text-xs truncate">{currentStory.name}</p>
              )}
            </div>

            {currentStory.isTemporary && timeRemaining && (
              <Badge
                className={`${
                  isExpiringSoon ? "bg-red-500/80" : isExpiring ? "bg-yellow-500/80" : "bg-white/20"
                } text-white border-0 text-[10px] sm:text-xs px-1.5 py-0.5`}
              >
                {timeRemaining}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {isVideo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/10 rounded-full p-1.5 h-auto"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="text-white hover:bg-white/10 rounded-full p-1.5 h-auto"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            {isOwner && currentStory.isTemporary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteStory}
                className="text-white hover:bg-red-500/20 rounded-full p-1.5 h-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full p-1.5 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
        <div className="w-full h-full max-h-screen">
          <AspectRatio ratio={9 / 16} className="w-full h-full bg-black">
            {isVideo ? (
              <video
                key={currentImage}
                src={currentImage}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onLoadedData={() => setIsLoading(false)}
                onError={(e) => {
                  console.error("Video failed to load:", currentImage)
                  setIsLoading(false)
                }}
                style={{ aspectRatio: "9/16" }}
              />
            ) : (
              <img
                key={currentImage}
                src={currentImage || "/placeholder.svg"}
                alt={`Story ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                  setIsLoading(false)
                }}
                style={{ aspectRatio: "9/16" }}
              />
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {showLikeAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="h-24 w-24 sm:h-32 sm:w-32 text-white fill-red-500 animate-ping" />
              </div>
            )}
          </AspectRatio>
        </div>
      </div>

      <div className="absolute inset-0 flex pointer-events-none max-w-md mx-auto">
        <button
          className="flex-1 cursor-pointer focus:outline-none active:bg-white/5 transition-colors pointer-events-auto"
          onClick={handlePrevious}
          disabled={currentStoryIndex === 0 && currentImageIndex === 0}
          aria-label="Story anterior"
        />
        <button
          className="flex-1 cursor-pointer focus:outline-none active:bg-white/5 transition-colors pointer-events-auto"
          onClick={handleNext}
          aria-label="Próximo story"
        />
      </div>

      <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-24 z-20 flex flex-col gap-4 sm:gap-5 max-w-md mx-auto">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/50 transition-all">
            <Heart
              className={`h-6 w-6 sm:h-7 sm:w-7 transition-all ${
                isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"
              }`}
            />
          </div>
          {likesCount > 0 && (
            <span className="text-white text-xs sm:text-sm font-semibold drop-shadow-lg">{likesCount}</span>
          )}
        </button>

        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/50 transition-all">
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          {storyComments.length > 0 && (
            <span className="text-white text-xs sm:text-sm font-semibold drop-shadow-lg">{storyComments.length}</span>
          )}
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-2.5 sm:p-3 hover:bg-black/50 transition-all">
            <Share2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
        </button>
      </div>

      {storyComments.length > 0 && (
        <div className="absolute left-3 sm:left-4 bottom-20 sm:bottom-24 z-20 max-w-[60%] space-y-2">
          {storyComments.slice(-3).map((comment) => (
            <div key={comment.id} className="bg-black/40 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
              <div className="flex items-start gap-2">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                  <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-[8px] sm:text-[10px]">
                    {comment.userName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-white/90 font-medium text-[10px] sm:text-xs">{comment.userName}</p>
                  <p className="text-white text-[10px] sm:text-xs break-words">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCommentInput && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent max-w-md mx-auto">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/10">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleComment()
                }
              }}
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim()}
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
