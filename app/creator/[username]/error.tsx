"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function CreatorProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Creator profile error:", error)
  }, [error])

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center gap-6 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Erro ao carregar perfil</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar o perfil da criadora. Por favor, tente novamente.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/creators")}>
          Ver criadoras
        </Button>
      </div>
    </div>
  )
}
