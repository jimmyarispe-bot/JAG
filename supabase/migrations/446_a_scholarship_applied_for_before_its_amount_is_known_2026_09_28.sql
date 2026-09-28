-- 446: A FAMILY CAN HAVE APPLIED FOR A SCHOLARSHIP BEFORE ANYONE KNOWS THE AMOUNT.
--
-- Scenario #2, Jimmy, 27 September: "parents apply and indicate they will use
-- or receive a/some scholarship(s)". At that moment the family has applied and
-- the amount does not exist yet. GA GOAL decides later. An Academy-Based award
-- is decided by Jimmy later.
--
-- scholarship_awards cannot hold that today. `awarded_amount` is NOT NULL and
-- `status` offers only awarded / denied / withdrawn / expired. So the only way
-- to record an application in progress is to invent a figure, and the figure
-- everyone invents is zero.
--
-- A zero award is the worst possible placeholder. It is a real number with a
-- real meaning - "this programme gives this family nothing" - and plan-builder
-- will happily subtract it, produce a family responsibility of the entire
-- tuition, and put that on a contract. Nothing anywhere would be flagged,
-- because nothing is wrong: the arithmetic is right and the input is a lie.
--
-- So: 'applied' becomes a status, awarded_amount becomes nullable, and the
-- constraints make the two agree. An applied award carries NO awarded amount
-- at all. What the family said they expect goes in its own column, clearly
-- marked as their claim rather than a decision.

begin;

-- ---------------------------------------------------------------------------
-- 1. Applied, with no amount
-- ---------------------------------------------------------------------------

alter table public.scholarship_awards
  alter column awarded_amount drop not null;

alter table public.scholarship_awards
  add column if not exists expected_amount numeric(12,2) check (expected_amount >= 0),
  -- Where the expected figure came from. A parent's estimate and the school's
  -- estimate are both guesses, and they are not the same guess.
  add column if not exists expected_amount_source text,
  add column if not exists applied_on date;

alter table public.scholarship_awards drop constraint if exists scholarship_awards_status_check;
alter table public.scholarship_awards drop constraint if exists scholarship_awards_status_valid;
alter table public.scholarship_awards
  add constraint scholarship_awards_status_valid
    check (status in ('applied', 'awarded', 'denied', 'withdrawn', 'expired'));

-- AN AWARDED AWARD HAS A NUMBER. Nothing else may reduce a family's bill.
alter table public.scholarship_awards drop constraint if exists award_awarded_has_an_amount;
alter table public.scholarship_awards
  add constraint award_awarded_has_an_amount
    check (status <> 'awarded' or awarded_amount is not null);

-- AN APPLIED AWARD HAS NO NUMBER. A granted figure on a row that says nobody
-- has granted anything is a contradiction, and it is the contradiction that
-- would end up on a contract.
alter table public.scholarship_awards drop constraint if exists award_applied_has_no_amount;
alter table public.scholarship_awards
  add constraint award_applied_has_no_amount
    check (status <> 'applied' or awarded_amount is null);

-- BOTH HALVES OR NEITHER, AND MIND THE THIRD TRUTH VALUE.
--
-- This constraint took two goes, both times for the same reason. A CHECK
-- constraint rejects a row only on FALSE; it passes on TRUE *and on NULL*.
--
--   attempt 1  expected_amount is null or expected_amount_source in (...)
--              900 with a NULL source: `NULL in (...)` is NULL,
--              so `false or NULL` is NULL, so the row was accepted.
--
--   attempt 2  ... or (expected_amount is not null and source in (...))
--              same trap one layer in: `true and NULL` is NULL,
--              `false or NULL` is NULL, accepted again.
--
-- The `is not null` test below is what forces a real FALSE. A guess with no
-- stated origin is exactly the row that later gets read as a decision, so it
-- has to be refused rather than almost refused. Neither attempt was caught by
-- reading the constraint. Both were caught by running it.
alter table public.scholarship_awards drop constraint if exists award_expected_amount_has_a_source;
alter table public.scholarship_awards
  add constraint award_expected_amount_has_a_source
    check (
      (expected_amount is null and expected_amount_source is null)
      or (expected_amount is not null
          and expected_amount_source is not null
          and expected_amount_source in ('family_stated', 'school_estimate'))
    );

create index if not exists idx_scholarship_awards_applied
  on public.scholarship_awards (status, applied_on)
  where status = 'applied';

-- ---------------------------------------------------------------------------
-- 2. What is undecided, and for how long
-- ---------------------------------------------------------------------------
--
-- The other half of the decision queue. 445 lists plans that are blocked;
-- this lists the awards blocking them.

create or replace view public.awards_without_a_decided_amount
with (security_invoker = on) as
select
  a.id                                   as award_id,
  a.student_id,
  trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')) as student,
  sc.name                                as school,
  a.program_code,
  a.program_name,
  a.award_year,
  a.expected_amount,
  a.expected_amount_source,
  a.applied_on,
  case
    when a.applied_on is null then null
    else (current_date - a.applied_on)
  end                                    as days_since_applied
from public.scholarship_awards a
join public.students s      on s.id = a.student_id
left join public.schools sc on sc.id = a.school_id
where a.status = 'applied'
order by a.applied_on nulls last, s.last_name, s.first_name;

comment on column public.scholarship_awards.awarded_amount is
  'The granted figure. NULL until someone decides. Never zero as a placeholder: '
  'zero is a real answer and plan-builder will bill the family on it.';
comment on column public.scholarship_awards.expected_amount is
  'What the family or the school expects. A claim, not a decision. Never reduces a bill.';
comment on view public.awards_without_a_decided_amount is
  'Applications with no decided amount. These are what plans_waiting_on_a_figure is waiting on.';

commit;
