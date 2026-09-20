-- 279: tuition plans that have no end date, and money that does not come
-- through Square.
--
-- Migration 270 was built from the GA and FL schedule documents, so it assumes
-- every plan has a year total, a fixed list of instalments, and a balance that
-- closes to zero. That is true of all 51 plans loaded so far and false of most
-- of HS and Virtual.
--
--   Ivy Ash          965.00/month, a la carte, month to month, no end date
--   Olson Peters     month to month
--   Wren Peters      month to month
--   and half of the Square series say "Repeats indefinitely"
--
-- There is no honest annual_tuition for any of them. Inventing one — 965 x 10,
-- say — would put a number in the database that nobody agreed to and that a
-- future reader would take for a debt. So the table learns a second shape
-- instead.
--
--   billing_mode = 'scheduled'     a year total and a closing instalment list.
--                                  Every existing plan. Behaviour unchanged.
--   billing_mode = 'monthly_open'  a monthly amount and no end date. No year
--                                  total, no balance, nothing to close.
--
-- AND WHERE THE MONEY ARRIVES. Jelina Augustave pays 1,500 a month through
-- ClassWallet and appears nowhere in the Square export. Without recording the
-- channel, every future Square-to-JAG reconciliation flags her as unpaid — and
-- the person doing it stops trusting the exception list, which is worse than
-- having no list.
--
-- SAFETY. annual_tuition, billing_basis and remaining_due lose their NOT NULL,
-- which on its own would let a scheduled plan be saved with no price at all.
-- A CHECK constraint puts that back, per mode. The columns are not weakened;
-- the rule just moved to where it can be different for the two shapes.

begin;

-- ---------------------------------------------------------------------------
-- 1. The two shapes
-- ---------------------------------------------------------------------------

alter table public.student_tuition_plans
  add column if not exists billing_mode text not null default 'scheduled',
  add column if not exists monthly_amount numeric(12,2),
  add column if not exists payment_channel text;

alter table public.student_tuition_plans
  drop constraint if exists plan_billing_mode_valid;
alter table public.student_tuition_plans
  add constraint plan_billing_mode_valid
  check (billing_mode in ('scheduled', 'monthly_open'));

alter table public.student_tuition_plans
  drop constraint if exists plan_monthly_amount_nonneg;
alter table public.student_tuition_plans
  add constraint plan_monthly_amount_nonneg
  check (monthly_amount is null or monthly_amount >= 0);

-- Where the money actually arrives. NULL means not yet established, which is
-- an honest state and different from "no channel".
alter table public.student_tuition_plans
  drop constraint if exists plan_payment_channel_valid;
alter table public.student_tuition_plans
  add constraint plan_payment_channel_valid
  check (payment_channel is null or payment_channel in (
    'square_recurring',   -- a recurring series in the Square export
    'square_invoice',     -- invoiced ad hoc through Square
    'classwallet',        -- ClassWallet disbursement
    'state_direct',       -- the state pays the school; nothing from the family
    'other'
  ));

-- ---------------------------------------------------------------------------
-- 2. Let the annual columns be absent, then require them by mode
-- ---------------------------------------------------------------------------

alter table public.student_tuition_plans alter column annual_tuition drop not null;
alter table public.student_tuition_plans alter column billing_basis  drop not null;
alter table public.student_tuition_plans alter column remaining_due  drop not null;

alter table public.student_tuition_plans
  drop constraint if exists plan_mode_fields_present;
alter table public.student_tuition_plans
  add constraint plan_mode_fields_present
  check (
    (billing_mode = 'scheduled'
       and annual_tuition is not null
       and billing_basis  is not null
       and remaining_due  is not null
       and monthly_amount is null)
    or
    (billing_mode = 'monthly_open'
       and monthly_amount   is not null
       and annual_tuition   is null
       and prorated_tuition is null
       and remaining_due    is null)
  );

-- ---------------------------------------------------------------------------
-- 3. The balance view
-- ---------------------------------------------------------------------------
--
-- A month-to-month plan has nothing to close, so `closes` is NULL for it, not
-- false. False would read as "this plan is broken" on every dashboard and in
-- every future audit, and 20-odd permanently-red rows train people to ignore
-- the column.
--
-- Dropped and recreated rather than replaced: new columns in the middle of the
-- select list cannot go in with CREATE OR REPLACE VIEW.

drop view if exists public.student_tuition_plan_balances;

create view public.student_tuition_plan_balances
with (security_invoker = on) as
select
  p.id                as plan_id,
  p.student_id,
  s.first_name || ' ' || s.last_name as student,
  sc.name             as school,
  sy.name             as school_year,
  p.billing_mode,
  p.payment_channel,
  p.monthly_amount,
  p.billing_basis,
  p.remaining_due,
  p.forgiveness_amount,
  case when p.billing_mode = 'scheduled'
       then coalesce(sum(i.amount), 0) end                 as scheduled_total,
  case when p.billing_mode = 'scheduled'
       then p.remaining_due - p.forgiveness_amount
            - coalesce(sum(i.amount), 0) end               as unaccounted,
  case
    when p.billing_mode <> 'scheduled' then null
    when abs(p.remaining_due - p.forgiveness_amount
             - coalesce(sum(i.amount), 0)) < 0.005 then true
    else false
  end                                                      as closes,
  count(i.id)                                              as instalment_count,
  coalesce(sum(i.amount) filter (where i.is_paid), 0)      as paid_to_date
from public.student_tuition_plans p
join public.students s on s.id = p.student_id
left join public.schools sc on sc.id = s.school_id
join public.school_years sy on sy.id = p.school_year_id
left join public.student_tuition_instalments i on i.plan_id = p.id
where p.status = 'active'
group by p.id, s.first_name, s.last_name, sc.name, sy.name;

comment on column public.student_tuition_plans.billing_mode is
  'scheduled = a year total paid on a fixed instalment list. monthly_open = a '
  'monthly charge with no end date and no year total. Do not synthesise an '
  'annual figure for the latter; nobody agreed to one.';
comment on column public.student_tuition_plans.payment_channel is
  'Where the money arrives. Families paying outside Square — ClassWallet, for '
  'one — are otherwise flagged as unpaid by every Square reconciliation.';

commit;

-- Nothing should have changed for the plans already loaded: every one of them
-- is 'scheduled', and every one should still close.
select billing_mode,
       count(*)                                as plans,
       count(*) filter (where closes)          as closing,
       count(*) filter (where closes is false) as not_closing
from public.student_tuition_plan_balances
group by billing_mode
order by billing_mode;
