"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon, Play } from "lucide-react"
import Image from "next/image"

interface ProfilePictureMenuProps {
  isOpen: boolean
  onClose: () => void
  onViewStory: () => void
  onViewProfilePicture: () => void
  hasStory: boolean
}

export function ProfilePictureMenu({
  isOpen,
  onClose,
  onViewStory,
  onViewProfilePicture,
  hasStory,
}: ProfilePictureMenuProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[300px] p-0 gap-0 bg-background/95 backdrop-blur-md border-border/50">
        <div className="flex flex-col">
          {hasStory && (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-4 rounded-none hover:bg-muted/50 transition-colors"
              onClick={() => {
                onViewStory()
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Ver story</span>
              </div>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-4 rounded-none hover:bg-muted/50 transition-colors"
            onClick={() => {
              onViewProfilePicture()
              onClose()
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Ver foto de perfil</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ProfilePictureViewerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  displayName: string
}

export function ProfilePictureViewer({ isOpen, onClose, imageUrl, displayName }: ProfilePictureViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-black/95 backdrop-blur-md border-0">
        <div className="relative w-full aspect-square">
          {/* Replaced img with Next.js Image component for optimization */}
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={displayName}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 512px"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
