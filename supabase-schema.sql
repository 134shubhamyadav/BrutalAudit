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

-- ── Row Level Security ───────────────────────────────────────
-- Disabled because all database operations are server-side mediated and validated via Firebase Admin auth on the Next.js API.
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;

SELECT 'Schema created successfully' AS result;

-- Rate Limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id    TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

-- Disable RLS on rate_limits
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.audit_cache DISABLE ROW LEVEL SECURITY;
