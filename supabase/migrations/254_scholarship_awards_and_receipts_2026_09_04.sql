-- 254_scholarship_awards_and_receipts_2026_09_04.sql
--
-- An award and a receipt are two different facts, and this is the migration
-- that stops the system confusing them.
--
-- From Braydon McCaskill's Schedule of Tuition Payments:
--
--     GA Goal Scholarship                      1,000.00
--     GA Special Needs Scholarship (100%)     14,562.00
--
-- Braydon's family genuinely owes $1,063 because of those awards. That is what
-- they signed and it is not in question. What IS in question is whether Georgia
-- has actually sent the money — and today nothing anywhere records the answer.
--
-- WHY A NEW TABLE RATHER THAN THE EXISTING ONES
--
-- Not lightly. Three things were checked first, and all three are dead:
--
--   * applyScholarshipToInvoice (finance-platform/scholarships.ts) selects
--     school_id and family_id from scholarship_applications. Neither column
--     exists. Postgres rejects the whole select, so the function has returned
--     "Scholarship award not found" for every input it has ever received. It
--     has never once written a row.
--
--   * state_funding_received_payments has no writer. recordReceivedFundingPayment
--     is real SQL with ZERO callers - no form, no cron, nothing. The table
--     cannot be populated, and the reconciliation page and the state-funding
--     forecast both read zeros off it.
--
--   * ssis_student_funding_records.payment_status has no update path at all.
--     State-funding rows insert at the default 'unknown', which is excluded
--     from crediting, so state funding never credits. Scholarship rows insert
--     at 'expected', which credits at 100%. And there is no received_amount
--     column, so "awarded 14,562, received 0" is not expressible.
--
-- So there is no working system to sit beside. Nothing is being duplicated and
-- nothing needs migrating.
--
-- SAFE TO RE-RUN.

begin;

-- ---------------------------------------------------------------------------
-- 0. Braydon's second program is not in the catalog.
-- ---------------------------------------------------------------------------
-- ga_esa is already seeded as "Georgia Special Needs Scholarship". Georgia GOAL
-- is a separate, tax-credit-funded program and needs its own row.

insert into public.funding_program_catalog
  (program_code, program_name, state_code, funding_agency, payment_schedule, is_active)
values
  ('ga_goal', 'Georgia GOAL Scholarship', 'GA', 'Georgia GOAL Scholarship Program', 'annual', true)
on conflict (program_code) do nothing;

-- ---------------------------------------------------------------------------
-- 1. The award: what a family was granted.
-- ---------------------------------------------------------------------------

create table if not exists public.scholarship_awards (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id) on delete cascade,

  -- The school whose tuition this offsets. Not derived from the student, because
  -- a student can move and an award belongs to the year it was granted for.
  school_id       uuid not null references public.schools(id) on delete restrict,

  -- Nullable on purpose. The catalog has three seeded programs and the world has
  -- more. Refusing to record a real award because our list is short would be the
  -- system preferring its own tidiness to the truth.
  program_code    text references public.funding_program_catalog(program_code),

  -- What the family's own document calls it. This is what a parent recognises.
  program_name    text not null,
  award_year      text not null,

  awarded_amount  numeric(12,2) not null check (awarded_amount >= 0),

  status          text not null default 'awarded'
                    check (status in ('awarded','denied','withdrawn','expired')),
  awarded_on      date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Loading the same schedule of payments twice must not double a family's
  -- credit. Migration 194's conversion bug did exactly that for want of this.
  unique (student_id, program_name, award_year)
);

comment on table public.scholarship_awards is
  'What a student was granted. Says nothing about whether the money arrived - see scholarship_receipts.';
comment on column public.scholarship_awards.awarded_amount is
  'The granted figure. This is what reduces family responsibility, because it is what the family agreed to.';

-- ---------------------------------------------------------------------------
-- 2. The receipt: what actually arrived.
-- ---------------------------------------------------------------------------

create table if not exists public.scholarship_receipts (
  id           uuid primary key default gen_random_uuid(),
  award_id     uuid not null references public.scholarship_awards(id) on delete cascade,
  amount       numeric(12,2) not null check (amount > 0),
  received_on  date not null,

  -- The payer's own identifier. Nullable because cheques arrive without one,
  -- but where it exists it is how an import stays idempotent.
  reference    text,
  notes        text,
  recorded_by  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.scholarship_receipts is
  'Money actually received against an award. Many per award: states pay in instalments.';

-- One reference per award, when there is one. Two imports of the same
-- remittance must not book the money twice.
create unique index if not exists scholarship_receipts_award_reference
  on public.scholarship_receipts (award_id, reference)
  where reference is not null;

create index if not exists scholarship_awards_student
  on public.scholarship_awards (student_id, award_year);
create index if not exists scholarship_receipts_award
  on public.scholarship_receipts (award_id);

-- ---------------------------------------------------------------------------
-- 3. The gap, in one place.
-- ---------------------------------------------------------------------------
-- This is the number that did not exist before: what has been promised to a
-- family and credited against their tuition, but not yet received from the
-- payer. security_invoker so the caller's RLS applies rather than the view
-- owner's.

create or replace view public.scholarship_award_balances
with (security_invoker = on) as
select
  a.id                                            as award_id,
  a.student_id,
  a.school_id,
  a.program_code,
  a.program_name,
  a.award_year,
  a.status,
  a.awarded_amount,
  coalesce(sum(r.amount), 0)::numeric(12,2)       as received_amount,
  (a.awarded_amount - coalesce(sum(r.amount), 0))::numeric(12,2) as outstanding_amount,
  max(r.received_on)                              as last_received_on,
  count(r.id)                                     as receipt_count
from public.scholarship_awards a
left join public.scholarship_receipts r on r.award_id = a.id
group by a.id;

comment on view public.scholarship_award_balances is
  'Awarded vs received per award. outstanding_amount is what a payer still owes the school after the family has already been credited.';

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.scholarship_awards   enable row level security;
alter table public.scholarship_receipts enable row level security;

-- Both USING and WITH CHECK. An UPDATE policy with only USING matches zero rows
-- and reports success, which is how migration 235's schools bug behaved.
drop policy if exists scholarship_awards_staff on public.scholarship_awards;
create policy scholarship_awards_staff on public.scholarship_awards
  for all
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

drop policy if exists scholarship_receipts_staff on public.scholarship_receipts;
create policy scholarship_receipts_staff on public.scholarship_receipts
  for all
  using (
    exists (
      select 1 from public.scholarship_awards a
      where a.id = scholarship_receipts.award_id
        and can_access_school(a.school_id)
    )
  )
  with check (
    exists (
      select 1 from public.scholarship_awards a
      where a.id = scholarship_receipts.award_id
        and can_access_school(a.school_id)
    )
  );

commit;

-- Nothing is loaded yet. This shows the shape and confirms the view resolves.
select
  'no awards recorded yet' as state,
  count(*)                 as awards,
  coalesce(sum(awarded_amount), 0)     as total_awarded,
  coalesce(sum(received_amount), 0)    as total_received,
  coalesce(sum(outstanding_amount), 0) as total_outstanding
from public.scholarship_award_balances;
