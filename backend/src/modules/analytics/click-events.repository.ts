import { query } from '../../db';

export async function insertClickEvent(input: {
  linkId: number;
  ipHash?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  countryCode?: string | null;
  referrer?: string | null;
}) {
  await query(
    `
    INSERT INTO click_events
      (link_id, ip_hash, user_agent, browser, os, device, country_code, referrer)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      input.linkId,
      input.ipHash ?? null,
      input.userAgent ?? null,
      input.browser ?? null,
      input.os ?? null,
      input.device ?? null,
      input.countryCode ?? null,
      input.referrer ?? null,
    ],
  );
}
