import { redis } from "./redis.service";

export class RateLimitCache {
  private static readonly RATE_LIMIT_PREFIX = "ratelimit:";

  /**
   * Check and increment rate limit counter
   * Sliding window using INCR + EXPIRE
   */
  static async checkAndIncrement(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ exceeded: boolean; current: number; remaining: number }> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;

    const current = await redis.incr(fullKey);

    if (current === 1) {
      await redis.expire(fullKey, windowSeconds);
    }

    const exceeded = current > maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    return { exceeded, current, remaining };
  }

  /**
   * Rate limit for anonymous link creation (by IP)
   */
  static async checkLinkCreation(
    ipHash: string,
    maxLinks: number = 10,
    windowSeconds: number = 3600
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `create:${ipHash}`;
    const { exceeded, remaining } = await this.checkAndIncrement(
      key,
      maxLinks,
      windowSeconds
    );

    return {
      allowed: !exceeded,
      remaining,
    };
  }

  /**
   * Rate limit for authenticated user
   */
  static async checkUserLinkCreation(
    userId: number,
    maxLinks: number = 100,
    windowSeconds: number = 3600
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `user:${userId}`;
    const { exceeded, remaining } = await this.checkAndIncrement(
      key,
      maxLinks,
      windowSeconds
    );

    return {
      allowed: !exceeded,
      remaining,
    };
  }

  /**
   * Reset rate limit for a key
   */
  static async reset(key: string): Promise<void> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    await redis.del(fullKey);
  }

  /**
   * Get current count without incrementing
   */
  static async getCount(key: string): Promise<number> {
    const fullKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    const count = await redis.get(fullKey);
    return count ? Number(count) : 0;
  }
}
