-- Lead Engine, phase 4 (October 2026): Ask Craefto, the website assistant.
-- One row per conversation, holding the transcript exactly as the visitor saw
-- it. The server keeps it: each request sends only the visitor's new message,
-- so a transcript can't be rewritten from the browser. Chats that don't become
-- an enquiry are deleted after 90 days (lib/assistant/housekeeping.ts).

create table if not exists public.assistant_chats (
  -- The id the browser made for the conversation.
  id uuid primary key,
  -- The UI messages: the visitor's, the assistant's, and its tool steps.
  messages jsonb not null default '[]',
  -- How many messages the visitor sent (limits and reporting).
  turns integer not null default 0,
  -- The page it was opened on.
  page text,
  -- A one-way daily fingerprint of the visitor's IP address, for rate limits only.
  ip_hash text,
  user_agent text,
  status text not null default 'open' check (status in ('open', 'enquiry', 'handoff')),
  lead_id uuid references public.leads (id) on delete set null,
  -- Questions it couldn't answer from the site's content (the weekly digest).
  gaps text[] not null default '{}',
  -- Sentences the price check replaced, as written: the record for tuning.
  blocked text[] not null default '{}',
  newsletter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_chats_updated_idx on public.assistant_chats (updated_at desc);
create index if not exists assistant_chats_ip_idx on public.assistant_chats (ip_hash, updated_at desc);
create index if not exists assistant_chats_lead_idx on public.assistant_chats (lead_id) where lead_id is not null;

alter table public.assistant_chats enable row level security;
revoke all on public.assistant_chats from anon, authenticated;
