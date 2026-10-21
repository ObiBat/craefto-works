-- What a delivered request achieved: Craefto writes a short outcome and links
-- to the work (a live page, a design file, a document), and the client's
-- portal shows them on the request and under Past work. And the day of the
-- month each client's hours refresh.

alter table public.client_requests
  add column outcome text,
  add column outcome_links jsonb not null default '[]'::jsonb,
  add constraint client_requests_outcome_links_check check (jsonb_typeof(outcome_links) = 'array');

-- Clients still can't preset anything Craefto decides, outcomes included.
alter policy "Clients send requests" on public.client_requests
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
    and outcome is null
    and outcome_links = '[]'::jsonb
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );

-- The day of the month a client's hours refresh: 1 for calendar months, or
-- the day agreed with them (JapanoMa's refresh on the 25th). Up to the 28th,
-- so every month has the day.
alter table public.client_accounts
  add column cycle_day smallint not null default 1,
  add constraint client_accounts_cycle_day_check check (cycle_day between 1 and 28);
