-- Craefto can add a request to a client's portal for them (admin), to save
-- them writing it up. It's still theirs to approve (its estimate), order
-- (their queue) or withdraw; the portal says who added it. Clients still
-- only add their own.
alter table public.client_requests
  add column added_by text not null default 'client' check (added_by in ('client', 'craefto'));

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
    and added_by = 'client'
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );
