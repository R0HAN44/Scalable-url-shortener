import { query } from '../../db';

export async function insertClickEvent(input: {
  link_id: number;
  ip_hash?: string | null;
  user_agent?: string | null;
  occurred_at: string;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  country_code?: string | null;
  referrer?: string | null;
}) {
  await query(
    `
    INSERT INTO click_events
      (link_id, ip_hash, user_agent, browser, os, device, country_code, referrer, occurred_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      input.link_id,
      input.ip_hash ?? null,
      input.user_agent ?? null,
      input.browser ?? null,
      input.os ?? null,
      input.device ?? null,
      input.country_code ?? null,
      input.referrer ?? null,
      input.occurred_at ?? null,
    ],
  );
}
