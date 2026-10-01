-- 014: Client portal for the monthly plans (Stripe subscriptions).
--
-- A client account per paying customer, linked to its Supabase Auth user and
-- Stripe customer; its subscription, kept in sync from Stripe webhooks; the
-- requests the client sends; and the messages between the client and Craefto.
--
-- Signed-in clients read only their own rows and can add requests and
-- messages as themselves (RLS). Everything else (provisioning, status sync,
-- admin replies) runs on the server with the service role.

create table public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  email text not null unique,
  name text,
  company text,
  stripe_customer_id text unique,
  -- The Checkout Session whose return page signed the client in, so that
  -- link works once.
  welcome_session_id text unique,
  created_at timestamptz not null default now()
);

create table public.client_subscriptions (
  id text primary key, -- Stripe subscription id
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  plan text not null check (plan in ('media', 'growth', 'studio')),
  status text not null, -- Stripe's status: active, past_due, canceled, ...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_subscriptions_account_idx on public.client_subscriptions (account_id);

create table public.client_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  details text not null default '' check (char_length(details) <= 10000),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'needs_info', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_requests_account_idx on public.client_requests (account_id, created_at desc);

create table public.client_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.client_accounts (id) on delete cascade,
  -- Null for the general conversation, or the request it belongs to.
  request_id uuid references public.client_requests (id) on delete cascade,
  author text not null check (author in ('client', 'craefto')),
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index client_messages_thread_idx on public.client_messages (account_id, request_id, created_at);

alter table public.client_accounts enable row level security;
alter table public.client_subscriptions enable row level security;
alter table public.client_requests enable row level security;
alter table public.client_messages enable row level security;

-- Clients see their own account, subscription, requests and messages.
create policy "Clients read their account" on public.client_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Clients read their subscriptions" on public.client_subscriptions
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));

create policy "Clients read their requests" on public.client_requests
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));

create policy "Clients read their messages" on public.client_messages
  for select to authenticated
  using (account_id in (select id from public.client_accounts where user_id = (select auth.uid())));

-- They can send requests and messages of their own, as the client only.
create policy "Clients send requests" on public.client_requests
  for insert to authenticated
  with check (
    status = 'received'
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );

create policy "Clients send messages" on public.client_messages
  for insert to authenticated
  with check (
    author = 'client'
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
    and (
      request_id is null
      or request_id in (
        select r.id from public.client_requests r
        join public.client_accounts a on a.id = r.account_id
        where a.user_id = (select auth.uid())
      )
    )
  );
