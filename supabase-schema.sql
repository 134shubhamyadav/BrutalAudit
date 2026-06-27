-- BrutalAudit Supabase Schema
-- Run this in your Supabase Dashboard → SQL Editor

-- ── Create audits table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  repo_full_name  TEXT NOT NULL,
  repo_owner      TEXT NOT NULL,
  repo_name       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'done', 'failed')),
  findings        JSONB,
  scores          JSONB,
  summary         TEXT,
  repo_meta       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ── Indexes for fast queries ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits (user_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_status ON audits (user_id, status, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_repo ON audits (user_id, repo_full_name);

-- ── Enable Row Level Security ─────────────────────────────────
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "users_select_own_audits" ON audits;
DROP POLICY IF EXISTS "users_insert_own_audits" ON audits;
DROP POLICY IF EXISTS "users_update_own_audits" ON audits;
DROP POLICY IF EXISTS "public_read_done_audits"  ON audits;

-- Users can only read their own audits
CREATE POLICY "users_select_own_audits" ON audits
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));

-- Users can only insert their own audits
CREATE POLICY "users_insert_own_audits" ON audits
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Users can only update their own audits
CREATE POLICY "users_update_own_audits" ON audits
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'));

-- Public can read DONE audits (for report sharing at /report/[id])
CREATE POLICY "public_read_done_audits" ON audits
  FOR SELECT USING (status = 'done');

SELECT 'Schema created successfully' AS result;

-- Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id    TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own rate limits"
  ON public.rate_limits FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own rate limits"
  ON public.rate_limits FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- ── Background Jobs ───────────────────────────────────────────
-- Note: Requires pg_cron extension to be enabled in Supabase Dashboard
-- SELECT cron.schedule(
--   'cleanup-stale-audits',
--   '*/10 * * * *',
--   $$
--     UPDATE public.audits
--     SET status = 'failed'
--     WHERE status = 'running'
--     AND created_at < NOW() - INTERVAL '10 minutes';
--   $$
-- );

-- ── Audit Cache ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name  TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  is_detailed     BOOLEAN NOT NULL DEFAULT false,
  audit_id        UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_cache_lookup ON public.audit_cache (repo_full_name, commit_sha, is_detailed);

ALTER TABLE public.audit_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read audit cache" ON public.audit_cache FOR SELECT USING (true);
CREATE POLICY "Users insert audit cache" ON public.audit_cache FOR INSERT WITH CHECK (true);
