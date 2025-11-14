"use client"
import { useState, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, ImageIcon, Loader2, VideoIcon, Upload, Trash2 } from "lucide-react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock } from "lucide-react"
import { put } from "@vercel/blob"

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

export default function CreatePostModal({ open, onOpenChange, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [videoFiles, setVideoFiles] = useState<{ file: File; preview: string }[]>([])
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState(0)
  const [requiredLevel, setRequiredLevel] = useState<"Gold" | "Premium" | "Diamante">("Gold")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImageFiles((prev) => [...prev, ...newImages])
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newVideos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setVideoFiles((prev) => [...prev, ...newVideos])
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      setUploadProgress("Enviando imagens...")
      const imageUrls = await Promise.all(
        imageFiles.map(async ({ file }) => {
          const blob = await put(file.name, file, {
            access: "public",
          })
          return blob.url
        }),
      )

      setUploadProgress("Enviando vídeos...")
      const videoUrls = await Promise.all(
        videoFiles.map(async ({ file }) => {
          const blob = await put(file.name, file, {
            access: "public",
          })
          return blob.url
        }),
      )

      setUploadProgress("Criando post...")
      await addDoc(collection(db, "posts"), {
        content: content.trim(),
        images: imageUrls,
        videos: videoUrls,
        likes: Math.max(0, likes),
        comments: Math.max(0, comments),
        requiredLevel,
        authorDisplayName: "Isabelle Lua",
        authorUsername: "isabellelua",
        authorProfileImage: "/beautiful-woman-profile.png",
        authorId: "isabelle-lua-uid",
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Clean up
      imageFiles.forEach(({ preview }) => URL.revokeObjectURL(preview))
      videoFiles.forEach(({ preview }) => URL.revokeObjectURL(preview))

      setContent("")
      setImageFiles([])
      setVideoFiles([])
      setLikes(0)
      setComments(0)
      setRequiredLevel("Gold")
      setUploadProgress("")

      onOpenChange(false)
      onPostCreated?.()
    } catch (error) {
      console.error("Error creating post:", error)
      setUploadProgress("")
    } finally {
      setLoading(false)
    }
  }

  const adjustCounter = (type: "likes" | "comments", increment: boolean, amount = 1) => {
    const adjustment = increment ? amount : -amount

    switch (type) {
      case "likes":
        setLikes((prev) => Math.max(0, prev + adjustment))
        break
      case "comments":
        setComments((prev) => Math.max(0, prev + adjustment))
        break
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Criar Novo Post</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/beautiful-woman-profile.png" alt="Isabelle Lua" />
              <AvatarFallback>IL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">Isabelle Lua</h3>
              <p className="text-muted-foreground text-xs">@isabellelua</p>
            </div>
          </div>

          {/* Post Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className="bg-transparent resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
            rows={4}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                <ImageIcon className="h-4 w-4 mr-2" />
                Imagens
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="h-8 bg-transparent"
              >
                <Upload className="h-3 w-3 mr-1" />
                Adicionar Imagens
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {imageFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imageFiles.map(({ preview }, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-border group">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                <VideoIcon className="h-4 w-4 mr-2" />
                Vídeos
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                className="h-8 bg-transparent"
              >
                <Upload className="h-3 w-3 mr-1" />
                Adicionar Vídeos
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>

            {videoFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {videoFiles.map(({ preview }, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-border group">
                    <video src={preview} className="w-full h-32 object-cover" controls>
                      Seu navegador não suporta vídeos.
                    </video>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVideo(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground">Controle de Métricas de Engajamento</h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Curtidas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">❤️ Curtidas</span>
                  <span className="text-sm font-bold text-muted-foreground">{formatNumber(likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("likes", false, 100)}
                  >
                    -100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("likes", false, 10)}
                  >
                    -10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("likes", true, 10)}
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("likes", true, 100)}
                  >
                    +100
                  </Button>
                </div>
              </div>

              {/* Comentários */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">💬 Comentários</span>
                  <span className="text-sm font-bold text-muted-foreground">{formatNumber(comments)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("comments", false, 50)}
                  >
                    -50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("comments", false, 5)}
                  >
                    -5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("comments", true, 5)}
                  >
                    +5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 bg-transparent text-sm font-medium"
                    onClick={() => adjustCounter("comments", true, 50)}
                  >
                    +50
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Nível de Acesso Requerido
            </label>
            <Select
              value={requiredLevel}
              onValueChange={(value: "Gold" | "Premium" | "Diamante") => setRequiredLevel(value)}
            >
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gold">Gold (Gratuito)</SelectItem>
                <SelectItem value="Premium">Premium (R$ 29,90/mês)</SelectItem>
                <SelectItem value="Diamante">Diamante (R$ 58,90/mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.length}/280</span>
            {uploadProgress && <span className="text-primary">{uploadProgress}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || content.length > 280 || loading}
            className="rounded-full glow-pink-hover"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress || "Criando..."}
              </>
            ) : (
              "Criar Post"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
