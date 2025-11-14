"use server"

import { revalidatePath } from "next/cache"
import { toggleLike } from "@/lib/firebase/firestore"
import { toggleLikeSchema, type ToggleLikeInput } from "@/lib/validations"

export async function toggleLikeAction(input: ToggleLikeInput & { userId: string }) {
  try {
    // Validate input
    const validatedData = toggleLikeSchema.parse(input)

    // Verify userId is provided
    if (!input.userId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      }
    }

    const result = await toggleLike(input.userId, validatedData.postId)

    revalidatePath("/feed")
    revalidatePath("/creator/[username]", "page")

    return {
      success: true,
      liked: result.liked,
      likeCount: result.likeCount,
      xpGained: result.xpGained,
      message: result.xpGained > 0 ? `Você ganhou ${result.xpGained} XP!` : undefined,
    }
  } catch (error) {
    console.error("Error in toggleLikeAction:", error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "Erro ao curtir post. Tente novamente.",
    }
  }
}
