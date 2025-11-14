"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "firebase/auth"
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export function usePostRetweets(user: User | null | undefined, postIds: string[]) {
  const [retweetedPosts, setRetweetedPosts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const checkRetweetedPosts = useCallback(async () => {
    if (!user || postIds.length === 0) {
      setRetweetedPosts(new Set())
      return
    }

    setIsLoading(true)
    try {
      const retweetChecks = postIds.map(async (postId) => {
        const retweetRef = doc(db, "retweets", `${user.uid}_${postId}`)
        const retweetDoc = await getDoc(retweetRef)
        return retweetDoc.exists() ? postId : null
      })

      const results = await Promise.all(retweetChecks)
      const retweetedSet = new Set(results.filter((id): id is string => id !== null))
      setRetweetedPosts(retweetedSet)
    } catch (error) {
      console.error("Error checking retweeted posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, postIds])

  useEffect(() => {
    const timeoutId = setTimeout(checkRetweetedPosts, 300)
    return () => clearTimeout(timeoutId)
  }, [checkRetweetedPosts])

  const toggleRetweet = useCallback(
    async (postId: string, creatorId: string) => {
      if (!user) return

      const isRetweeted = retweetedPosts.has(postId)
      const retweetRef = doc(db, "retweets", `${user.uid}_${postId}`)
      const postRef = doc(db, "posts", postId)

      // Optimistic update
      setRetweetedPosts((prev) => {
        const newSet = new Set(prev)
        if (isRetweeted) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })

      try {
        if (isRetweeted) {
          await deleteDoc(retweetRef)
          await updateDoc(postRef, {
            retweets: increment(-1),
          })
        } else {
          await setDoc(retweetRef, {
            userId: user.uid,
            postId,
            creatorId,
            createdAt: new Date().toISOString(),
          })
          await updateDoc(postRef, {
            retweets: increment(1),
          })
        }
      } catch (error) {
        console.error("Error toggling retweet:", error)
        // Revert optimistic update on error
        setRetweetedPosts((prev) => {
          const newSet = new Set(prev)
          if (isRetweeted) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
      }
    },
    [user, retweetedPosts],
  )

  return { retweetedPosts, isLoading, toggleRetweet, refetch: checkRetweetedPosts }
}
