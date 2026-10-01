-- Client portal: when a plan's welcome emails went out. Stripe can deliver
-- the same checkout event more than once; the webhook claims this before
-- emailing, so each plan is welcomed once.
alter table public.client_subscriptions add column welcomed_at timestamptz;
