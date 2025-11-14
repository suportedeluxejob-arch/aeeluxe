import {
  createPost,
  getPostsByAuthor,
  getPostsByAuthorPaginated,
  toggleLike,
  toggleRetweet,
  checkUserLiked,
  checkUserRetweeted,
  addComment,
  getPostComments,
  type Post,
  type Comment,
} from "@/lib/firebase/firestore"

export class PostService {
  static async create(postData: Omit<Post, "id" | "createdAt" | "updatedAt">) {
    return createPost(postData)
  }

  static async getByAuthor(authorUsername: string) {
    return getPostsByAuthor(authorUsername)
  }

  static async getByAuthorPaginated(authorUsername: string, lastDoc?: any, limit = 15) {
    return getPostsByAuthorPaginated(authorUsername, lastDoc, limit)
  }

  static async toggleLike(userId: string, postId: string) {
    return toggleLike(userId, postId)
  }

  static async toggleRetweet(userId: string, postId: string, originalAuthorId: string) {
    return toggleRetweet(userId, postId, originalAuthorId)
  }

  static async checkLiked(userId: string, postId: string) {
    return checkUserLiked(userId, postId)
  }

  static async checkRetweeted(userId: string, postId: string) {
    return checkUserRetweeted(userId, postId)
  }

  static async addComment(commentData: Omit<Comment, "id" | "createdAt">) {
    return addComment(commentData)
  }

  static subscribeToComments(postId: string, callback: (comments: Comment[]) => void) {
    return getPostComments(postId, callback)
  }
}
