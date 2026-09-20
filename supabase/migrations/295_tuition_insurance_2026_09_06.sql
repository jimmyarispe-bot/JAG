-- 295_tuition_insurance_2026_09_06.sql
--
-- Tuition insurance. (Tuition Lock deliberately NOT built -- decided 6 Sept.)
--
-- THE PRODUCT, from the FL and GA contracts:
--   * 2.5% of the annual tuition amount
--   * purchasable ONLY at the moment the contract is signed
--   * covers exactly two events: loss of job, and moving 30+ miles away
--   * verifiable proof required
--   * paying monthly  -> forgiveness of the remaining unpaid balance
--   * paid in full    -> prorated refund, monthly basis
--
-- TWO TABLES, NOT ONE. A plan has at most one policy; a policy can have more
-- than one claim over a year (denied in October, a real job loss in March). One
-- table with claim columns on it would force the second claim to overwrite the
-- first, and the first is exactly the record you would want if the second is
-- ever disputed.
--
-- ANNUAL PLANS ONLY. The premium is a percentage of annual tuition and the
-- benefit is forgiveness of a remaining annual balance. Month-to-month families
-- have neither -- they can stop paying at any time, which is the thing this
-- product exists to buy. The CHECK enforces that rather than leaving it to
-- whoever writes the UI.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

-- ---------------------------------------------------------------------------
-- 1. Policies
-- ---------------------------------------------------------------------------

create table if not exists public.student_tuition_insurance_policies (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null unique
                      references public.student_tuition_plans(id) on delete cascade,
  status            text not null,
  -- Rate in basis points so it is exact. 250 bp = 2.5%. Stored per policy: if
  -- the published rate ever moves, existing policies keep the rate the family
  -- actually agreed to.
  premium_rate_bp   integer not null default 250,
  premium_cents     integer not null default 0,
  -- The tuition figure the premium was calculated from, frozen at purchase.
  -- Without this, a later change to the plan silently makes the premium look
  -- wrong and nobody can tell whether it was miscalculated or the plan moved.
  basis_tuition_cents integer,
  offered_at        timestamptz not null default now(),
  purchased_at      timestamptz,
  declined_at       timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint student_tuition_insurance_status_valid
    check (status in ('offered', 'purchased', 'declined')),
  constraint student_tuition_insurance_rate_sane
    check (premium_rate_bp between 0 and 10000),
  constraint student_tuition_insurance_premium_sane
    check (premium_cents >= 0),
  -- The status and its dates must agree, and a purchased policy must have a
  -- premium and the basis it came from.
  constraint student_tuition_insurance_status_coherent
    check (
      (status = 'purchased'
         and purchased_at is not null and declined_at is null
         and premium_cents > 0 and basis_tuition_cents is not null)
      or
      (status = 'declined'
         and declined_at is not null and purchased_at is null)
      or
      (status = 'offered'
         and purchased_at is null and declined_at is null)
    )
);

comment on table public.student_tuition_insurance_policies is
  'Tuition insurance, 2.5% of annual tuition, purchasable only at signing. One '
  'policy per tuition plan. Annual (scheduled) plans only -- see the trigger.';
comment on column public.student_tuition_insurance_policies.basis_tuition_cents is
  'The annual tuition the premium was computed from, frozen at purchase. Lets '
  'anyone check the arithmetic years later even if the plan has since changed.';

-- The annual-plan rule cannot be a CHECK (it looks at another table), so it is
-- a trigger. Written as a trigger rather than left to application code because
-- a policy sold against a month-to-month plan is unhonourable -- there is no
-- remaining annual balance to forgive.
create or replace function public.enforce_insurance_annual_plan_only()
returns trigger
language plpgsql
as $$
declare
  v_mode text;
begin
  select billing_mode into v_mode
    from public.student_tuition_plans where id = new.plan_id;

  if v_mode is distinct from 'scheduled' then
    raise exception
      'Tuition insurance applies to annual (scheduled) plans only. Plan % is %.',
      new.plan_id, coalesce(v_mode, 'missing');
  end if;
  return new;
