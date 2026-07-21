-- =========================================
-- RC7: Finance, Billing & Revenue Platform
-- Extends family accounts; refunds, discounts,
-- payment-plan installments, aging buckets
-- =========================================

-- Family financial account enhancements
alter table public.family_billing_accounts
  add column if not exists audit_id uuid unique default gen_random_uuid();

alter table public.family_billing_accounts
  add column if not exists account_number text;

alter table public.family_billing_accounts
  add column if not exists primary_payer_name text;

alter table public.family_billing_accounts
  add column if not exists aging_bucket text
    check (aging_bucket is null or aging_bucket in (
      'current', 'days_30', 'days_60', 'days_90', 'days_120_plus'
    ));

alter table public.family_billing_accounts
  add column if not exists archived_at timestamptz;

update public.family_billing_accounts
set account_number = 'BA-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where account_number is null;

create unique index if not exists idx_family_billing_accounts_account_number
  on public.family_billing_accounts(school_id, account_number)
  where account_number is not null;

-- Invoice lifecycle extensions
alter table public.invoices
  add column if not exists audit_id uuid unique default gen_random_uuid();

alter table public.invoices
  add column if not exists archived_at timestamptz;

alter table public.invoices
  add column if not exists voided_at timestamptz;

alter table public.invoices
  add column if not exists void_reason text;

alter table public.invoices
  add column if not exists policy_locked boolean not null default true;

alter table public.invoices
  add column if not exists duplicated_from_id uuid references public.invoices(id) on delete set null;

-- Normalize invoice status vocabulary (keep legacy values accepted)
-- draft | pending | sent | partial | partially_paid | paid | overdue | void | voided | written_off | archived

