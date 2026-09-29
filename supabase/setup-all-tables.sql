-- =====================================================
-- CRAEFTO WORKS - COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- HELPER FUNCTION (if not exists)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONTENT PIPELINE TABLES
-- =====================================================

-- Agent Runs (Tracking all agent executions)
CREATE TABLE IF NOT EXISTS content_agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('trend_scanner', 'insight_synthesiser', 'seo_strategist', 'editorial_writer', 'editor_guardian')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  tokens_used INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  triggered_by UUID REFERENCES content_agent_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Insights (From Trend Scanner)
CREATE TABLE IF NOT EXISTS content_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('trend', 'competitor', 'keyword', 'audience', 'manual')),
  source_url TEXT,
  source_title TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  pillar_id UUID REFERENCES journal_pillars(id),
  relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'trending')),
  target_keywords TEXT[] DEFAULT '{}',
  search_volume_estimate INTEGER,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected', 'used')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  agent_run_id UUID REFERENCES content_agent_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Briefs (From Insight Synthesiser)
CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID REFERENCES content_insights(id),
  working_title TEXT NOT NULL,
  angle TEXT NOT NULL,
  thesis_statement TEXT,
  target_audience TEXT,
  content_type TEXT CHECK (content_type IN ('article', 'deep_dive', 'case_study', 'tutorial', 'opinion')),
  suggested_pillar_id UUID REFERENCES journal_pillars(id),
  outline JSONB DEFAULT '[]',
  key_takeaways TEXT[] DEFAULT '{}',
  primary_keyword TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  meta_description_draft TEXT,
  suggested_links TEXT[] DEFAULT '{}',
  target_word_count INTEGER,
  estimated_reading_time INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'in_progress', 'completed')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  agent_run_id UUID REFERENCES content_agent_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Drafts (From Editorial Writer)
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID REFERENCES content_briefs(id),
  version INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  word_count INTEGER,
  reading_time INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  readability_score DECIMAL(3,1),
  seo_score DECIMAL(3,1),
  originality_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'needs_revision', 'approved', 'published')),
  agent_run_id UUID REFERENCES content_agent_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Reviews (From Editor Guardian)
CREATE TABLE IF NOT EXISTS content_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID REFERENCES content_drafts(id),
  draft_version INTEGER,
  verdict TEXT NOT NULL CHECK (verdict IN ('approve', 'revise', 'reject')),
  readability_score DECIMAL(3,1),
  seo_score DECIMAL(3,1),
  originality_score DECIMAL(3,1),
  accuracy_score DECIMAL(3,1),
  brand_voice_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  summary TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  critical_issues TEXT[] DEFAULT '{}',
  suggestions JSONB DEFAULT '[]',
  human_override BOOLEAN DEFAULT FALSE,
  human_verdict TEXT CHECK (human_verdict IN ('approve', 'revise', 'reject')),
  human_notes TEXT,
  human_reviewed_by TEXT,
  human_reviewed_at TIMESTAMPTZ,
  agent_run_id UUID REFERENCES content_agent_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Queue (Pipeline orchestration)
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL CHECK (item_type IN ('insight', 'brief', 'draft', 'review')),
  item_id UUID NOT NULL,
  current_stage TEXT NOT NULL CHECK (current_stage IN ('trend_scan', 'synthesize', 'seo_optimize', 'write', 'review', 'human_approval', 'publish')),
  next_stage TEXT CHECK (next_stage IN ('synthesize', 'seo_optimize', 'write', 'review', 'human_approval', 'publish', 'complete')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'awaiting_approval', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Article views table (aggregated daily)
CREATE TABLE IF NOT EXISTS article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT NULL,
  scroll_depth_avg DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, view_date)
);

-- Article engagement events
CREATE TABLE IF NOT EXISTS article_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article performance summary
CREATE TABLE IF NOT EXISTS article_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE UNIQUE,
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT NULL,
  avg_scroll_depth DECIMAL(5,2) DEFAULT NULL,
  share_count INTEGER NOT NULL DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT NULL,
  bounce_rate DECIMAL(5,4) DEFAULT NULL,
  views_last_7_days INTEGER NOT NULL DEFAULT 0,
  views_last_30_days INTEGER NOT NULL DEFAULT 0,
  trend_score DECIMAL(8,4) DEFAULT 0,
  first_view_at TIMESTAMPTZ,
  last_view_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B test variants
CREATE TABLE IF NOT EXISTS article_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  variant_a TEXT NOT NULL,
  variant_b TEXT NOT NULL,
  variant_a_views INTEGER NOT NULL DEFAULT 0,
  variant_b_views INTEGER NOT NULL DEFAULT 0,
  variant_a_clicks INTEGER NOT NULL DEFAULT 0,
  variant_b_clicks INTEGER NOT NULL DEFAULT 0,
  winner TEXT,
  confidence DECIMAL(5,4) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent feedback for improvement loop
CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES journal_articles(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  feedback_score INTEGER NOT NULL CHECK (feedback_score >= 1 AND feedback_score <= 5),
  feedback_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agent_runs_type ON content_agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON content_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_insights_status ON content_insights(status);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_article_views_article_date ON article_views(article_id, view_date DESC);
CREATE INDEX IF NOT EXISTS idx_article_events_article_id ON article_events(article_id);
CREATE INDEX IF NOT EXISTS idx_article_performance_trend ON article_performance(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent ON agent_feedback(agent_type);

-- =====================================================
-- ROW LEVEL SECURITY (service role only)
-- =====================================================
ALTER TABLE content_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

-- No policies: the app reaches these tables only with the service-role key,
-- which bypasses RLS. A "FOR ALL USING (true)" policy would let anyone with
-- the public anon key read and write every row (see migration 013).

-- =====================================================
-- SEED DATA - Content Pillars (if not exists)
-- =====================================================
INSERT INTO journal_pillars (name, slug, description, color)
VALUES
  ('Engineering', 'engineering', 'Technical deep dives, code tutorials, and engineering best practices', '#3b82f6'),
  ('Design', 'design', 'UI/UX principles, design systems, and visual thinking', '#8b5cf6'),
  ('Product', 'product', 'Product strategy, growth tactics, and startup insights', '#22c55e'),
  ('AI & Automation', 'ai-automation', 'AI tools, automation workflows, and intelligent systems', '#f59e0b')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED DATA - Default Author (if not exists)
-- =====================================================
INSERT INTO journal_authors (name, slug, role, bio, expertise)
VALUES
  ('Craefto Team', 'craefto-team', 'Editorial Team', 'The Craefto Works editorial team shares insights on design, engineering, and product development.', ARRAY['Design Systems', 'Web Development', 'AI Tools'])
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
SELECT 'Database setup complete!' as status;
