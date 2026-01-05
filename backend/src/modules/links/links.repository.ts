import { query } from "../../db";


export type LinkRow = {
  id: number;
  user_id: number;
  short_code: string;
  original_url: string;
  title: string | null;
  is_active: boolean;
  expires_at: string | null;
  password_hash: string | null;
  total_clicks: number;
  created_at: string;
  updated_at: string;
};

export async function createLink(input: {
  userId: number;
  shortCode: string;
  originalUrl: string;
  title?: string;
  expiresAt?: string | null;
  passwordHash?: string | null;
}) {
  const rows = await query<LinkRow>(
    `
    INSERT INTO links (
      user_id, short_code, original_url, title, expires_at, password_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      input.userId,
      input.shortCode,
      input.originalUrl,
      input.title ?? null,
      input.expiresAt ?? null,
      input.passwordHash ?? null,
    ],
  );
  return rows[0];
}

export async function findByShortCode(shortCode: string) {
  const rows = await query<LinkRow>(
    `
    SELECT *
    FROM links
    WHERE short_code = $1
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    `,
    [shortCode],
  );
  return rows[0] ?? null;
}

export async function incrementTotalClicks(
  linkId: number,
): Promise<number> {
  const rows = await query<{ total_clicks: number }>(
    `
    UPDATE links
    SET total_clicks = total_clicks + 1
    WHERE id = $1
    RETURNING total_clicks
    `,
    [linkId],
  );

  if (rows.length === 0) {
    throw new Error(`Link ${linkId} not found`);
  }

  return rows[0].total_clicks;
}


// For dashboard: get user's links
export async function findLinksByUserId(userId: number): Promise<LinkRow[]> {
  return query<LinkRow>(
    `
    SELECT *
    FROM links
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId],
  );
}

export async function computeDailyLinkStats(
  linkId: number,
  date: string, 
): Promise<{
  total_clicks: number;
  unique_ips: number;
}> {
  const rows = await query<{
    total_clicks: string;
    unique_ips: string;
  }>(
    `
    SELECT
      COUNT(*) AS total_clicks,
      COUNT(DISTINCT ip_hash) AS unique_ips
    FROM click_events
    WHERE link_id = $1
      AND occurred_at::date = $2
    `,
    [linkId, date],
  );

  return {
    total_clicks: Number(rows[0]?.total_clicks ?? 0),
    unique_ips: Number(rows[0]?.unique_ips ?? 0),
  };
}
