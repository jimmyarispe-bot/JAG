-- 270: per-student tuition plans and instalments.
--
-- Until now a family's tuition arrangement has existed only as a hand-built PDF
-- in a OneDrive folder. That is why three of them contained arithmetic errors
-- nobody caught — Hailey's 2,000, Aaliyah's 1,000, Abigail's 3,325 — and why
-- reconciling eighteen students against the state took a day of reading
-- documents.
--
-- These two tables hold what those documents say, so the document becomes a
-- rendering of the data rather than the only place the data lives.
--
--   student_tuition_plans        one per student per school year
--   student_tuition_instalments  the payment schedule, one row per due date
--
-- Scholarships are NOT duplicated here. They live in scholarship_awards
-- (migration 254), which already separates the award from its receipt. A plan
-- stores the arithmetic that follows from them: what is owed, what the school
-- has forgiven, and what the family pays when.
--
-- Money is numeric(12,2) throughout. A tuition figure that has ever been a
-- float is a tuition figure you cannot reconcile.

begin;

-- ---------------------------------------------------------------------------
-- 1. The plan
-- ---------------------------------------------------------------------------

create table if not exists public.student_tuition_plans (
  id uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete restrict,

  -- The full-year price, and the prorated figure when the student does not
  -- attend the whole year. NULL prorated means "the full year applies" — it is
  -- not zero, and it is not the same as prorated = annual.
  annual_tuition    numeric(12,2) not null check (annual_tuition >= 0),
  prorated_tuition  numeric(12,2) check (prorated_tuition >= 0),
  proration_label   text,

  -- The basis actually billed from. Abigail McHoney's schedule states a
  -- proration and bills the annual figure anyway; this column records which one
  -- the family is really being charged on, so that disagreement is visible in
  -- the data instead of buried in a PDF.
  billing_basis numeric(12,2) not null check (billing_basis >= 0),

  -- What the family owes after scholarships, and what the school has chosen not
  -- to collect. Forgiveness is its own column because "we reduced the price"
  -- and "we absorbed a shortfall" are different facts with different meanings
  -- at year end.
  remaining_due       numeric(12,2) not null check (remaining_due >= 0),
  forgiveness_amount  numeric(12,2) not null default 0 check (forgiveness_amount >= 0),
  forgiveness_reason  text,

  status text not null default 'active'
    check (status in ('draft', 'active', 'superseded', 'cancelled')),

  source_document text,
  notes           text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Forgiveness without a reason is a number nobody can defend later.
  constraint plan_forgiveness_has_reason
    check (forgiveness_amount = 0 or forgiveness_reason is not null)
);

-- One active plan per student per year. A superseded plan is kept, because the
-- schedule a family signed matters even after it is replaced.
create unique index if not exists idx_student_tuition_plans_one_active
  on public.student_tuition_plans (student_id, school_year_id)
  where status = 'active';

create index if not exists idx_student_tuition_plans_student
  on public.student_tuition_plans (student_id);

-- ---------------------------------------------------------------------------
-- 2. The instalments
-- ---------------------------------------------------------------------------

create table if not exists public.student_tuition_instalments (
  id uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references public.student_tuition_plans(id) on delete cascade,

  sequence int not null check (sequence > 0),
  label    text not null,              -- "Due September 25, 2026", "Due Upon Signing Contract"
  due_date date,                       -- null for "upon signing"
  amount   numeric(12,2) not null check (amount >= 0),

  -- Zero-amount rows are kept deliberately. Every schedule in the GA folder
  -- lists the months a family owes nothing, and removing them would make the
  -- document look like months were skipped.
  is_paid  boolean not null default false,
  paid_at  date,

  created_at timestamptz not null default now(),

  constraint instalment_paid_has_date check (not is_paid or paid_at is not null)
);

create unique index if not exists idx_instalment_plan_sequence
  on public.student_tuition_instalments (plan_id, sequence);

