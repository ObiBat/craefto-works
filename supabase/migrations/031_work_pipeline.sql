-- Work shipped in a client's code repository reaches their portal. A project
-- links a repository to a client; each push records its commits (a hint for
-- the time it took); each pull request merged into the main branch becomes a
-- draft that Craefto reviews, in admin or Telegram, then publishes to the
-- client's Past work and hours. Telegram prompts remember what a typed reply
-- to the bot is for (new hours, a reply to a client, time to log).
-- Service role only: RLS is on with no policies, and the client roles have no grants.

create table public.client_projects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  provider text not null default 'github' check (provider = 'github'),
  -- "owner/name", lower-cased (GitHub names are case-insensitive)
  repo text not null check (repo = lower(repo) and repo ~ '^[a-z0-9-]+/[a-z0-9._-]+$'),
  created_at timestamptz not null default now(),
  unique (provider, repo)
);
create index client_projects_account on public.client_projects (account_id);

create table public.client_work_commits (
  project_id uuid not null references public.client_projects (id) on delete cascade,
  sha text not null,
  branch text not null,
  committed_at timestamptz not null,
  -- The first line of the commit message.
  message text not null default '',
  primary key (project_id, sha)
);
create index client_work_commits_branch on public.client_work_commits (project_id, branch, committed_at);

create table public.client_work_drafts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  project_id uuid references public.client_projects (id) on delete set null,
  -- The portal request it was for, when the pull request names it (R-xxxxxxxx).
  request_id uuid references public.client_requests (id) on delete set null,
  -- "github:owner/name#123": one draft per pull request, however often GitHub retries.
  source_ref text not null unique,
  source_url text,
  -- The pull request's own title.
  source_title text not null,
  merged_at timestamptz not null,
  -- What the client reads: drafted from the pull request, then by the AI, then Craefto's edits.
  title text not null check (char_length(title) between 1 and 200),
  outcome text check (outcome is null or char_length(outcome) <= 4000),
  outcome_links jsonb not null default '[]'::jsonb check (jsonb_typeof(outcome_links) = 'array'),
  written_by text not null default 'pull_request' check (written_by in ('pull_request', 'assistant', 'craefto')),
  -- Housekeeping with nothing for the client to see (tests, dependencies): its time counts, with no Past work item.
  internal boolean not null default false,
  suggested_minutes integer check (suggested_minutes is null or suggested_minutes between 1 and 1440),
  -- Why that time: the AI's read of the change, and the commits' timings.
  suggestion_note text,
  -- The time to publish: the suggestion, until Craefto changes it (the two together teach the suggestions).
  minutes integer check (minutes is null or minutes between 1 and 1440),
  status text not null default 'pending' check (status in ('pending', 'published', 'dismissed')),
  published_mode text check (published_mode in ('past_work', 'deliver', 'time')),
  published_request_id uuid references public.client_requests (id) on delete set null,
  published_entry_id uuid references public.client_time_entries (id) on delete set null,
  published_minutes integer check (published_minutes is null or published_minutes between 0 and 1440),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_work_drafts_status on public.client_work_drafts (status, merged_at desc);
create index client_work_drafts_account on public.client_work_drafts (account_id, merged_at desc);

create table public.telegram_prompts (
  chat_id bigint not null,
  -- The bot's message asking for the reply.
  message_id bigint not null,
  action text not null check (action in ('estimate', 'reply', 'reply_general', 'log', 'deliver', 'draft_time')),
  -- The request, account or draft it's about (by action).
  target uuid not null,
  -- The alert whose buttons follow the change.
  origin_message_id bigint,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  primary key (chat_id, message_id)
);

alter table public.client_projects enable row level security;
alter table public.client_work_commits enable row level security;
alter table public.client_work_drafts enable row level security;
alter table public.telegram_prompts enable row level security;
revoke all on public.client_projects, public.client_work_commits, public.client_work_drafts, public.telegram_prompts from anon, authenticated;
