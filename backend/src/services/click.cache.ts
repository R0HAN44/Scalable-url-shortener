import { redis } from "./redis.service";

export class ClickCache {
    private static readonly CLICK_PREFIX = 'clicks:';
    private static readonly TTL = 86400 * 2; // 2 days

    /**
     * Increment click counter for a link
     */
    static async increment(linkId: number): Promise<number> {
        const today = this.getTodayKey();
        const key = `${this.CLICK_PREFIX}${linkId}:${today}`;

        const count = await redis.incr(key);

        // Set expiry only on first increment
        if (count === 1) {
            await redis.expire(key, this.TTL);
        }

        return count;
    }

    /**
     * Get click count for today
     */
    static async getCount(linkId: number): Promise<number> {
        const today = this.getTodayKey();
        const key = `${this.CLICK_PREFIX}${linkId}:${today}`;

        const count = await redis.get(key);
        return count ? parseInt(count, 10) : 0;
    }

    /**
     * Get all pending click counters (for batch processing)
     */
    static async getAllPendingCounters(): Promise<Array<{ linkId: number; date: string; count: number }>> {
        const pattern = `${this.CLICK_PREFIX}*`;

        // Note: KEYS is blocking, use SCAN in production
        const keys = await redis.keys(pattern);

        if (keys.length === 0) {
            return [];
        }

        // Get all values at once
        const values = await redis.mGet(keys);

        return keys.map((key, index) => {
            const [, linkId, date] = key.split(':');
            return {
                linkId: parseInt(linkId, 10),
                date: this.formatDateFromKey(date),
                count: parseInt(values[index] || '0', 10),
            };
        });
    }

    /**
     * Delete a counter after flushing to DB
     */
    static async deleteCounter(linkId: number, date: string): Promise<void> {
        const dateKey = date.replace(/-/g, '');
        const key = `${this.CLICK_PREFIX}${linkId}:${dateKey}`;
        await redis.del(key);
    }

    /**
     * Get today's date key (YYYYMMDD format)
     */
    private static getTodayKey(): string {
        return new Date().toISOString().split('T')[0].replace(/-/g, '');
    }

    /**
     * Convert YYYYMMDD to YYYY-MM-DD
     */
    private static formatDateFromKey(dateKey: string): string {
        return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
    }
}