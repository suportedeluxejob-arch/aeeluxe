import redis from "./cache"

interface RateLimitConfig {
  interval: number // Time window in seconds
  limit: number // Max requests per interval
}

// Rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  CREATE_POST: { interval: 60, limit: 5 }, // 5 posts per minute
  CREATE_STORY: { interval: 60, limit: 10 }, // 10 stories per minute
  LIKE_ACTION: { interval: 60, limit: 30 }, // 30 likes per minute
  RETWEET_ACTION: { interval: 60, limit: 20 }, // 20 retweets per minute
  SEND_MESSAGE: { interval: 60, limit: 20 }, // 20 messages per minute
  UPLOAD_MEDIA: { interval: 300, limit: 10 }, // 10 uploads per 5 minutes

  // Auth endpoints
  LOGIN_ATTEMPT: { interval: 300, limit: 5 }, // 5 attempts per 5 minutes
  SIGNUP_ATTEMPT: { interval: 3600, limit: 3 }, // 3 signups per hour per IP

  // General API
  API_GENERAL: { interval: 60, limit: 100 }, // 100 requests per minute
} as const

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  // Generate rate limit key
  private getKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`
  }

  // Check if request is allowed
  async check(
    identifier: string,
    action: string,
  ): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
  }> {
    const key = this.getKey(identifier, action)

    try {
      // Get current count
      const current = (await redis.get<number>(key)) || 0

      if (current >= this.config.limit) {
        // Rate limit exceeded
        const ttl = await redis.ttl(key)
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + ttl * 1000,
        }
      }

      // Increment counter
      const newCount = await redis.incr(key)

      // Set expiration on first request
      if (newCount === 1) {
        await redis.expire(key, this.config.interval)
      }

      return {
        allowed: true,
        remaining: this.config.limit - newCount,
        resetAt: Date.now() + this.config.interval * 1000,
      }
    } catch (error) {
      console.error("Rate limit check error:", error)
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: this.config.limit,
        resetAt: Date.now() + this.config.interval * 1000,
      }
    }
  }

  // Reset rate limit for identifier
  async reset(identifier: string, action: string): Promise<void> {
    const key = this.getKey(identifier, action)
    await redis.del(key)
  }
}

// Helper function to create rate limiter
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

// Pre-configured rate limiters
export const rateLimiters = {
  createPost: new RateLimiter(RATE_LIMITS.CREATE_POST),
  createStory: new RateLimiter(RATE_LIMITS.CREATE_STORY),
  likeAction: new RateLimiter(RATE_LIMITS.LIKE_ACTION),
  retweetAction: new RateLimiter(RATE_LIMITS.RETWEET_ACTION),
  sendMessage: new RateLimiter(RATE_LIMITS.SEND_MESSAGE),
  uploadMedia: new RateLimiter(RATE_LIMITS.UPLOAD_MEDIA),
  loginAttempt: new RateLimiter(RATE_LIMITS.LOGIN_ATTEMPT),
  signupAttempt: new RateLimiter(RATE_LIMITS.SIGNUP_ATTEMPT),
  apiGeneral: new RateLimiter(RATE_LIMITS.API_GENERAL),
}
