-- 293_late_fees_2026_09_06.sql
--
-- Make the late fee real.
--
-- WHERE THIS RUNS, AND WHY NOT ON `invoices`.
-- There is already a late-fee engine in packages/academyos/finance -- correct in
-- shape (due day, accrual start, daily amount, day cap) and completely unreal:
-- it stores everything in Maps on globalThis and never touches Postgres. There is
-- also `invoices.late_fee_amount`, which only a human can set by typing a number
-- into a form. And there is `late_fee_policy` in the config table, shaped as a
-- percentage with grace days, which nothing reads.
--
-- Three representations, none of them yours. This is the fourth and it is the one
-- that runs against real rows: JAG does not issue invoices -- Square does -- so
-- the only place a due date and a payment state actually live is
-- student_tuition_instalments. That is what the Schedule of Tuition Payments IS.
--
-- THE RULE (contract, all four schools, effective 1 January 2027):
--   Tuition due the 25th. If unpaid by the 1st of the FOLLOWING month, $25/day,
--   maximum five days ($125). Then attendance/access suspended until current.
--
-- SUPABASE NOTES:
--   * The editor shows only the LAST result set. The final SELECT is the report.
--   * "creates tables without RLS" may flag on the temp table. False positive.

begin;

-- ---------------------------------------------------------------------------
-- 1. The table. One live row per instalment; it accrues by UPDATE, not by
--    inserting a row per day. A day-per-row ledger would be more auditable and
--    would also mean five rows to reverse every time somebody pays on day four.
-- ---------------------------------------------------------------------------

create table if not exists public.student_tuition_late_fees (
  id                 uuid primary key default gen_random_uuid(),
  plan_id            uuid not null
                       references public.student_tuition_plans(id) on delete cascade,
  instalment_id      uuid not null
                       references public.student_tuition_instalments(id) on delete cascade,
  fee_start_date     date not null,
  days_assessed      integer not null,
  amount_cents       integer not null,
  status             text not null default 'assessed',
  requires_review    boolean not null default false,
  review_reason      text,
  waived_by_user_id  uuid references auth.users(id) on delete set null,
  waiver_reason      text,
  waived_at          timestamptz,
  first_assessed_at  timestamptz not null default now(),
  last_assessed_at   timestamptz not null default now(),
  assessed_through   date not null,
  constraint student_tuition_late_fees_one_per_instalment unique (instalment_id),
  constraint student_tuition_late_fees_days_sane
    check (days_assessed between 1 and 5),
  constraint student_tuition_late_fees_amount_sane
    check (amount_cents >= 0),
  constraint student_tuition_late_fees_status_valid
    check (status in ('assessed', 'waived', 'settled')),
  constraint student_tuition_late_fees_waiver_coherent
    check (
      (status = 'waived'
         and waived_by_user_id is not null
         and waiver_reason is not null
         and waived_at is not null)
      or
      (status <> 'waived'
         and waived_by_user_id is null
         and waiver_reason is null
         and waived_at is null)
    )
);

comment on table public.student_tuition_late_fees is
  'One row per instalment that has accrued a late fee. Accrues by UPDATE up to '
  'the five-day cap. Written only by assess_tuition_late_fees() under the '
  'service role; waivers go through a server action, never a direct client write.';
comment on column public.student_tuition_late_fees.assessed_through is
  'The as-of date this row was last computed for. Makes the accrual reproducible: '
  'days_assessed is a function of (fee_start_date, assessed_through).';
comment on column public.student_tuition_late_fees.requires_review is
  'True when the family does not pay through Square -- ClassWallet, state direct, '
  'or unknown. The fee is computed but should NOT be charged without a human '
  'looking, because the delay may be the funder''s and not the family''s.';

create index if not exists student_tuition_late_fees_plan_idx
  on public.student_tuition_late_fees (plan_id);
create index if not exists student_tuition_late_fees_open_idx
  on public.student_tuition_late_fees (status, requires_review)
  where status = 'assessed';

-- ---------------------------------------------------------------------------
-- 2. RLS. The policy does not restate who may see a tuition plan -- it defers.
--    "You can see a late fee if you can see its plan." A subquery inside a
--    policy is itself subject to the referenced table's RLS for the querying
--    user, so this inherits whatever student_tuition_plans already enforces and
--    cannot drift away from it later.
--
--    NO insert/update/delete policy, deliberately. The only writer is the
--    service-role path, exactly like platform_job_runs (289).
-- ---------------------------------------------------------------------------

