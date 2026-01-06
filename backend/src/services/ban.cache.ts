import { redis } from "./redis.service";


export class BanCache {
  private static readonly BAN_PREFIX = 'ban:';

  /**
   * Check if an IP is banned
   */
  static async isBanned(ipHash: string): Promise<boolean> {
    const key = `${this.BAN_PREFIX}${ipHash}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * Ban an IP until a specific timestamp
   */
  static async banIp(
    ipHash: string,
    bannedUntil: Date,
    reason: string
  ): Promise<void> {
    const key = `${this.BAN_PREFIX}${ipHash}`;
    const ttl = Math.max(0, Math.floor((bannedUntil.getTime() - Date.now()) / 1000));

    if (ttl > 0) {
      await redis.set(
        key,
        JSON.stringify({ reason, bannedUntil }),
        "EX",
        ttl 
      );

    }
  }

  /**
   * Unban an IP
   */
  static async unbanIp(ipHash: string): Promise<void> {
    const key = `${this.BAN_PREFIX}${ipHash}`;
    await redis.del(key);
  }

  /**
   * Get ban details
   */
  static async getBanInfo(ipHash: string): Promise<{ reason: string; bannedUntil: string } | null> {
    const key = `${this.BAN_PREFIX}${ipHash}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}