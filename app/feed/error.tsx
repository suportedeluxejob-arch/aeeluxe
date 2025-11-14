"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Feed error:", error)
  }, [error])

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center gap-6 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Erro ao carregar o feed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar os posts. Por favor, tente novamente.
        </p>
      </div>
      <Button onClick={reset}>Recarregar feed</Button>
    </div>
  )
}
