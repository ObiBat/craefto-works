-- Lead Engine, phase 0 (October 2026): groundwork for one sales pipeline.

-- 1. Leads are only created through the site's server (api/leads, the Cal.com
--    webhook), which validates, rate-limits and scores them with the service
--    role. This anonymous policy let anyone holding the public key insert
--    leads directly and skip all of that.
drop policy if exists "Anyone can submit leads" on public.leads;

-- 2. The admin orders stages by "position", a column the live database
--    already has but no migration created. Recorded here so a fresh database
--    matches.
alter table public.pipeline_stages add column if not exists position integer;
update public.pipeline_stages set position = "order" where position is null;

-- 3. "Meeting booked", between Contacted and Qualified: where a lead goes
--    when a Discovery Call is booked (lib/discovery-calls.ts).
update public.pipeline_stages
  set "order" = "order" + 1, position = position + 1
  where "order" >= 3
    and not exists (select 1 from public.pipeline_stages where slug = 'meeting');
insert into public.pipeline_stages (name, slug, "order", position, color)
  values ('Meeting booked', 'meeting', 3, 3, '#06B6D4')
  on conflict (slug) do nothing;

-- 4. Cancelled calls get their own activity type.
alter table public.lead_activities drop constraint if exists lead_activities_type_check;
alter table public.lead_activities add constraint lead_activities_type_check check (
  type = any (array[
    'form_submission', 'email_sent', 'email_opened', 'email_clicked', 'note_added', 'call_logged',
    'meeting_scheduled', 'meeting_cancelled', 'stage_changed', 'score_updated', 'page_viewed',
    'file_uploaded', 'ai_analysis'
  ])
);
