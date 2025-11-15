"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth"
import { getUserProfile } from "@/lib/firebase/firestore"

interface UserProfileContextType {
  userProfile: any
  loading: boolean
  error: any
}

const UserProfileContext = createContext<UserProfileContextType>({
  userProfile: null,
  loading: true,
  error: null,
})

export const useUserProfileContext = () => useContext(UserProfileContext)

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading, error: authError } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setUserProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getUserProfile(user.uid)
      .then((profile) => {
        setUserProfile(profile)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [user, authLoading])

  return (
    <UserProfileContext.Provider value={{ userProfile, loading, error }}>
      {children}
    </UserProfileContext.Provider>
  )
}