-- Discount rules
create table if not exists public.billing_discount_rules (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  name text not null,
  description text not null default '',
  discount_type text not null
    check (discount_type in (
      'sibling', 'staff', 'promotional', 'manual', 'percentage', 'flat'
    )),
  amount_type text not null default 'percent'
    check (amount_type in ('percent', 'flat')),
  amount numeric(12, 2) not null default 0,
  stacking_priority integer not null default 100,
  allows_stacking boolean not null default true,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_billing_discount_rules_school
  on public.billing_discount_rules(school_id, is_active, stacking_priority);

-- Applied discounts (audit)
create table if not exists public.billing_discount_applications (
  id uuid primary key default gen_random_uuid(),
  discount_rule_id uuid references public.billing_discount_rules(id) on delete set null,
  billing_account_id uuid references public.family_billing_accounts(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  discount_type text not null,
  amount numeric(12, 2) not null,
  amount_type text not null default 'flat',
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_discount_apps_invoice
  on public.billing_discount_applications(invoice_id);

-- Payment plan installments
create table if not exists public.payment_plan_installments (
  id uuid primary key default gen_random_uuid(),
  payment_plan_id uuid not null references public.payment_plans(id) on delete cascade,
  billing_account_id uuid not null references public.family_billing_accounts(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  installment_number integer not null,
  due_date date not null,
  amount numeric(12, 2) not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'invoiced', 'paid', 'overdue', 'waived', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payment_plan_id, installment_number)
);

create index if not exists idx_payment_plan_installments_due
  on public.payment_plan_installments(billing_account_id, due_date, status);

-- Refund queue
create table if not exists public.billing_refunds (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  billing_account_id uuid not null references public.family_billing_accounts(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  amount numeric(12, 2) not null,
  refund_method text not null default 'credit_balance'
    check (refund_method in (
      'credit_balance', 'original_method', 'check', 'ach', 'cash', 'other'
    )),
  status text not null default 'requested'
    check (status in (
      'requested', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled'
    )),
  reason text not null default '',
  rejection_reason text,
  requested_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  processed_by uuid references public.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_refunds_status
  on public.billing_refunds(school_id, status, requested_at desc);

-- Aging snapshot (executive metrics)
create table if not exists public.billing_aging_snapshots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  organization_id uuid references public.org_organizations(id) on delete set null,
  as_of_date date not null default current_date,
  current_amount numeric(14, 2) not null default 0,
  days_30 numeric(14, 2) not null default 0,
  days_60 numeric(14, 2) not null default 0,
  days_90 numeric(14, 2) not null default 0,
  days_120_plus numeric(14, 2) not null default 0,
  total_outstanding numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (school_id, as_of_date)
);

-- Tuition schedule vocabulary on plans (if column exists as payment_schedule, keep; add billing_model)
alter table public.tuition_plans
  add column if not exists billing_model text
    check (billing_model is null or billing_model in (
      'monthly', 'quarterly', 'annual', 'per_course', 'one_time'
    ));

update public.tuition_plans
set billing_model = case
  when lower(coalesce(payment_schedule, '')) like '%month%' then 'monthly'
  when lower(coalesce(payment_schedule, '')) like '%quarter%' then 'quarterly'
  when lower(coalesce(payment_schedule, '')) like '%year%' or lower(coalesce(payment_schedule, '')) like '%annual%' then 'annual'
  when lower(coalesce(payment_schedule, '')) like '%course%' then 'per_course'
  when lower(coalesce(payment_schedule, '')) like '%one%time%' or lower(coalesce(payment_schedule, '')) like '%once%' then 'one_time'
  else coalesce(billing_model, 'monthly')
end
where billing_model is null;

-- RLS
alter table public.billing_discount_rules enable row level security;
alter table public.billing_discount_applications enable row level security;
alter table public.payment_plan_installments enable row level security;
alter table public.billing_refunds enable row level security;
alter table public.billing_aging_snapshots enable row level security;

drop policy if exists billing_discount_rules_staff on public.billing_discount_rules;
create policy billing_discount_rules_staff on public.billing_discount_rules
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists billing_discount_applications_staff on public.billing_discount_applications;
create policy billing_discount_applications_staff on public.billing_discount_applications
  for all using (
    exists (
      select 1 from public.family_billing_accounts a
      where a.id = billing_account_id
        and public.can_access_school(a.school_id)
    )
  ) with check (
    exists (
      select 1 from public.family_billing_accounts a
      where a.id = billing_account_id
        and public.can_access_school(a.school_id)
    )
  );

drop policy if exists payment_plan_installments_staff on public.payment_plan_installments;
create policy payment_plan_installments_staff on public.payment_plan_installments
  for all using (
    exists (
      select 1 from public.family_billing_accounts a
      where a.id = billing_account_id
        and public.can_access_school(a.school_id)
    )
  ) with check (
    exists (
      select 1 from public.family_billing_accounts a
      where a.id = billing_account_id
        and public.can_access_school(a.school_id)
    )
  );

drop policy if exists billing_refunds_staff on public.billing_refunds;
create policy billing_refunds_staff on public.billing_refunds
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists billing_aging_snapshots_staff on public.billing_aging_snapshots;
create policy billing_aging_snapshots_staff on public.billing_aging_snapshots
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

-- Aging bucket sync helper
create or replace function public.refresh_billing_account_aging(p_account_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket text := 'current';
  v_max_days integer := 0;
  v_days integer;
begin
  for v_days in
    select greatest(0, (current_date - i.due_date)::integer)
    from public.invoices i
    where i.billing_account_id = p_account_id
      and i.invoice_status not in ('paid', 'void', 'voided', 'written_off', 'cancelled', 'archived')
      and (i.total_amount - coalesce(i.amount_paid, 0)) > 0
  loop
    if v_days > v_max_days then
      v_max_days := v_days;
    end if;
  end loop;

  if v_max_days <= 0 then
    v_bucket := 'current';
  elsif v_max_days <= 30 then
    v_bucket := 'days_30';
  elsif v_max_days <= 60 then
    v_bucket := 'days_60';
  elsif v_max_days <= 90 then
    v_bucket := 'days_90';
  else
    v_bucket := 'days_120_plus';
  end if;

  update public.family_billing_accounts
  set aging_bucket = v_bucket
  where id = p_account_id;

  return v_bucket;
end;
$$;
