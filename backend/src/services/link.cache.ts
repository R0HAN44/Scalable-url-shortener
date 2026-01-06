import { redis } from "./redis.service";

export interface CachedLink {
    id: number;
    original_url: string;
    is_active: boolean;
    expires_at: string | null;
    password_hash: string | null;
    user_id: number;
}

export class LinkCache {
    private static readonly LINK_PREFIX = "link:";
    private static readonly DEFAULT_TTL_SECONDS = 86400; // 24 hours

    /**
     * Get link from cache
     */
    static async get(shortCode: string): Promise<CachedLink | null> {
        const key = `${this.LINK_PREFIX}${shortCode}`;

        const data = await redis.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data) as CachedLink;
        } catch (err) {
            await redis.del(key);
            return null;
        }
    }

    /**
     * Set link in cache with dynamic TTL
     */
    static async set(shortCode: string, link: CachedLink): Promise<void> {
        const key = `${this.LINK_PREFIX}${shortCode}`;
        const ttl = this.calculateTTL(link.expires_at);

        await redis.set(key, JSON.stringify(link), "EX", ttl);
    }

    /**
     * Invalidate link cache
     */
    static async invalidate(shortCode: string): Promise<void> {
        const key = `${this.LINK_PREFIX}${shortCode}`;
        await redis.del(key);
    }

    /**
     * Invalidate multiple links
     */
    static async invalidateMany(shortCodes: string[]): Promise<void> {
        if (shortCodes.length === 0) return;

        const keys = shortCodes.map(code => `${this.LINK_PREFIX}${code}`);

        await redis.del(...keys);
    }

    /**
     * Calculate TTL based on expiry date
     */
    private static calculateTTL(expiresAt: string | null): number {
        if (!expiresAt) {
            return this.DEFAULT_TTL_SECONDS;
        }

        const expiryTime = Date.parse(expiresAt);
        const now = Date.now();

        const secondsUntilExpiry = Math.floor((expiryTime - now) / 1000);

        if (secondsUntilExpiry <= 0) {
            return 60;
        }

        return Math.min(secondsUntilExpiry, this.DEFAULT_TTL_SECONDS);
    }
}