end $$;

drop trigger if exists student_tuition_insurance_annual_only
  on public.student_tuition_insurance_policies;
create trigger student_tuition_insurance_annual_only
  before insert or update of plan_id
  on public.student_tuition_insurance_policies
  for each row execute function public.enforce_insurance_annual_plan_only();

-- ---------------------------------------------------------------------------
-- 2. Claims
-- ---------------------------------------------------------------------------

create table if not exists public.student_tuition_insurance_claims (
  id                uuid primary key default gen_random_uuid(),
  policy_id         uuid not null
                      references public.student_tuition_insurance_policies(id)
                      on delete cascade,
  reason            text not null,
  status            text not null default 'submitted',
  submitted_at      timestamptz not null default now(),
  -- "verifiable proof will need to be submitted to receive this benefit"
  proof_provided    boolean not null default false,
  proof_notes       text,
  decided_at        timestamptz,
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decision_notes    text,
  -- Which of the two contract outcomes applied, and what it was worth.
  benefit_type      text,
  benefit_cents     integer,
  withdrawal_date   date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- The contract names exactly two covered events and no others.
  constraint student_tuition_insurance_claim_reason_valid
    check (reason in ('job_loss', 'relocation_30_miles')),
  constraint student_tuition_insurance_claim_status_valid
    check (status in ('submitted', 'approved', 'denied', 'withdrawn')),
  constraint student_tuition_insurance_benefit_valid
    check (benefit_type is null
           or benefit_type in ('balance_forgiveness', 'prorated_refund')),
  constraint student_tuition_insurance_benefit_sane
    check (benefit_cents is null or benefit_cents >= 0),
  -- An approved claim must say who approved it, what the family got, and how
  -- much. A row that says "approved" and nothing else is the row that becomes
  -- an argument.
  constraint student_tuition_insurance_claim_decision_coherent
    check (
      (status = 'approved'
         and decided_at is not null and decided_by_user_id is not null
         and benefit_type is not null and benefit_cents is not null
         and proof_provided = true)
      or
      (status = 'denied'
         and decided_at is not null and decided_by_user_id is not null
         and decision_notes is not null)
      or
      (status in ('submitted', 'withdrawn')
         and decided_at is null and benefit_type is null)
    )
);

comment on table public.student_tuition_insurance_claims is
  'Claims against a tuition insurance policy. Two covered reasons only, per the '
  'contract. An approved claim cannot exist without proof, a decider, a benefit '
  'type and an amount.';
comment on column public.student_tuition_insurance_claims.benefit_type is
  'balance_forgiveness = family was paying monthly, remaining unpaid balance is '
  'forgiven. prorated_refund = annual tuition was paid in full, refund on a '
  'monthly basis. These are the two outcomes the GA contract sets out.';

create index if not exists student_tuition_insurance_claims_policy_idx
  on public.student_tuition_insurance_claims (policy_id, submitted_at desc);
create index if not exists student_tuition_insurance_claims_open_idx
  on public.student_tuition_insurance_claims (status)
  where status = 'submitted';

-- ---------------------------------------------------------------------------
-- 3. Premium helper. One definition of "what does this cost", so the contract
--    figure and the invoice figure cannot drift.
-- ---------------------------------------------------------------------------

create or replace function public.tuition_insurance_premium_cents(
  p_annual_tuition_cents integer,
  p_rate_bp integer default 250
)
returns integer
language sql
immutable
as $$
  -- round(), not floor(): floor would quietly under-charge every policy by up
  -- to a cent, and over a few hundred families that is a number somebody has to
  -- explain.
  select greatest(0, round(p_annual_tuition_cents::numeric * p_rate_bp / 10000))::integer;
$$;

comment on function public.tuition_insurance_premium_cents(integer, integer) is
  '2.5% of annual tuition by default, in integer cents. 250 bp = 2.5%.';

