import { Redis } from "@upstash/redis"

// Initialize Redis client with environment variables
const redis = new Redis({
  url: process.env.UPSTASH_KV_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_KV_REST_API_TOKEN!,
})

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  CREATOR_PROFILE: 300, // 5 minutes
  USER_PROFILE: 300, // 5 minutes
  POST: 60, // 1 minute
  FEED: 30, // 30 seconds
  STORIES: 60, // 1 minute
  STATS: 120, // 2 minutes
} as const

// Cache key generators
export const cacheKeys = {
  creatorProfile: (username: string) => `creator:${username}`,
  userProfile: (userId: string) => `user:${userId}`,
  post: (postId: string) => `post:${postId}`,
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
  stories: (creatorId: string) => `stories:${creatorId}`,
  stats: (creatorId: string) => `stats:${creatorId}`,
  likes: (userId: string) => `likes:${userId}`,
  retweets: (userId: string) => `retweets:${userId}`,
}

// Generic cache operations
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get<T>(key)
      return data
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  },

  // Set cached data with TTL
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error("Cache set error:", error)
    }
  },

  // Delete cached data
  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error("Cache delete pattern error:", error)
    }
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key)
    } catch (error) {
      console.error("Cache increment error:", error)
      return 0
    }
  },

  // Set expiration on existing key
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl)
    } catch (error) {
      console.error("Cache expire error:", error)
    }
  },
}

// Invalidation helpers
export const invalidateCache = {
  // Invalidate creator profile and related data
  async creator(username: string, creatorId: string) {
    await Promise.all([
      cache.del(cacheKeys.creatorProfile(username)),
      cache.del(cacheKeys.stories(creatorId)),
      cache.del(cacheKeys.stats(creatorId)),
      cache.delPattern(`feed:*`), // Invalidate all feeds
    ])
  },

  // Invalidate post and related feeds
  async post(postId: string) {
    await Promise.all([
      cache.del(cacheKeys.post(postId)),
      cache.delPattern(`feed:*`), // Invalidate all feeds
    ])
  },

  // Invalidate user's feed
  async userFeed(userId: string) {
    await cache.delPattern(`feed:${userId}:*`)
  },

  // Invalidate stories
  async stories(creatorId: string) {
    await cache.del(cacheKeys.stories(creatorId))
  },
}

export default redis
