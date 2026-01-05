import { query } from '../../db';
import { computeDailyLinkStats } from '../links/links.repository';

export interface LinkDailyStats {
    link_id: number;
    date: Date;
    total_clicks: number;
    unique_ips?: number;
}

export async function createDailyStatsLink(input: LinkDailyStats): Promise<LinkDailyStats | null> {
    const rows = await query<LinkDailyStats>(
        `
    INSERT INTO link_daily_stats (
      link_id, date, total_clicks, unique_ips
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
        [
            input.link_id,
            input.date,
            input.total_clicks,
            input.unique_ips ?? null,
        ],
    );

    return rows[0] ?? null;
}

export async function upsertDailyLinkStats(
    link_id: number,
    date: string,
    total_clicks: number,
    unique_ips: number,
) {
    const stats = await computeDailyLinkStats(link_id, date);

    const rows = await query<{
        total_clicks: number;
        unique_ips: number;
    }>(
        `
    INSERT INTO link_daily_stats (
      link_id, date, total_clicks, unique_ips
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (link_id, date)
    DO UPDATE SET
      total_clicks = EXCLUDED.total_clicks,
      unique_ips = EXCLUDED.unique_ips,
      updated_at = now()
    RETURNING total_clicks, unique_ips
    `,
        [link_id, date, stats.total_clicks, stats.unique_ips],
    );

    return rows[0];
}