create index if not exists idx_instalment_plan
  on public.student_tuition_instalments (plan_id);

-- ---------------------------------------------------------------------------
-- 3. Does each plan actually close?
-- ---------------------------------------------------------------------------
--
-- The single most useful thing here. Every hand-built schedule claimed a
-- Remaining Balance of 0.00; three of them were wrong. This view recomputes it
-- rather than trusting the claim.

create or replace view public.student_tuition_plan_balances
with (security_invoker = on) as
select
  p.id                as plan_id,
  p.student_id,
  s.first_name || ' ' || s.last_name as student,
  sc.name             as school,
  sy.name             as school_year,
  p.billing_basis,
  p.remaining_due,
  p.forgiveness_amount,
  coalesce(sum(i.amount), 0)                             as scheduled_total,
  p.remaining_due - p.forgiveness_amount
    - coalesce(sum(i.amount), 0)                         as unaccounted,
  case
    when abs(p.remaining_due - p.forgiveness_amount
             - coalesce(sum(i.amount), 0)) < 0.005 then true
    else false
  end                                                    as closes,
  count(i.id)                                            as instalment_count,
  coalesce(sum(i.amount) filter (where i.is_paid), 0)    as paid_to_date
from public.student_tuition_plans p
join public.students s on s.id = p.student_id
left join public.schools sc on sc.id = s.school_id
join public.school_years sy on sy.id = p.school_year_id
left join public.student_tuition_instalments i on i.plan_id = p.id
where p.status = 'active'
group by p.id, s.first_name, s.last_name, sc.name, sy.name;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
--
-- Same role fallback as the tuition catalog (migration 249): finance.manage is
-- not in PERMISSION_KEYS, so without the fallback has_permission() is false for
-- everyone and the owner is locked out of his own data.

alter table public.student_tuition_plans        enable row level security;
alter table public.student_tuition_instalments  enable row level security;

drop policy if exists student_tuition_plans_read on public.student_tuition_plans;
create policy student_tuition_plans_read on public.student_tuition_plans
  for select using (
    has_permission('finance.view') or has_permission('finance.billing')
    or has_role('CEO') or has_role('FOUNDER')
  );

drop policy if exists student_tuition_plans_write on public.student_tuition_plans;
create policy student_tuition_plans_write on public.student_tuition_plans
  for all
  -- USING alone matches zero rows on UPDATE and reports success. Both clauses,
  -- always. See migration 235.
  using (
    has_permission('finance.billing') or has_role('CEO') or has_role('FOUNDER')
  )
  with check (
    has_permission('finance.billing') or has_role('CEO') or has_role('FOUNDER')
  );

drop policy if exists student_tuition_instalments_read on public.student_tuition_instalments;
create policy student_tuition_instalments_read on public.student_tuition_instalments
  for select using (
    has_permission('finance.view') or has_permission('finance.billing')
    or has_role('CEO') or has_role('FOUNDER')
  );

drop policy if exists student_tuition_instalments_write on public.student_tuition_instalments;
create policy student_tuition_instalments_write on public.student_tuition_instalments
  for all
  using (
    has_permission('finance.billing') or has_role('CEO') or has_role('FOUNDER')
  )
  with check (
    has_permission('finance.billing') or has_role('CEO') or has_role('FOUNDER')
  );

comment on table public.student_tuition_plans is
  'What one student owes for one school year, and how it is paid. The Schedule '
  'of Tuition Payments is a rendering of this, not the other way round.';
comment on column public.student_tuition_plans.billing_basis is
  'The tuition figure actually billed from. May differ from prorated_tuition '
  'where a schedule states a proration and charges the annual amount.';
comment on column public.student_tuition_plans.forgiveness_amount is
  'Owed but deliberately not collected. Distinct from a reduced price.';

commit;

-- Empty until the loader runs. Both should return 0 rows.
select count(*) as plans from public.student_tuition_plans;
