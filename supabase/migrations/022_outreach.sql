-- Lead Engine, phase 1 (October 2026): outreach moves from the command
-- centre's JSON files into Supabase, the one record of campaigns, prospects,
-- their history and the addresses never to email. Only the site's server
-- reads and writes these tables (service role, src/lib/outreach): RLS is on
-- with no policies, and the public API roles get no grants at all.

create table if not exists public.outreach_campaigns (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_prospects (
  campaign_id text not null references public.outreach_campaigns (id) on delete cascade,
  id text not null check (id ~ '^[a-z0-9-]+$'),
  company text not null,
  segment text not null default '',
  state text,
  location text,
  website text not null default '',
  -- The command centre's research, kept as it records it: findings, whyFit,
  -- systems, journey, metrics, applicationMethod, branding, businessType,
  -- size, shots and checkedAt.
  research jsonb not null default '{}'::jsonb,
  contact_kind text not null check (contact_kind in ('email', 'form', 'none')),
  contact_value text not null default '',
  -- Where the address is published: the evidence for inferred consent under
  -- the Spam Act (conspicuous publication). Approval requires it.
  contact_source text,
  priority text not null default 'B' check (priority in ('A', 'B', 'C')),
  status text not null default 'researched'
    check (status in ('researched', 'drafted', 'approved', 'sent', 'replied', 'meeting', 'won', 'lost', 'not-a-fit')),
  email_subject text,
  email_body text,
  email_language text,
  approved_at timestamptz,
  -- Where it was approved ('admin' or 'command-centre'), and a fingerprint of
  -- the recipient, subject and body approved: sending (phase 2) refuses an
  -- email that no longer matches it.
  approved_by text,
  approved_hash text,
  sent_at timestamptz,
  -- { dueAt, body, sentAt? }, dates as YYYY-MM-DD in Sydney.
  follow_up jsonb,
  -- Things to read before sending, from the research.
  flags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, id),
  check (status <> 'approved' or (approved_at is not null and approved_hash is not null))
);

create index if not exists outreach_prospects_status_idx on public.outreach_prospects (status);
create index if not exists outreach_prospects_contact_idx on public.outreach_prospects (contact_value);

-- Each prospect's history, newest first in the command centre's timeline.
create table if not exists public.outreach_events (
  id bigint generated always as identity primary key,
  campaign_id text not null,
  prospect_id text not null,
  at timestamptz not null default now(),
  event text not null,
  -- 'admin', 'command-centre', 'import' or 'system'.
  actor text not null default 'system',
  foreign key (campaign_id, prospect_id) references public.outreach_prospects (campaign_id, id) on delete cascade,
  -- Importing the same history twice adds nothing.
  unique (campaign_id, prospect_id, at, event)
);

create index if not exists outreach_events_at_idx on public.outreach_events (at desc);

-- Addresses ('name@domain') and whole domains ('@domain') never to email:
-- opt-outs, bounces, complaints. Checked before every approval (and, from
-- phase 2, every send). Nothing removes an entry automatically.
create table if not exists public.outreach_suppressions (
  value text primary key check (value = lower(value) and value ~ '^[^@\s]*@[^@\s]+$'),
  reason text not null check (reason in ('opt-out', 'bounce', 'complaint', 'manual')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.outreach_campaigns enable row level security;
alter table public.outreach_prospects enable row level security;
alter table public.outreach_events enable row level security;
alter table public.outreach_suppressions enable row level security;

-- New public tables are granted to anon and authenticated by default; these
-- are for the server alone.
revoke all on public.outreach_campaigns, public.outreach_prospects, public.outreach_events, public.outreach_suppressions from anon, authenticated;
revoke all on sequence public.outreach_events_id_seq from anon, authenticated;

drop trigger if exists outreach_campaigns_updated_at on public.outreach_campaigns;
create trigger outreach_campaigns_updated_at before update on public.outreach_campaigns
  for each row execute function update_updated_at();
drop trigger if exists outreach_prospects_updated_at on public.outreach_prospects;
create trigger outreach_prospects_updated_at before update on public.outreach_prospects
  for each row execute function update_updated_at();
