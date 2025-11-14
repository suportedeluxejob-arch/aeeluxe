"use client"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"

export function useAuthUser() {
  const [user, loading, error] = useAuthState(auth)

  return {
    user,
    isLoading: loading,
    error,
    isAuthenticated: !!user,
    userId: user?.uid,
  }
}
