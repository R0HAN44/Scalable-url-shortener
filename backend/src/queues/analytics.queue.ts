import { Queue } from 'bullmq';
import { redis } from '../services/redis.service';

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

export const analyticsQueue = new Queue<ClickEvent>('analytics', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000,
        },
        removeOnFail: {
            age: 24 * 3600, // Keep failed jobs for 24 hours
        },
    }
})

export async function publishClickEvent(data: ClickEvent): Promise<void> {
    await analyticsQueue.add('click', data, {
        priority: 1, // Lower priority than critical jobs
    })
}

process.on('SIGTERM', async () => {
  await analyticsQueue.close();
});