-- ---------------------------------------------------------------------------
-- 4. RLS -- same inheritance as 293/294: visible if the plan is visible.
--    No write policies; purchase and claim decisions go through server actions.
-- ---------------------------------------------------------------------------

alter table public.student_tuition_insurance_policies enable row level security;
alter table public.student_tuition_insurance_claims  enable row level security;

drop policy if exists student_tuition_insurance_policies_read
  on public.student_tuition_insurance_policies;
create policy student_tuition_insurance_policies_read
  on public.student_tuition_insurance_policies for select to authenticated
  using (exists (select 1 from public.student_tuition_plans p
                  where p.id = student_tuition_insurance_policies.plan_id));

drop policy if exists student_tuition_insurance_claims_read
  on public.student_tuition_insurance_claims;
create policy student_tuition_insurance_claims_read
  on public.student_tuition_insurance_claims for select to authenticated
  using (exists (select 1 from public.student_tuition_insurance_policies pol
                  where pol.id = student_tuition_insurance_claims.policy_id));

-- ---------------------------------------------------------------------------
-- 5. Report
-- ---------------------------------------------------------------------------

drop table if exists _insurance_report;
create temp table _insurance_report (seq integer, item text, value text);

do $$
declare
  v_scheduled integer;
  v_monthly   integer;
  v_premium   numeric;
  v_sample    integer;
begin
  select count(*) filter (where billing_mode = 'scheduled'),
         count(*) filter (where billing_mode = 'monthly_open')
    into v_scheduled, v_monthly
    from public.student_tuition_plans where status = 'active';

  -- What 2.5% would come to across every eligible plan, if every family bought.
  -- Not a forecast -- a size check, so nobody is surprised by the order of
  -- magnitude of a liability the school is underwriting itself.
  select coalesce(sum(public.tuition_insurance_premium_cents(
           (annual_tuition * 100)::integer, 250)), 0) / 100.0,
         count(*)
    into v_premium, v_sample
    from public.student_tuition_plans
   where status = 'active' and billing_mode = 'scheduled'
     and annual_tuition is not null;

  insert into _insurance_report values
    (1, 'Tables created', 'student_tuition_insurance_policies, student_tuition_insurance_claims'),
    (2, 'Helper created', 'tuition_insurance_premium_cents(annual_cents, rate_bp)'),
    (3, 'Rate',           '250 bp = 2.5% of annual tuition'),
    (4, 'Covered events', 'job_loss, relocation_30_miles -- the only two the contract names'),
    (5, 'Benefits',       'balance_forgiveness (monthly payers) | prorated_refund (paid in full)'),
    (10, 'Plans ELIGIBLE (annual/scheduled)',       v_scheduled::text),
    (11, 'Plans NOT eligible (month-to-month)',     v_monthly::text),
    (12, 'Eligible plans with an annual tuition figure', v_sample::text),
    (13, 'Total premium if EVERY eligible family bought', '$' || to_char(v_premium, 'FM999G999G990D00')),
    (20, 'Policies created by this migration', '0'),
    (21, 'Tuition Lock', 'NOT BUILT - decided 6 September');
end $$;

commit;

select item, value from _insurance_report order by seq;

-- ---------------------------------------------------------------------------
-- WHAT THIS DOES NOT DO, AND ONE THING TO THINK ABOUT
--
-- 1. No policies are created. The forms collect the yes/no at signing; nothing
--    writes it here yet. That is the next piece -- a purchase action wired to
--    the plan builder, and a claims screen.
--
-- 2. It does not charge the premium. Like the application fee, collection is
--    Square's job.
--
-- 3. THE SCHOOL IS THE INSURER. This is not a product bought from a carrier --
--    when a claim is approved, the school forgives its own revenue. The report
--    above prints what 2.5% comes to across every eligible plan so the size of
--    that is visible. Two job losses in one year at full annual tuition costs
--    considerably more than the premiums collected. That is a business
--    judgement, not a schema problem, but the schema should not hide it.
-- ---------------------------------------------------------------------------
