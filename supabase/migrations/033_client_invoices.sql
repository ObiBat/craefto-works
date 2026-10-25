-- Invoices Craefto issues from admin: a monthly retainer agreed directly
-- (JapanoMa's), or one-off work. Numbered in the studio's one sequence,
-- shown in the client's portal under Billing with a PDF, and paid by bank
-- transfer (marked paid in admin) or by card through Stripe Checkout (marked
-- paid by the webhook). The Stripe plans' own invoices stay in Stripe.
--
-- An issued invoice keeps what it said: who it was to and from, its lines,
-- and the work it lists. Drafts are Craefto's alone; clients read their
-- invoices once issued, and only the server writes.

-- ── Accounts ───────────────────────────────────────────────────────────────
-- Who an account's invoices are made out to (the business, and the lines of
-- its address; an accounts email if not the client's own), and the fee agreed
-- each month, which drafts the month's invoice. Cents, before GST.
alter table public.client_accounts
  add column billing_name text check (billing_name is null or char_length(billing_name) between 1 and 200),
  add column billing_address text check (billing_address is null or char_length(billing_address) <= 500),
  add column billing_email text check (billing_email is null or billing_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  add column monthly_fee integer check (monthly_fee is null or monthly_fee between 1 and 100000000);

-- ── Invoices ───────────────────────────────────────────────────────────────
create table public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  -- Kept with the client: removing an account must not take its invoices.
  account_id uuid not null references public.client_accounts (id) on delete restrict,
  -- "INV-2026-011", given as it's issued (drafts have none).
  number text unique,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void')),
  -- Made out to, as it was when issued.
  bill_to_name text not null check (char_length(bill_to_name) between 1 and 200),
  bill_to_address text not null default '' check (char_length(bill_to_address) <= 500),
  bill_to_email text not null check (bill_to_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  -- From: Craefto's name, ABN, address and bank, as they were when issued (lib/portal/invoices.ts).
  issuer jsonb,
  issue_date date not null,
  due_date date not null,
  -- The month a retainer covers.
  period_start date,
  period_end date,
  -- [{ description, detail, quantity, unit_amount }], unit_amount in cents before GST.
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  subtotal integer not null default 0 check (subtotal >= 0),
  gst integer not null default 0 check (gst >= 0),
  total integer not null default 0,
  currency text not null default 'aud' check (currency = 'aud'),
  -- Shown on the invoice, under the payment details.
  notes text not null default '' check (char_length(notes) <= 2000),
  -- The work delivered between these days, listed with the invoice (a
  -- retainer's previous month); fixed into `work` as it's issued.
  work_start date,
  work_end date,
  work jsonb not null default '[]'::jsonb check (jsonb_typeof(work) = 'array'),
  sent_at timestamptz,
  paid_at timestamptz,
  paid_via text check (paid_via in ('bank_transfer', 'card', 'other')),
  -- The bank's or Stripe's reference for the payment.
  payment_reference text check (payment_reference is null or char_length(payment_reference) <= 200),
  -- The latest card checkout opened for it.
  stripe_checkout_session text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_invoices_total_check check (total = subtotal + gst),
  constraint client_invoices_dates_check check (due_date >= issue_date),
  constraint client_invoices_period_check check ((period_start is null) = (period_end is null) and (period_end is null or period_end >= period_start)),
  constraint client_invoices_work_window_check check ((work_start is null) = (work_end is null) and (work_end is null or work_end >= work_start)),
  constraint client_invoices_numbered_check check (status = 'draft' or (number is not null and issuer is not null)),
  constraint client_invoices_paid_check check ((status = 'paid') = (paid_at is not null) and (paid_at is null or paid_via is not null))
);
create index client_invoices_account_idx on public.client_invoices (account_id, issue_date desc);
create index client_invoices_open_idx on public.client_invoices (due_date) where status = 'issued';

-- ── Numbers ────────────────────────────────────────────────────────────────
-- One sequence a year across every client: INV-2026-001 to 010 were issued
-- by hand before the portal (009 to TAV & Partners, 010 to JapanoMa).
create table public.invoice_numbers (
  year smallint primary key,
  last integer not null check (last >= 0)
);
insert into public.invoice_numbers (year, last) values (2026, 10);

-- Issue a draft: the next number in its issue year, and who it's from, in one
-- step (a second call finds it issued and returns null). The server checks
-- the invoice is complete before calling.
create function public.issue_client_invoice(invoice_id uuid, from_issuer jsonb)
returns setof public.client_invoices
language plpgsql
security invoker
set search_path = ''
as $$
declare
  invoice_year smallint;
  next_number integer;
begin
  select extract(year from issue_date)::smallint into invoice_year
    from public.client_invoices
    where id = invoice_id and status = 'draft'
    for update;
  if not found then
    return;
  end if;
  insert into public.invoice_numbers as counter (year, last) values (invoice_year, 1)
    on conflict (year) do update set last = counter.last + 1
    returning counter.last into next_number;
  return query
    update public.client_invoices
      set number = format('INV-%s-%s', invoice_year, lpad(next_number::text, 3, '0')),
          status = 'issued',
          issuer = from_issuer,
          updated_at = now()
      where id = invoice_id
      returning *;
end;
$$;

-- ── Access ─────────────────────────────────────────────────────────────────
-- Clients read their own invoices once issued; the numbers and issuing are
-- the server's (service role) alone.
alter table public.client_invoices enable row level security;
alter table public.invoice_numbers enable row level security;
create policy "Clients read their invoices" on public.client_invoices
  for select to authenticated
  using (
    status <> 'draft'
    and account_id in (select id from public.client_accounts where user_id = (select auth.uid()))
  );
revoke all on public.client_invoices, public.invoice_numbers from anon, authenticated;
grant select on public.client_invoices to authenticated;
revoke execute on function public.issue_client_invoice(uuid, jsonb) from public, anon, authenticated;
