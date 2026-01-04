import { redis } from "./redis.service";

export class NotFoundCache {
  private static readonly NOT_FOUND_PREFIX = 'notfound:';
  private static readonly TTL = 300; // 5 minutes

  /**
   * Check if a short code is cached as not found
   */
  static async isNotFound(shortCode: string): Promise<boolean> {
    const key = `${this.NOT_FOUND_PREFIX}${shortCode}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * Mark a short code as not found
   */
  static async markNotFound(shortCode: string): Promise<void> {
    const key = `${this.NOT_FOUND_PREFIX}${shortCode}`;
    await redis.setEx(key, this.TTL, '1');
  }

  /**
   * Remove not-found cache (when link is created)
   */
  static async removeNotFound(shortCode: string): Promise<void> {
    const key = `${this.NOT_FOUND_PREFIX}${shortCode}`;
    await redis.del(key);
  }
}