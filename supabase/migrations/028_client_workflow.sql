-- The client workflow: what makes the effort behind each request visible to
-- the client, and keeps expectations where the work is.
--
--   * Estimates agreed before work starts: Ask Craefto gives an initial range
--     within seconds, Craefto confirms it, the client approves it.
--   * Time logged against each request, shown to the client.
--   * A monthly hours allowance Craefto sets for clients outside the Stripe
--     plans, and the order of the work queue.
--   * The assistant's replies in a request's conversation, a history of each
--     request's moves, and the weekly effort email.
--
-- Additive: nothing the live site already uses changes meaning.

-- ── Accounts ───────────────────────────────────────────────────────────────
-- An allowance set by Craefto (null: the running plans' hours), what to call
-- it, the client's time zone for their calendar, and the weekly email.
alter table public.client_accounts
  add column monthly_hours numeric(5, 1) check (monthly_hours is null or (monthly_hours > 0 and monthly_hours <= 400)),
  add column engagement text check (engagement is null or char_length(engagement) <= 120),
  add column time_zone text not null default 'Australia/Sydney' check (char_length(time_zone) between 1 and 64),
  add column weekly_email boolean not null default true,
  add column weekly_sent_on date;

-- ── Requests ───────────────────────────────────────────────────────────────
-- Two new steps (an estimate waiting for the client's approval; approved and
-- waiting its turn) and withdrawn; the estimate itself; the queue; dates.
alter table public.client_requests drop constraint client_requests_status_check;
alter table public.client_requests
  add constraint client_requests_status_check
    check (status in ('received', 'estimated', 'queued', 'in_progress', 'needs_info', 'delivered', 'withdrawn')),
  add column estimate_low numeric(5, 1),
  add column estimate_high numeric(5, 1),
  add column estimate_state text not null default 'none' check (estimate_state in ('none', 'initial', 'confirmed', 'approved')),
  add column estimate_note text check (estimate_note is null or char_length(estimate_note) <= 2000),
  add column queue_position integer,
  add column target_date date,
  add column needed_by date,
  add column approved_at timestamptz,
  add column delivered_at timestamptz,
  add constraint client_requests_estimate_check
    check ((estimate_low is null and estimate_high is null) or (estimate_low > 0 and estimate_high >= estimate_low and estimate_high <= 400));

-- A client sends a request as it starts out: no estimate, place or dates of
-- Craefto's (the server sets those, with the service role).
drop policy "Clients send requests" on public.client_requests;
create policy "Clients send requests" on public.client_requests
  for insert to authenticated
  with check (
    status = 'received'
    and estimate_state = 'none'
    and estimate_low is null
    and estimate_high is null
    and estimate_note is null
    and queue_position is null
    and target_date is null
    and approved_at is null
    and delivered_at is null
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );

-- ── Messages ───────────────────────────────────────────────────────────────
-- Ask Craefto writes in a request's conversation too (clients still write
-- only as themselves: their insert policy requires author = 'client').
alter table public.client_messages drop constraint client_messages_author_check;
alter table public.client_messages
  add constraint client_messages_author_check check (author in ('client', 'craefto', 'assistant'));

-- ── Time ───────────────────────────────────────────────────────────────────
-- Time Craefto logs, against a request or the account generally (planning,
-- calls). Clients read theirs; only the server writes.
create table public.client_time_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  request_id uuid references public.client_requests (id) on delete set null,
  minutes integer not null check (minutes between 1 and 1440),
  note text not null default '' check (char_length(note) <= 500),
  worked_on date not null,
  created_at timestamptz not null default now()
);
create index client_time_entries_account_idx on public.client_time_entries (account_id, worked_on);
create index client_time_entries_request_idx on public.client_time_entries (request_id);
alter table public.client_time_entries enable row level security;
create policy "Clients read their time" on public.client_time_entries
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));

-- ── Request history ────────────────────────────────────────────────────────
-- Each move a request makes, for its timeline. Only the server writes.
create table public.client_request_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  request_id uuid not null references public.client_requests (id) on delete cascade,
  kind text not null check (kind in ('sent', 'estimated', 'confirmed', 'approved', 'started', 'needs_info', 'delivered', 'withdrawn', 'reopened')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index client_request_events_request_idx on public.client_request_events (request_id, created_at);
alter table public.client_request_events enable row level security;
create policy "Clients read their request history" on public.client_request_events
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));

-- ── Grants ─────────────────────────────────────────────────────────────────
-- Least privilege on the new tables (as assistant_chats has): nothing for the
-- public role, reading only for signed-in clients (rows filtered by the
-- policies above), and writes by the server alone.
revoke all on public.client_time_entries, public.client_request_events from anon, authenticated;
grant select on public.client_time_entries, public.client_request_events to authenticated;
