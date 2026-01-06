import Redis from "ioredis";

export const redisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
};

class RedisService {
  private client: Redis;
  private isReady: boolean = false;

  constructor() {
    this.client = new Redis({
      ...redisOptions,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('Too many Redis reconnection attempts, giving up');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.registerEvents();
  }
  private registerEvents() {
    this.client.on("ready", () => {
      console.log("✅ Redis ready");
      this.isReady = true;
    });

    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    this.client.on("end", () => {
      console.warn("Redis connection closed");
      this.isReady = false;
    });

    this.client.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client.status !== "end") {
      await this.client.quit();
    }
  }
}

export const redisService = new RedisService();
export const redis = redisService.getClient();