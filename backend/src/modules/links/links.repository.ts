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

export async function incrementTotalClicks(linkId: number) {
  await query(
    `
    UPDATE links
    SET total_clicks = total_clicks + 1
    WHERE id = $1
    `,
    [linkId],
  );
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