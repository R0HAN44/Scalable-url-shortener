import Redis from "ioredis";

export class FixedWindowRateLimiter {

    constructor(
        private readonly redisClient: Redis,
        private readonly windowSize: number,
        private readonly limit: number,
    ) {

    }

    async isAllowed(clientId: string): Promise<boolean> {
        const key = "rate_limit:" + clientId;
        const currentCountStr = this.redisClient.get(key);
        const currentCount = currentCountStr !== null ? Number(currentCountStr) : 0;

        const isAllowed: boolean = currentCount < this.limit;

        if (isAllowed) {
            const results = await this.redisClient.multi().incr(key).expire(key, this.windowSize, "NX").exec();
        }
        return isAllowed;
    }
}

export class SlidingWindowLogRateLimiter {
    constructor(
        private readonly redisClient: Redis,
        private readonly windowSizeInMs: number,
        private readonly limit: number,
    ) {

    }

    async isAllowed(ip: string): Promise<boolean> {
        const key = "rate_limit:auth:" + ip;
        const now = Date.now();
        const windowStart = now - this.windowSizeInMs;

        const results = await this.redisClient
            .multi() // Transaction for atomicity
            .zremrangebyscore(key, 0, windowStart) // remove timstamps outside current window
            .zadd(key, now) //Add current timestamp
            .zcard(key) //count the remaining elements in set
            .expire(key, Math.ceil(this.windowSizeInMs / 1000)) //set an expiry on whole set so it clears if users stop visiting 
            .exec();

        // In ioredis, exec() returns [ [err, result], [err, result], ... ] because zcard is at index 2 in our exec pipeline
        const count = results?.[2][1] as number;

        return count <= this.limit;
    }
}

export class SlidingWindowCounterRateLimiter {
    constructor(
        private readonly redisClient: Redis,
        private readonly windowSizeInMs: number,
        private readonly limit: number,
    ) {

    }

    async isAllowed(ip: string): Promise<boolean> {
        const now = Date.now();
        const currentWindowSlot = Math.floor(now / this.windowSizeInMs);
        const previousWindowSlot = currentWindowSlot - 1;

        const currentKey = `ratelimit:create:${ip}:${currentWindowSlot}`;
        const previousKey = `ratelimit:create:${ip}:${previousWindowSlot}`;

        const [prevCountRaw, currCountRaw] = await this.redisClient.mget(currentKey, previousKey);

        const prevCount = Number(prevCountRaw || "0");
        const currCount = Number(currCountRaw || "0");

        const timePassedInCurrentWindow = now % this.windowSizeInMs;
        const weight = timePassedInCurrentWindow / this.windowSizeInMs;

        const estimatedCount = currCount + (prevCount * (1 - weight));

        if (estimatedCount >= this.limit) {
            return false;
        }

        await this.redisClient.multi().incr(currentKey).expire(currentKey, Math.ceil((this.windowSizeInMs * 2) / 1000)).exec()

        return true;
    }

}


export class TokenBucketRateLimiter {
    constructor(
        private readonly redisClient: Redis,
        private readonly bucketCapacity: number, // Maximum tokens the bucket can hold
        private readonly refillRate: number, // Tokens refilled per second
    ) {

    }

    async isAllowed(ip: string): Promise<boolean> {
        const countKey = "ratelimit:redirect:count:" + ip;
        const lastRefillKey = "ratelimit:redirect:lastRefill:" + ip;

        let result = await this.redisClient.mget(countKey, lastRefillKey);

        const now: number = Date.now();

        let tokenCount: number = result[0] !== null ? Number(result[0]) : this.bucketCapacity;
        let lastRefillTime: number = result[1] !== null ? Number(result[1]) : now;

        const elapsedTimeMs = now - lastRefillTime;
        const elapsedTimeSecs = elapsedTimeMs / 1000;
        const tokensToAdd = elapsedTimeSecs * this.refillRate;

        tokenCount = Math.min(this.bucketCapacity, tokenCount + tokensToAdd);

        const isAllowed: boolean = tokenCount > 0;

        if (isAllowed) {
            tokenCount -= 1;
        }

        await this.redisClient.multi().set(lastRefillKey, now).set(countKey, tokenCount).exec();

        return isAllowed;
    }

}

// The Lua script 
const TOKEN_BUCKET_LUA = `
    local countKey = KEYS[1]
    local lastRefillKey = KEYS[2]
    local capacity = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local ttl = tonumber(ARGV[4])

    -- Get last state, default to capacity/now if keys don't exist
    local lastCount = tonumber(redis.call('get', countKey) or capacity)
    local lastRefill = tonumber(redis.call('get', lastRefillKey) or now)

    -- Calculate refill since last request
    local elapsed = math.max(0, now - lastRefill)
    local tokensToAdd = (elapsed / 1000) * refillRate
    local currentTokens = math.min(capacity, lastCount + tokensToAdd)

    if currentTokens >= 1 then
        currentTokens = currentTokens - 1
        -- Update both keys with an expiry to prevent memory leaks
        redis.call('setex', countKey, ttl, currentTokens)
        redis.call('setex', lastRefillKey, ttl, now)
        return 1 -- Allowed
    else
        return 0 -- Rate Limited
    end
`;

interface RateLimitRedis extends Redis {
    checkTokenBucket(
        countKey: string,
        refillKey: string,
        capacity: number,
        rate: number,
        now: number,
        ttl: number
    ): Promise<number>;
}

export class TokenBucketRateLimiterWithLua {
    private readonly redis: RateLimitRedis;

    constructor(
        redisClient: Redis,
        private readonly bucketCapacity: number,
        private readonly refillRate: number,
    ) {
        this.redis = redisClient as RateLimitRedis;

        this.redis.defineCommand("checkTokenBucket", {
            numberOfKeys: 2,
            lua: TOKEN_BUCKET_LUA,
        });
    }

    async isAllowed(ip: string): Promise<boolean> {
        const countKey = `ratelimit:redirect:count:${ip}`;
        const lastRefillKey = `ratelimit:redirect:lastRefill:${ip}`;

        const ttlSeconds = Math.ceil(this.bucketCapacity / this.refillRate) + 60;

        const result = await this.redis.checkTokenBucket(
            countKey,
            lastRefillKey,
            this.bucketCapacity,
            this.refillRate,
            Date.now(),
            ttlSeconds
        );

        return result === 1;
    }
}