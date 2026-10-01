-- Client portal: who a checkout belongs to.
--
-- Each subscription remembers its Stripe customer. A returning client who
-- subscribes again while signed out pays as a new Stripe customer, and their
-- plan still belongs to their account.
alter table public.client_subscriptions add column stripe_customer_id text;
create index client_subscriptions_customer_idx on public.client_subscriptions (stripe_customer_id);

-- The checkout that created an account. Only that checkout's return page may
-- sign its payer straight in: anyone can type an existing client's email into
-- Stripe Checkout, so paying with it must never open that client's portal.
alter table public.client_accounts add column created_by_checkout text unique;
