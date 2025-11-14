export async function validateAndCropImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem"))
        return
      }

      // Define tamanho final como quadrado 1080x1080
      const size = 1080
      canvas.width = size
      canvas.height = size

      // Calcula dimensões para crop centralizado
      const sourceSize = Math.min(img.width, img.height)
      const sourceX = (img.width - sourceSize) / 2
      const sourceY = (img.height - sourceSize) / 2

      // Desenha a imagem cortada e redimensionada
      ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)

      // Converte para blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Erro ao processar imagem"))
          }
        },
        "image/jpeg",
        0.92, // Qualidade 92%
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Erro ao carregar imagem"))
    }

    img.src = url
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}
