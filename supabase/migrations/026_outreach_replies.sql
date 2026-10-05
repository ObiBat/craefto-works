-- Lead Engine, phase 3 (October 2026): replies. The sender's clock also reads
-- the outreach mailbox (inbox and spam) and keeps only what answers outreach:
-- replies to our emails, mail from addresses we've written to, and bounce
-- notices for them. Fixed rules sort the obvious (bounces, automatic replies,
-- opt-out words); the AI labels the rest and quotes the line it relied on.
-- Nothing is ever sent back automatically.

create table if not exists public.outreach_replies (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  prospect_id text not null,
  -- A reply to a test copy is a test: it's labelled and alerted, but changes nothing.
  mode text not null check (mode in ('test', 'live')),
  -- Their Message-ID; one row per email, however often the inbox is read.
  message_id text not null unique,
  in_reply_to text,
  -- Their References header, so our answer threads under the whole conversation.
  refs text[] not null default '{}',
  -- The email of ours it answers, when it says so (In-Reply-To or References).
  answers uuid references public.outreach_messages (id) on delete set null,
  from_address text not null,
  from_name text,
  subject text,
  -- Their new words, without the quoted thread underneath.
  body text not null,
  -- The whole text as it arrived, in case the quote was cut in the wrong place.
  full_text text,
  received_at timestamptz not null,
  mailbox text not null,
  imap_uid bigint,
  label text not null check (label in ('interested', 'question', 'referral', 'not-now', 'not-interested', 'opt-out', 'out-of-office', 'auto-reply', 'bounce', 'unclear')),
  label_source text not null check (label_source in ('rule', 'ai', 'manual')),
  -- What the AI said and how sure it was, even when that was below the bar and it went to "unclear".
  ai_label text,
  confidence numeric,
  -- The line the label rests on, quoted from their email.
  quote text,
  summary text,
  suggested_reply text,
  -- An opt-out that complained about being emailed (suppressed as a complaint).
  complaint boolean not null default false,
  -- Who they pointed to (referral): never emailed automatically, there's no consent for that address.
  referral jsonb,
  -- Their return date (out of office) or when to try again (not now).
  return_on date,
  -- What it was labelled before a correction by hand: the record for tuning the thresholds.
  corrected_from text,
  corrected_at timestamptz,
  -- When what the label means was done (prospect closed, follow-up moved, address suppressed).
  applied_at timestamptz,
  alerted_at timestamptz,
  digested_at timestamptz,
  -- A "not now" whose date has come: listed once in the morning digest.
  reminded_on date,
  handled_at timestamptz,
  handled_by text,
  lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  -- A prospect with replies can't be deleted: they're the record.
  foreign key (campaign_id, prospect_id) references public.outreach_prospects (campaign_id, id) on delete restrict
);

create index if not exists outreach_replies_prospect_idx on public.outreach_replies (campaign_id, prospect_id, received_at desc);
create index if not exists outreach_replies_open_idx on public.outreach_replies (received_at desc) where handled_at is null;

-- Where reading each mailbox got to (IMAP UIDs are only meaningful with their UIDVALIDITY).
create table if not exists public.outreach_sync (
  mailbox text primary key,
  uidvalidity bigint,
  last_uid bigint not null default 0,
  synced_at timestamptz,
  last_error text
);

-- Answers sent from admin are kept with the rest of what we sent, one per reply of theirs.
alter table public.outreach_messages drop constraint if exists outreach_messages_kind_check;
alter table public.outreach_messages add constraint outreach_messages_kind_check check (kind in ('initial', 'follow-up', 'reply'));
alter table public.outreach_messages add column if not exists answers_reply uuid references public.outreach_replies (id) on delete set null;
create unique index if not exists outreach_messages_reply_once on public.outreach_messages (answers_reply)
  where answers_reply is not null and status in ('sending', 'sent');

-- "Never twice" covers the first email and the follow-up; a conversation can have many answers.
drop index if exists public.outreach_messages_live_once;
drop index if exists public.outreach_messages_test_once;
create unique index outreach_messages_live_once on public.outreach_messages (campaign_id, prospect_id, kind)
  where mode = 'live' and status in ('sending', 'sent', 'bounced') and kind <> 'reply';
create unique index outreach_messages_test_once on public.outreach_messages (campaign_id, prospect_id, kind)
  where mode = 'test' and status in ('sending', 'sent') and kind <> 'reply';

-- The morning digest goes once a day.
alter table public.outreach_settings add column if not exists digest_sent_on date;

alter table public.outreach_replies enable row level security;
alter table public.outreach_sync enable row level security;
revoke all on public.outreach_replies, public.outreach_sync from anon, authenticated;
