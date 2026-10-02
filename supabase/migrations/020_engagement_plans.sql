-- Client portal: the monthly plans as a budget ladder (Essential, Studio,
-- Partner). AI Automation is a one-off project, not a plan. Media and Growth
-- are retired but stay valid for subscriptions still on them; Studio keeps
-- its id with the new allowance. (The ids 019 allowed for a draft were never
-- used.)
alter table public.client_subscriptions drop constraint if exists client_subscriptions_plan_check;
alter table public.client_subscriptions add constraint client_subscriptions_plan_check
  check (plan in ('essential', 'studio', 'partner', 'media', 'growth'));
