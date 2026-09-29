-- =====================================================
-- PRIORITY 2 FEATURES - DATABASE MIGRATIONS
-- Content Pipeline Automation, Client Hub, Analytics
-- =====================================================

-- =====================================================
-- 1. CONTENT PIPELINE AUTOMATION
-- =====================================================

-- Scheduled scan configuration
CREATE TABLE IF NOT EXISTS pipeline_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  hour INTEGER DEFAULT 9 CHECK (hour >= 0 AND hour <= 23),
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  topics TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media snippets for content
ALTER TABLE content_drafts 
ADD COLUMN IF NOT EXISTS twitter_snippet TEXT,
ADD COLUMN IF NOT EXISTS linkedin_snippet TEXT,
ADD COLUMN IF NOT EXISTS instagram_caption TEXT,
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS optimal_publish_times JSONB DEFAULT '[]';

-- Batch operations log
CREATE TABLE IF NOT EXISTS batch_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('approve', 'reject', 'delete', 'publish')),
  item_type TEXT NOT NULL CHECK (item_type IN ('insight', 'brief', 'draft')),
  item_ids UUID[] NOT NULL,
  performed_by TEXT,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CLIENT HUB - PROJECTS & MILESTONES
-- =====================================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('lead', 'active', 'completed', 'churned')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('website', 'webapp', 'branding', 'consulting', 'maintenance', 'other')),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
  health TEXT DEFAULT 'on_track' CHECK (health IN ('on_track', 'at_risk', 'delayed', 'blocked')),
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  sort_order INTEGER DEFAULT 0,
  deliverables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client documents repository
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  category TEXT CHECK (category IN ('contract', 'proposal', 'invoice', 'design', 'deliverable', 'other')),
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ANALYTICS ENHANCEMENTS
-- =====================================================

-- Goals table for tracking
CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('lead_generation', 'page_views', 'conversion', 'engagement', 'custom')),
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion funnel stages
CREATE TABLE IF NOT EXISTS funnel_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  event_name TEXT NOT NULL, -- The event that triggers this stage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel conversions tracking
CREATE TABLE IF NOT EXISTS funnel_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  stage_id UUID REFERENCES funnel_stages(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Lead source attribution  
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_session ON funnel_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_goals_status ON analytics_goals(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pipeline_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_conversions ENABLE ROW LEVEL SECURITY;

-- No policies: the app reaches these tables only with the service-role key,
-- which bypasses RLS. A "FOR ALL USING (true)" policy would let anyone with
-- the public anon key read and write every row (see migration 013).

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default funnel stages
INSERT INTO funnel_stages (name, description, sort_order, event_name) VALUES
  ('Visited Site', 'User visited the website', 1, 'page_view'),
  ('Viewed Services', 'User viewed services page', 2, 'view_services'),
  ('Viewed Portfolio', 'User viewed work/portfolio', 3, 'view_portfolio'),
  ('Contact Form Started', 'User started filling contact form', 4, 'contact_form_start'),
  ('Lead Submitted', 'User submitted contact form', 5, 'lead_submit')
ON CONFLICT DO NOTHING;

-- Default pipeline schedule (weekly scans)
INSERT INTO pipeline_schedules (name, schedule_type, day_of_week, hour, enabled, topics) VALUES
  ('Weekly Trend Scan', 'weekly', 1, 9, true, ARRAY['web development', 'design systems', 'AI tools', 'startup growth'])
ON CONFLICT DO NOTHING;

SELECT 'Priority 2 database migrations complete!' as status;
