-- Lead Engine, phase 2 (October 2026): sending. Approved emails go out from
-- obi@craefto.com through Spacemail, one at a time, in each recipient's
-- working hours; every message sent is kept as the record of what went to
-- whom, when and on what evidence. Server only, like the rest of outreach.

-- One row: how the sender runs. 'off' sends nothing; 'test' sends approved
-- emails to test_recipients only; 'live' sends them to the prospects.
create table if not exists public.outreach_settings (
  id integer primary key default 1 check (id = 1),
  mode text not null default 'off' check (mode in ('off', 'test', 'live')),
  -- The plan: start at 10 to 15 a day, never more than 25.
  daily_cap integer not null default 12 check (daily_cap between 1 and 25),
  test_recipients text[] not null default '{}',
  -- In the recipient's own time zone, Monday to Friday.
  window_start time not null default '09:00',
  window_end time not null default '16:30',
  follow_ups boolean not null default true,
  -- Spacing: the next send waits until this time (3 to 10 minutes apart).
  next_send_at timestamptz,
  -- Set when the sender stops itself (a bounce rate over 3%, say); cleared by hand.
  paused_reason text,
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into public.outreach_settings (id) values (1) on conflict (id) do nothing;

-- Every email the sender sends, test or live: kept as the record (six years).
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  prospect_id text not null,
  kind text not null check (kind in ('initial', 'follow-up')),
  mode text not null check (mode in ('test', 'live')),
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'bounced')),
  -- RFC 5322 Message-ID, so replies and the follow-up thread to it.
  message_id text not null unique,
  in_reply_to text,
  from_address text not null,
  to_address text not null,
  subject text not null,
  body text not null,
  -- The approved fingerprint this message matched when it was sent.
  email_hash text,
  -- The published-address check made just before sending.
  evidence jsonb,
  smtp_response text,
  error text,
  saved_to_sent boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  -- A prospect with messages can't be deleted: they're the record.
  foreign key (campaign_id, prospect_id) references public.outreach_prospects (campaign_id, id) on delete restrict
);

-- Never twice: one live first email and one live follow-up per prospect, and
-- one test copy of each. A failed attempt doesn't count, so it can be retried.
create unique index if not exists outreach_messages_live_once on public.outreach_messages (campaign_id, prospect_id, kind)
  where mode = 'live' and status in ('sending', 'sent', 'bounced');
create unique index if not exists outreach_messages_test_once on public.outreach_messages (campaign_id, prospect_id, kind)
  where mode = 'test' and status in ('sending', 'sent');
create index if not exists outreach_messages_sent_idx on public.outreach_messages (sent_at desc);
create index if not exists outreach_messages_prospect_idx on public.outreach_messages (campaign_id, prospect_id, created_at desc);

-- The latest published-address check for each prospect (or a confirmation by
-- hand where the page blocks automated checks), shown next to the email.
alter table public.outreach_prospects add column if not exists evidence jsonb;

alter table public.outreach_settings enable row level security;
alter table public.outreach_messages enable row level security;
revoke all on public.outreach_settings, public.outreach_messages from anon, authenticated;

drop trigger if exists outreach_settings_updated_at on public.outreach_settings;
create trigger outreach_settings_updated_at before update on public.outreach_settings
  for each row execute function update_updated_at();
