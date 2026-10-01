-- 015: When a client was last emailed a sign-in link, so the portal sends at most one a minute.
alter table public.client_accounts add column sign_in_link_sent_at timestamptz;
