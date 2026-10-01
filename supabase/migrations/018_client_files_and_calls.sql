-- Client portal: files shared on requests and messages, and calls booked
-- through Cal.com.

-- Files live in the private client-files bucket: no public access and no
-- storage policies. The server checks who's asking, then hands out
-- short-lived signed links to upload or download. 25 MB a file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('client-files', 'client-files', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create table public.client_files (
  id uuid primary key,
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  request_id uuid references public.client_requests (id) on delete cascade,
  message_id uuid references public.client_messages (id) on delete cascade,
  uploaded_by text not null check (uploaded_by in ('client', 'craefto')),
  name text not null check (char_length(name) between 1 and 200),
  size bigint not null check (size > 0 and size <= 26214400),
  content_type text,
  path text not null unique,
  -- 'pending' from the moment an upload link is handed out until the file is
  -- sent with a request or message.
  status text not null default 'pending' check (status in ('pending', 'attached')),
  created_at timestamptz not null default now()
);
create index client_files_account_idx on public.client_files (account_id, created_at desc);
create index client_files_request_idx on public.client_files (request_id);
create index client_files_message_idx on public.client_files (message_id);

alter table public.client_files enable row level security;
create policy "Clients read their files" on public.client_files
  for select to authenticated
  using (
    status = 'attached'
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );

-- A message can be files alone.
alter table public.client_messages drop constraint if exists client_messages_body_check;
alter table public.client_messages add constraint client_messages_body_check check (char_length(body) <= 10000);

-- Calls, kept in step with Cal.com by its webhook (src/app/api/cal/webhook).
create table public.client_meetings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  cal_uid text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  join_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_meetings_account_idx on public.client_meetings (account_id, starts_at);

alter table public.client_meetings enable row level security;
create policy "Clients read their calls" on public.client_meetings
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));
