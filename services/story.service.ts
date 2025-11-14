import {
  createTemporaryStory,
  getCreatorActiveStories,
  markStoryAsViewed,
  deleteExpiredStories,
  clearStoriesCache,
} from "@/lib/firebase/firestore"

export class StoryService {
  static async create(creatorId: string, imageUrl: string, duration = 24, caption?: string, videoUrl?: string) {
    return createTemporaryStory(creatorId, imageUrl, duration, caption, videoUrl)
  }

  static async getActiveStories(creatorId: string) {
    return getCreatorActiveStories(creatorId)
  }

  static async markAsViewed(storyId: string, userId: string) {
    return markStoryAsViewed(storyId, userId)
  }

  static async deleteExpired() {
    return deleteExpiredStories()
  }

  static clearCache(creatorId?: string) {
    clearStoriesCache(creatorId)
  }
}
