-- Client portal: the October 2026 plans, chosen by budget (Starter, Growth,
-- Scale) plus AI Automation. Media and Studio are retired but stay valid for
-- subscriptions still on them (lib/pricing.ts keeps their names and prices).
alter table public.client_subscriptions drop constraint if exists client_subscriptions_plan_check;
alter table public.client_subscriptions add constraint client_subscriptions_plan_check
  check (plan in ('starter', 'growth', 'scale', 'automation', 'media', 'studio'));
