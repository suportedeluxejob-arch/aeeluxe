"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toggleLikeAction } from "@/app/actions/likes"

export function usePostLikes(userId: string | undefined, posts: any[]) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const postIds = posts.map((post) => post.id).filter(Boolean)

  const checkLikedPosts = useCallback(async () => {
    if (!userId || postIds.length === 0) {
      setLikedPosts(new Set())
      return
    }

    setIsLoading(true)
    try {
      const likesRef = collection(db, "likes")
      const q = query(likesRef, where("userId", "==", userId), where("postId", "in", postIds.slice(0, 10))) // Firestore limit
      const querySnapshot = await getDocs(q)

      const likedSet = new Set<string>()
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data()
        likedSet.add(data.postId)
      })

      setLikedPosts(likedSet)
    } catch (error) {
      console.error("Error checking liked posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, postIds.join(",")])

  useEffect(() => {
    const timeoutId = setTimeout(checkLikedPosts, 300)
    return () => clearTimeout(timeoutId)
  }, [checkLikedPosts])

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!userId) {
        throw new Error("Usuário não autenticado")
      }

      const isLiked = likedPosts.has(postId)

      // Optimistic update
      setLikedPosts((prev) => {
        const newSet = new Set(prev)
        if (isLiked) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })

      try {
        const result = await toggleLikeAction({ postId, userId })

        if (!result.success) {
          // Revert optimistic update on error
          setLikedPosts((prev) => {
            const newSet = new Set(prev)
            if (isLiked) {
              newSet.add(postId)
            } else {
              newSet.delete(postId)
            }
            return newSet
          })
          throw new Error(result.error || "Erro ao curtir post")
        }

        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          if (result.liked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })

        // Return XP gained and like count for notification
        return {
          xpGained: result.xpGained || 0,
          likeCount: result.likeCount || 0,
          liked: result.liked,
        }
      } catch (error) {
        // Revert optimistic update on error
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.add(postId)
          } else {
            newSet.delete(postId)
          }
          return newSet
        })
        throw error
      }
    },
    [userId, likedPosts],
  )

  return { likedPosts, isLoading, toggleLike, refetch: checkLikedPosts }
}
