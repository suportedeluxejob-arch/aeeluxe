export function saveAuthToken() {
  // Salva um token simples no cookie para o middleware verificar
  document.cookie = `auth-token=true; path=/; max-age=${60 * 60 * 24 * 7}` // 7 dias
}

export function removeAuthToken() {
  // Remove o token do cookie
  document.cookie = "auth-token=; path=/; max-age=0"
}

export async function getAuthToken(): Promise<string | null> {
  // Get the current user's ID token for server verification
  const { auth } = await import("@/lib/firebase/config")
  const user = auth.currentUser
  
  if (!user) {
    return null
  }
  
  try {
    const token = await user.getIdToken()
    return token
  } catch (error) {
    console.error("[v0] Error getting auth token:", error)
    return null
  }
}
