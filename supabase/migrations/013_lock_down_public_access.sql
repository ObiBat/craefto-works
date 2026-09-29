-- ============================================================================
-- 013: Lock down tables that were readable (and writable) with the public key
-- ============================================================================
-- Found 2026-09-29: with only the public anon key (it ships in every page),
-- anyone could read journal_subscribers (emails and tokens), article_views,
-- article_events, content_drafts and content_briefs, and write to several
-- more. The culprits were policies such as "Anyone can read by confirmation
-- token" (USING (true)), "Service can manage ..." (FOR ALL USING (true), which
-- applies to every role, not just the service role) and the "Allow all for
-- ..." policies from supabase/setup-all-tables.sql.
--
-- Every route in the app reaches these tables with the service-role key, which
-- bypasses row level security, so they need no policies at all. This keeps
-- RLS on and drops every policy on them, whatever it is named, leaving the
-- service role as the only way in. Safe to run more than once.
-- ============================================================================

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'journal_subscribers',
    'article_views',
    'article_events',
    'article_performance',
    'article_ab_tests',
    'agent_feedback',
    'content_agent_runs',
    'content_insights',
    'content_briefs',
    'content_drafts',
    'content_reviews',
    'content_queue'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Afterwards, list any policy left anywhere that still lets everyone in:
--
--   SELECT tablename, policyname, roles, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true')
--   ORDER BY tablename;