alter table public.student_tuition_late_fees enable row level security;

drop policy if exists student_tuition_late_fees_read on public.student_tuition_late_fees;
create policy student_tuition_late_fees_read
  on public.student_tuition_late_fees
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.student_tuition_plans p
       where p.id = student_tuition_late_fees.plan_id
    )
  );

-- ---------------------------------------------------------------------------
-- 3. The assessment function.
--
--    Idempotent: running it twice on the same day changes nothing. Running it
--    after a family pays freezes the fee at the day they paid rather than
--    continuing to accrue.
--
--    Every number that defines the policy is a parameter with a default, so the
--    rule lives in ONE place and a change is a change to one call.
-- ---------------------------------------------------------------------------

create or replace function public.assess_tuition_late_fees(
  p_as_of        date    default current_date,
  p_policy_start date    default date '2027-01-01',
  p_daily_cents  integer default 2500,
  p_max_days     integer default 5
)
returns table (
  outcome        text,
  plan_id        uuid,
  instalment_id  uuid,
  days_assessed  integer,
  amount_cents   integer,
  note           text
)
language plpgsql
as $$
begin
  return query
  with candidate as (
    select
      i.id                    as instalment_id,
      i.plan_id               as plan_id,
      i.due_date              as due_date,
      i.is_paid               as is_paid,
      i.paid_at               as paid_at,
      pl.payment_channel      as payment_channel,
      -- The contract ties accrual to the month AFTER the month tuition was due.
      -- Due 25 Dec -> fee starts 1 Jan. Computed, never assumed to be the 1st of
      -- "next month from today".
      (date_trunc('month', i.due_date)::date + interval '1 month')::date
                              as fee_start_date,
      -- If they paid, the clock stopped the day they paid -- not today.
      least(
        coalesce(i.paid_at::date, p_as_of),
        p_as_of
      )                       as effective_end
    from public.student_tuition_instalments i
    join public.student_tuition_plans pl on pl.id = i.plan_id
    where pl.status = 'active'
      and pl.billing_mode = 'scheduled'
      and i.due_date is not null
  ),
  computed as (
    select
      c.*,
      least(
        p_max_days,
        greatest(0, (c.effective_end - c.fee_start_date) + 1)
      ) as days
    from candidate c
    where c.fee_start_date >= p_policy_start   -- nothing before 1 Jan 2027
  ),
  chargeable as (
    select
      c.*,
      c.days * p_daily_cents as amount,
      -- Not a judgement about the family. ClassWallet and state-direct payers
      -- depend on a third party's timing, and the notice to families promises
      -- we will not charge them for the funder's delay.
      (c.payment_channel is null
        or c.payment_channel in ('classwallet', 'state_direct', 'other')) as needs_review,
      case
        when c.payment_channel is null or c.payment_channel = '' then
          'Payment channel unknown -- confirm before charging'
        when c.payment_channel in ('classwallet', 'state_direct', 'other') then
          'Pays outside Square (' || c.payment_channel || ') -- delay may be the funder''s'
      end as review_note
    from computed c
    where c.days > 0
      -- An instalment marked paid BEFORE the fee window opened never accrued.
      and not (c.is_paid and coalesce(c.paid_at::date, c.effective_end) < c.fee_start_date)
  ),
  upserted as (
    insert into public.student_tuition_late_fees as f (
      plan_id, instalment_id, fee_start_date, days_assessed, amount_cents,
      requires_review, review_reason, assessed_through
    )
    select
      ch.plan_id, ch.instalment_id, ch.fee_start_date, ch.days, ch.amount,
      ch.needs_review, ch.review_note, p_as_of
    from chargeable ch
    on conflict (instalment_id) do update
      set days_assessed    = excluded.days_assessed,
          amount_cents     = excluded.amount_cents,
          requires_review  = excluded.requires_review,
          review_reason    = excluded.review_reason,
          assessed_through = excluded.assessed_through,
          last_assessed_at = now()
      -- A waived fee stays waived. Re-running the job must never quietly
      -- reinstate something a person decided to forgive.
      where f.status <> 'waived'
    returning f.plan_id, f.instalment_id, f.days_assessed, f.amount_cents,
              f.requires_review, f.status
  )
  select
    case
      when u.requires_review then 'ASSESSED - NEEDS REVIEW'
      else 'ASSESSED'
    end,
    u.plan_id,
    u.instalment_id,
    u.days_assessed,
    u.amount_cents,
    case when u.requires_review
      then 'Do not charge without confirming the funder was not the cause'
      else 'Chargeable'
    end
  from upserted u;
