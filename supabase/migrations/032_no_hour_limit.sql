-- A client Craefto agrees no hour limit with directly (no plan bought
-- online): their portal shows the hours used, never a balance or a renewal,
-- as the Partner plan does. Time is logged to see the effort and plan
-- priorities, not to cap the work. Clients can only read their account (014),
-- so only Craefto sets it.
alter table public.client_accounts add column no_hour_limit boolean not null default false;
