import { query } from "../../db";


export type LinkRow = {
  id: number;
  user_id: number;
  short_code: string;
  original_url: string;
  is_active: boolean;
  expires_at: string | null;
  total_clicks: number;
  created_at: string;
  updated_at: string;
};

export async function createLink(input: {
  userId: number;
  shortCode: string;
  originalUrl: string;
}) {
  const rows = await query<LinkRow>(
    `
    INSERT INTO links (user_id, short_code, original_url)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [input.userId, input.shortCode, input.originalUrl],
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
