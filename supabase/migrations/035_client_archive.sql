-- An account Craefto has put away (a test account, a client who's moved on):
-- kept whole, with nothing deleted, but out of Today, the Clients list (bar
-- its Archived filter), the Friday effort email and Telegram's /hours and
-- /log. Unarchiving brings it all back. Clients can only read their account
-- (014), so only Craefto sets it.
alter table public.client_accounts add column archived_at timestamptz;
