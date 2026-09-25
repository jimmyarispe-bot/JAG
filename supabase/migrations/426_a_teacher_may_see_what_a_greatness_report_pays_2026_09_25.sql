-- A TEACHER MAY SEE WHAT A GREATNESS REPORT PAYS - 25 September 2026
--
-- WHAT HAPPENED, AN HOUR AFTER IT SHIPPED.
--
-- Marnie Witters: "I couldn't add my 22 greatness reports. The dropdown wasn't
-- working." Peter Alouise: "It says 'There is no GREATNESS Report rate set up
-- yet, so this cannot be claimed. Tell Jimmy.'"
--
-- The rate is set up. We read it together this afternoon: greatness_report,
-- $5.00, unit 'student', applies to anybody, effective 2026-09-01.
--
-- They cannot READ it. Migration 377:
--
--   create policy work_pay_rates_read on public.work_pay_rates
--     for select using (has_permission('finance.view') or has_role('FOUNDER'));
--
-- So the teacher's query returns zero rows AND NO ERROR, workRateOn resolves
-- null, and the screen concludes the rate does not exist and disables itself.
-- The house pattern, in a feature written today by the person who keeps
-- writing that sentence down.
--
-- THIS IS NOT A NEW MECHANISM. Migration 397 met exactly this on 21 September
-- for class_pay_rates - "a teacher may see what their own class pays" - and
-- widened that policy to the rate belonging to nobody plus the rate belonging
-- to her. The same shape is applied here so the two tables behave alike.
--
-- WHAT IS AND IS NOT REVEALED. A teacher may now see the NETWORK rates, which
-- are what the network pays anybody for staff meetings, conferences, greatness
-- reports and the rest - figures she is quoted anyway, and must be able to see
-- to check her own pay sheet. She still cannot see a rate belonging to another
-- person: Katie Vetere's $25 an hour stays Katie's. And contractor_pay_ledger,
-- which holds what people were actually PAID, is untouched and remains
-- finance-only.

begin;

drop policy if exists work_pay_rates_read on public.work_pay_rates;

create policy work_pay_rates_read on public.work_pay_rates
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    -- The rate that belongs to nobody is what the network pays anybody.
    or work_pay_rates.employee_id is null
    -- Her own rate. Never somebody else's.
    or is_self_employee(work_pay_rates.employee_id)
  );

comment on policy work_pay_rates_read on public.work_pay_rates is
  'Finance and FOUNDER see every rate. A teacher sees the network rates and '
  'her own, so the pay sheet can price her claims and she can check the '
  'figure. Mirrors class_pay_rates_read (migration 397).';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect four rows: the old policy replaced, and the new one naming
-- is_self_employee. Reading this as the service role proves the policy EXISTS;
-- it cannot prove a teacher can read through it - the SQL editor bypasses RLS.
-- The only real test is Marnie or Peter reloading the timesheet and seeing the
-- dropdown enabled.
select
  policyname,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in ('work_pay_rates', 'class_pay_rates')
order by tablename, policyname;
