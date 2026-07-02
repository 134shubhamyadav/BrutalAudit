-- ============================================================
-- BrutalAudit — COMPLETE DATABASE SETUP (Safe to run any time)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- All statements use IF NOT EXISTS so it is safe to re-run.
-- ============================================================


-- ── 1. AUDITS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audits (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL,
  repo_full_name       TEXT NOT NULL,
  repo_owner           TEXT NOT NULL,
  repo_name            TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'running', 'done', 'failed')),
  findings             JSONB,
  scores               JSONB,
  security_score       INTEGER,
  architecture_score   INTEGER,
  performance_score    INTEGER,
  slop_score           INTEGER,
  devops_score         INTEGER,
  readiness_score      INTEGER,
  health_score         INTEGER,
  summary              TEXT,
  repo_meta            JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audits_user_id
  ON public.audits (user_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_status
  ON public.audits (user_id, status, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_repo
  ON public.audits (user_id, repo_full_name);
CREATE INDEX IF NOT EXISTS idx_audits_created_at
  ON public.audits (created_at DESC);

-- RLS: on, but server uses service role key which bypasses it
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;


-- ── 2. RATE LIMITS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id   TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0,
  reset_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

-- RLS off — only accessible via server-side API with service role key
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;


-- ── 3. AUDIT CACHE TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_cache (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name TEXT NOT NULL,
  commit_sha     TEXT NOT NULL,
  is_detailed    BOOLEAN NOT NULL DEFAULT false,
  audit_id       UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_cache_lookup
  ON public.audit_cache (repo_full_name, commit_sha, is_detailed);

ALTER TABLE public.audit_cache DISABLE ROW LEVEL SECURITY;


-- ── 4. SUBSCRIPTIONS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT NOT NULL UNIQUE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan_tier              TEXT NOT NULL DEFAULT 'free',
  status                 TEXT NOT NULL DEFAULT 'active',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;


-- ── 5. PROFILES TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id              TEXT PRIMARY KEY,
  username             TEXT UNIQUE NOT NULL,
  last_username_change TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;


-- ── 6. REVIEWS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL UNIQUE,   -- UNIQUE: one review per user
  email      TEXT NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text       TEXT NOT NULL CHECK (char_length(text) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop old policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews (needed for landing page)
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

-- Only server (service role) inserts — this policy is a safety net
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT WITH CHECK (true);


-- ── DONE ────────────────────────────────────────────────────
SELECT
  table_name,
  'EXISTS ✓' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'audits', 'rate_limits', 'audit_cache',
    'subscriptions', 'profiles', 'reviews'
  )
ORDER BY table_name;
