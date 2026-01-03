-- Enable citext extension for case-insensitive emails
CREATE EXTENSION IF NOT EXISTS citext;

-- Device type enum for click analytics
CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet', 'other');

-- Users table
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links table (source of truth for redirection)
CREATE TABLE links (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  short_code    VARCHAR(16) NOT NULL UNIQUE,
  original_url  TEXT NOT NULL,
  title         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  expires_at    TIMESTAMPTZ,
  password_hash TEXT,  -- nullable: password-protected links
  total_clicks  BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw click events (append-only analytics)
CREATE TABLE click_events (
  id            BIGSERIAL PRIMARY KEY,
  link_id       BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash       TEXT,
  user_agent    TEXT,
  browser       TEXT,
  os            TEXT,
  device        device_type,
  country_code  CHAR(2),
  referrer      TEXT
);

-- Daily aggregated stats (fast dashboard queries)
CREATE TABLE link_daily_stats (
  id            BIGSERIAL PRIMARY KEY,
  link_id       BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  total_clicks  BIGINT NOT NULL DEFAULT 0,
  unique_ips    BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(link_id, date)
);

-- Rate limiting bans (abuse prevention)
CREATE TABLE rate_limit_bans (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ip_hash       TEXT NOT NULL,
  reason        TEXT NOT NULL,
  banned_until  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_expires_at
ON links (expires_at)
WHERE expires_at IS NOT NULL;
CREATE INDEX idx_links_short_code_active ON links(short_code) WHERE is_active = true;

-- Click events indexes (analytics queries)
CREATE INDEX idx_click_events_link_time ON click_events(link_id, occurred_at);
CREATE INDEX idx_click_events_link_country ON click_events(link_id, country_code);
CREATE INDEX idx_click_events_link_browser ON click_events(link_id, browser);

-- Daily stats index
CREATE INDEX idx_link_daily_stats_link_date ON link_daily_stats(link_id, date);

-- Rate limit bans index
CREATE INDEX idx_rate_limit_bans_ip_hash
ON rate_limit_bans(ip_hash);


-- Migration tracking table (created automatically by tool)
-- CREATE TABLE pgmigrations (...);  -- handled by postgres-migrations
