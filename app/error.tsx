"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground">Ocorreu um erro inesperado. Nossa equipe foi notificada.</p>
      </div>
      <div className="flex gap-4">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/feed")}>
          Voltar ao Feed
        </Button>
      </div>
    </div>
  )
}