end $$;

comment on function public.assess_tuition_late_fees(date, date, integer, integer) is
  'Assess tuition late fees per the contract rule: $25/day from the 1st of the '
  'month following the due month, five days maximum. Idempotent. Never reinstates '
  'a waived fee. Only touches billing_mode = scheduled plans -- month-to-month '
  'plans have no instalments and cannot be assessed this way.';

-- ---------------------------------------------------------------------------
-- 4. Report: what this CAN and CANNOT see. Written to a temp table so the
--    editor shows it -- RAISE NOTICE is invisible in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

drop table if exists _late_fee_report;
create temp table _late_fee_report (seq integer, item text, value text);

do $$
declare
  v_scheduled   integer;
  v_monthly     integer;
  v_instalments integer;
  v_nodue       integer;
  v_offsquare   integer;
  v_unknownchan integer;
begin
  select count(*) filter (where billing_mode = 'scheduled'),
         count(*) filter (where billing_mode = 'monthly_open')
    into v_scheduled, v_monthly
    from public.student_tuition_plans where status = 'active';

  select count(*), count(*) filter (where due_date is null)
    into v_instalments, v_nodue
    from public.student_tuition_instalments i
    join public.student_tuition_plans p on p.id = i.plan_id
   where p.status = 'active';

  select count(*) filter (where payment_channel in ('classwallet','state_direct','other')),
         count(*) filter (where payment_channel is null or payment_channel = '')
    into v_offsquare, v_unknownchan
    from public.student_tuition_plans where status = 'active';

  insert into _late_fee_report values
    (1,  'Table created',                'student_tuition_late_fees'),
    (2,  'Function created',             'assess_tuition_late_fees(as_of, policy_start, daily_cents, max_days)'),
    (3,  'Policy start (hard default)',  '2027-01-01'),
    (4,  'Rule',                         '$25/day from the 1st after the due month, 5 days max ($125)'),
    (10, 'Plans CAN be assessed (scheduled)',   v_scheduled::text),
    (11, 'Plans CANNOT be assessed (monthly)',  v_monthly::text),
    (12, 'Instalments in scope',                v_instalments::text),
    (13, 'Instalments with NO due date (skipped)', v_nodue::text),
    (20, 'Plans paying outside Square (flagged, not charged)', v_offsquare::text),
    (21, 'Plans with unknown payment channel (flagged)',       v_unknownchan::text),
    (30, 'Fees assessed by this migration',     '0 - nothing was run, see below');
end $$;

commit;

select item, value from _late_fee_report order by seq;

-- ---------------------------------------------------------------------------
-- THIS MIGRATION DOES NOT ASSESS ANYTHING. It creates the table and the
-- function and reports what they can reach. Nothing is charged to anybody by
-- running this file.
--
-- To see what WOULD be assessed on a given date, without writing (run it inside
-- a transaction you roll back):
--
--     begin;
--     select * from public.assess_tuition_late_fees(date '2027-01-06');
--     rollback;
--
-- THREE LIMITS, STATED PLAINLY:
--
-- 1. MONTH-TO-MONTH PLANS CANNOT BE ASSESSED. HS and Virtual families on
--    billing_mode = 'monthly_open' have a monthly_amount and NO instalments --
--    there is no due date to accrue from. Those are exactly the schools gaining
--    a late fee on 1 January. Either they get generated monthly dues, or their
--    fees are assessed by hand. This is the biggest gap and it is not a bug in
--    the function; it is a missing billing concept.
--
-- 2. IT TRUSTS is_paid. Nothing reconciles instalments against Square today, so
--    is_paid is whatever a person last set. Until SQUARE_ACCESS_TOKEN is in
--    Vercel and a sync runs, this function will happily assess a fee against a
--    family who paid on time and whose row nobody ticked. DO NOT let it write
--    to anything a parent sees until that sync exists.
--
-- 3. IT DOES NOT CHARGE. It records what is owed. Collecting it means a Square
--    invoice, which is a separate piece of work.
-- ---------------------------------------------------------------------------
