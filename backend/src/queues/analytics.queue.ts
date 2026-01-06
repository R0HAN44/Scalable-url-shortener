import { Queue } from "bullmq";
import { redisOptions } from "../services/redis.service";

export interface ClickEvent {
    link_id: number;
    occurred_at: string;
    ip_hash: string;
    user_agent?: string;
    browser?: string;
    os?: string;
    device?: string;
    country_code?: string;
    referrer?: string;
}

type AnalyticsJobName = "click";

export const analyticsQueue = new Queue<ClickEvent, void, AnalyticsJobName>("analytics", {
    connection: redisOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 24 * 3600,
        },
    },
});


export async function publishClickEvent(data: ClickEvent): Promise<void> {
    await analyticsQueue.add('click', data, {
        priority: 1,
    })
}

const shutdown = async () => {
    await analyticsQueue.close();
    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
