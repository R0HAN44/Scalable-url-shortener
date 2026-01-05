import { Worker, Job } from 'bullmq';
import { ClickEvent } from '../queues/analytics.queue';
import { redis } from '../services/redis.service';
import { insertClickEvent } from '../modules/analytics/click-events.repository';
import { computeDailyLinkStats, incrementTotalClicks } from '../modules/links/links.repository';
import { createDailyStatsLink, upsertDailyLinkStats } from '../modules/analytics/link-daily-stats.repository';
import { UAParser } from 'ua-parser-js';


async function processClickEvent(job: Job<ClickEvent>) {
    const {
        link_id,
        ip_hash,
        user_agent,
        referrer,
        occurred_at,
    } = job.data;

    const parser = new UAParser(user_agent);
    const ua = parser.getResult();

    const date = occurred_at.split('T')[0];

    try {
        await insertClickEvent({
            link_id,
            ip_hash,
            user_agent,
            referrer,
            occurred_at,
            browser: ua.browser.name ?? null,
            os: ua.os.name ?? null,
            device: ua.device.type ?? 'desktop',
        });

        const total_clicks = await incrementTotalClicks(link_id);

        const { total_clicks: daily_clicks, unique_ips } =
            await computeDailyLinkStats(link_id, date);

        await upsertDailyLinkStats(
            link_id,
            date,
            daily_clicks,
            unique_ips,
        );

        console.log(`Processed click event for link ${link_id}`);
    } catch (error) {
        console.error(`Failed to process click event:`, error);
        throw error;
    }
}


export function startAnalyticsWorker(): Worker<ClickEvent> {
    console.log('🚀 Starting analytics worker...');

    const worker = new Worker<ClickEvent>(
        'analytics',
        processClickEvent,
        {
            connection: redis,
            concurrency: 10, // Process 10 jobs concurrently
            limiter: {
                max: 100, // Max 100 jobs
                duration: 1000, // per second
            },
        }
    );

    // Event listeners
    worker.on('completed', (job: any) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job: any, err: any) => {
        console.error(`Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err: any) => {
        console.error('Worker error:', err);
    });

    worker.on('ready', () => {
        console.log('Analytics worker is ready and listening for jobs');
    });

    process.on('SIGTERM', async () => {
        console.log('Shutting down worker gracefully...');
        await worker.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('Shutting down worker gracefully...');
        await worker.close();
        process.exit(0);
    });

    return worker;
}

