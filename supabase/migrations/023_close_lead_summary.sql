-- Found while checking the advisors for Lead Engine phase 1 (4 October 2026):
-- two views over leads were SECURITY DEFINER (they read as their owner, so
-- RLS on leads didn't apply) and granted to the public API roles. With the
-- site's public key, anyone could read every lead through lead_summary
-- (names, emails, phones, messages, IP addresses). Nothing in the site uses
-- either view; the admin reads leads with the service role.

revoke all on public.lead_summary, public.daily_stats from anon, authenticated;

-- Read as the caller from now on, so RLS on leads applies to them too.
alter view public.lead_summary set (security_invoker = true);
alter view public.daily_stats set (security_invoker = true);
