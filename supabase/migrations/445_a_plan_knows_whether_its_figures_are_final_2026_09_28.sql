-- 445: A PLAN KNOWS WHETHER ITS OWN FIGURES ARE FINAL.
--
-- Jimmy, 27 September 2026, on the money chain: "everything related to the
-- application, contract, billing. everything needs to work perfectly and
-- without fail." And on how: hold the contract until every figure is final.
--
-- Today a plan cannot say that about itself. `status` answers a different
-- question - is this the current plan, or one it replaced - which is why the
-- unique index is `where status = 'active'`. A plan can perfectly well be the
-- active one and still be waiting on a GA GOAL award nobody has decided yet.
-- Those are two facts and they need two columns.
--
-- So `status` is left exactly as it is, and `lifecycle` is added beside it.
-- Nothing that reads `status = 'active'` changes behaviour - the late fee
-- views, the insurance views, the balances view, the plan editor. That is
-- deliberate: the alternative was widening the `status` check, which would
-- have made every one of those `where status = 'active'` clauses silently skip
-- a plan the moment it moved to 'final'. Rows quietly missing from a money
-- view is the exact failure this system keeps producing.
--
--   draft                          being built; figures may still move
--   awaiting_scholarship_amounts   every figure final but one or more awards
--                                  are undecided. awaiting_reason NAMES which.
--   final                          every figure final. No contract sent yet.
--   contracted                     contract sent and signed
--   withdrawn                      the family left mid-year
--   imported                       predates this column. Came from a document.
--                                  We do not know whether it was signed, so it
--                                  does not claim to be.
--
-- The 78 plans already loaded become 'imported', not 'contracted'. Asserting a
-- signed contract exists for a schedule imported from a PDF would be inventing
-- a fact, and the whole point of the withdrawal clause and the late-fee chain
-- is that they rest on something a family actually signed.

begin;

-- ---------------------------------------------------------------------------
-- 1. The column
-- ---------------------------------------------------------------------------

alter table public.student_tuition_plans
  add column if not exists lifecycle text not null default 'draft',
  add column if not exists lifecycle_changed_at timestamptz not null default now(),
  add column if not exists lifecycle_note text,
  -- Which figure is missing. Required when awaiting, forbidden otherwise: a
  -- plan that says it is waiting without saying what for cannot be actioned,
  -- and a stale reason on a finished plan is a lie that reads as a fact.
  add column if not exists awaiting_reason text,
  add column if not exists withdrawn_on date;

-- Everything that existed before this migration came from a document.
update public.student_tuition_plans
   set lifecycle = 'imported'
 where lifecycle = 'draft'
   and created_at < now();

alter table public.student_tuition_plans drop constraint if exists plan_lifecycle_valid;
alter table public.student_tuition_plans
  add constraint plan_lifecycle_valid check (lifecycle in (
    'draft', 'awaiting_scholarship_amounts', 'final', 'contracted', 'withdrawn', 'imported'
  ));

alter table public.student_tuition_plans drop constraint if exists plan_awaiting_names_the_figure;
alter table public.student_tuition_plans
  add constraint plan_awaiting_names_the_figure check (
    (lifecycle = 'awaiting_scholarship_amounts' and awaiting_reason is not null)
    or (lifecycle <> 'awaiting_scholarship_amounts' and awaiting_reason is null)
  );

alter table public.student_tuition_plans drop constraint if exists plan_withdrawn_has_a_date;
alter table public.student_tuition_plans
  add constraint plan_withdrawn_has_a_date check (
    lifecycle <> 'withdrawn' or withdrawn_on is not null
  );

-- NO FINAL PLAN WITHOUT A FIGURE TO BILL FROM.
--
-- 279 dropped NOT NULL from remaining_due so a month-to-month plan could exist
-- without one. That is right for a draft and wrong for anything a contract is
-- built on. A scheduled plan needs remaining_due; a month-to-month plan needs
-- monthly_amount. Either way, 'final' must mean there is a number.
alter table public.student_tuition_plans drop constraint if exists plan_final_has_a_figure;
alter table public.student_tuition_plans
  add constraint plan_final_has_a_figure check (
    lifecycle not in ('final', 'contracted')
    or (billing_mode = 'scheduled'    and remaining_due  is not null and billing_basis is not null)
    or (billing_mode = 'monthly_open' and monthly_amount is not null)
  );

-- ---------------------------------------------------------------------------
-- 2. When it last moved
-- ---------------------------------------------------------------------------
--
-- A decision queue is useless without "how long has this been sitting there".
-- Stamped by the database rather than by whichever caller remembers to.

create or replace function public.stamp_plan_lifecycle_change()
returns trigger
language plpgsql
as $$
begin
  if new.lifecycle is distinct from old.lifecycle then
    new.lifecycle_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_plan_lifecycle_change on public.student_tuition_plans;
create trigger trg_stamp_plan_lifecycle_change
  before update on public.student_tuition_plans
  for each row execute function public.stamp_plan_lifecycle_change();

create index if not exists idx_plans_awaiting_a_figure
  on public.student_tuition_plans (lifecycle, lifecycle_changed_at)
  where lifecycle in ('draft', 'awaiting_scholarship_amounts');

-- ---------------------------------------------------------------------------
-- 3. What is blocked, and on what
-- ---------------------------------------------------------------------------
--
-- The queue Jimmy reads. One row per plan that cannot proceed to a contract,
-- saying which child, which campus, what is missing, and for how long.

create or replace view public.plans_waiting_on_a_figure
with (security_invoker = on) as
select
  p.id                                   as plan_id,
  p.student_id,
  trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')) as student,
  sc.name                                as school,
  sy.name                                as school_year,
  p.lifecycle,
  p.awaiting_reason,
  p.billing_mode,
  p.billing_basis,
  p.remaining_due,
  p.monthly_amount,
  p.lifecycle_changed_at,
  (now() - p.lifecycle_changed_at)       as waiting_for,
  floor(extract(epoch from (now() - p.lifecycle_changed_at)) / 86400)::int as days_waiting
from public.student_tuition_plans p
join public.students s      on s.id = p.student_id
left join public.schools sc on sc.id = s.school_id
join public.school_years sy on sy.id = p.school_year_id
where p.status = 'active'
  and p.lifecycle in ('draft', 'awaiting_scholarship_amounts')
order by p.lifecycle_changed_at;

comment on column public.student_tuition_plans.lifecycle is
  'How far through the money chain this plan is. Separate from status, which '
  'says whether this is the current plan or one it replaced.';
comment on column public.student_tuition_plans.awaiting_reason is
  'Which figure is missing. Required while awaiting, forbidden otherwise.';
comment on view public.plans_waiting_on_a_figure is
  'Plans that cannot become a contract yet, and what each is waiting on.';

commit;
