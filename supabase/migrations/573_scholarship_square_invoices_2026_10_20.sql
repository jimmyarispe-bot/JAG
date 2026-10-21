-- 573 - A Square invoice for every payment the state makes on a scholarship.
--
-- Jimmy, 20 October 2026: "even for scholarship payment in any state, let's
-- create square invoices for these. and when we receive the payment from the
-- state we will mark them as paid via state scholarship. for better record
-- keeping"
--
-- Decided the same evening: records only (never emailed to the family), one
-- invoice per state payment, created when the tuition plan is marked final.
--
-- Square's API cannot mark an invoice paid ("Square APIs cannot be used to pay
-- invoices or set invoice status"). So the state's payment is recorded here, as
-- a scholarship_receipts row, and Jimmy marks the invoice paid in Square with
-- one tap; square_marked_paid_at records that he has.

create table if not exists public.scholarship_invoices (
  id uuid primary key default gen_random_uuid(),
  award_id uuid not null references public.scholarship_awards(id) on delete cascade,
  plan_id uuid references public.student_tuition_plans(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  sequence int not null check (sequence >= 1),
  label text not null,
  due_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  -- 'pending' until Square has it; 'open' once published there; 'error' when
  -- Square refused (the reason is in last_error).
  status text not null default 'pending' check (status in ('pending', 'open', 'error', 'cancelled')),
  last_error text,
  square_location_id text,
  square_customer_id text,
  square_order_id text,
  square_invoice_id text,
  square_invoice_number text,
  receipt_id uuid references public.scholarship_receipts(id) on delete set null,
  square_marked_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (award_id, sequence)
);

create index if not exists scholarship_invoices_student_idx on public.scholarship_invoices (student_id);

alter table public.scholarship_invoices enable row level security;

drop policy if exists scholarship_invoices_staff on public.scholarship_invoices;
create policy scholarship_invoices_staff on public.scholarship_invoices
  for all
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

drop trigger if exists scholarship_invoices_touch on public.scholarship_invoices;
create or replace function public.scholarship_invoices_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger scholarship_invoices_touch before update on public.scholarship_invoices
  for each row execute function public.scholarship_invoices_touch();

comment on table public.scholarship_invoices is
  'One Square invoice per state scholarship payment. Records only - never emailed to the family (migration 573).';
