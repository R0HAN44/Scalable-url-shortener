import { redis } from "./redis.service";

export class ClickCache {
    private static readonly CLICK_PREFIX = "clicks:";
    private static readonly TTL_SECONDS = 86400 * 2; // 2 days

    /**
     * Increment click counter for a link (per day)
     */
    static async increment(linkId: number): Promise<number> {
        const today = this.getTodayKey();
        const key = `${this.CLICK_PREFIX}${linkId}:${today}`;

        const count: number = await redis.incr(key);

        // Set expiry only once (safe under concurrency)
        if (count === 1) {
            await redis.expire(key, this.TTL_SECONDS);
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
        return count ? Number(count) : 0;
    }

    /**
     * Get all pending click counters (SCAN-based, non-blocking)
     */
    static async getAllPendingCounters(): Promise<
        Array<{ linkId: number; date: string; count: number }>
    > {
        const pattern = `${this.CLICK_PREFIX}*`;
        let cursor = "0";
        const keys: string[] = [];

        do {
            const [nextCursor, batch] = await redis.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                100
            );
            cursor = nextCursor;
            keys.push(...batch);
        } while (cursor !== "0");

        if (keys.length === 0) return [];

        const values = await redis.mget(...keys);

        return keys.map((key, index) => {
            const [, linkId, dateKey] = key.split(":");

            return {
                linkId: Number(linkId),
                date: this.formatDateFromKey(dateKey),
                count: Number(values[index] ?? 0),
            };
        });
    }

    /**
     * Delete a counter after flushing to DB
     */
    static async deleteCounter(linkId: number, date: string): Promise<void> {
        const dateKey = date.replace(/-/g, "");
        const key = `${this.CLICK_PREFIX}${linkId}:${dateKey}`;
        await redis.del(key);
    }

    /**
     * Get today's date key (YYYYMMDD)
     */
    private static getTodayKey(): string {
        const d = new Date();
        return (
            d.getUTCFullYear().toString() +
            String(d.getUTCMonth() + 1).padStart(2, "0") +
            String(d.getUTCDate()).padStart(2, "0")
        );
    }

    /**
     * Convert YYYYMMDD → YYYY-MM-DD
     */
    private static formatDateFromKey(dateKey: string): string {
        return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(
            6,
            8
        )}`;
    }
}
