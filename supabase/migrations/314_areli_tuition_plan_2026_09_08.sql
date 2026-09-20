-- 314_areli_tuition_plan_2026_09_08.sql
--
-- Areli Romero's tuition plan. Requires 313.
--
-- $1,500 a month, month to month, paid through ClassWallet Arkansas EFA. The
-- same shape as Jelina Augustave's plan from 284: billing_mode 'monthly_open',
-- payment_channel 'classwallet', monthly_amount 1500.00, no annual total and no
-- instalment list, because there is no year total to close.
--
-- WHY THE PLAN SAYS 1,500.00 AND NOT 1,537.50
--
-- The plan records TUITION. $1,537.50 is the invoice - tuition plus a platform
-- fee passed through to the family's ESA. The fee is not revenue and it is not
-- what the family owes the school; it is what the platform charges to move the
-- money. Recording 1,537.50 here would put a payment-processing charge inside a
-- tuition figure, and every report built on tuition would carry it.
--
-- Jelina Augustave is stored at 1500.00 for the same reason (284). Same
-- program, same channel, same number.
--
-- WHY payment_channel MATTERS AND IS NOT DECORATION
--
-- Areli is paid by ClassWallet and appears NOWHERE in the Square export. 279's
-- header makes the point about Jelina and it applies here unchanged: without
-- the channel recorded, every future Square-to-JAG reconciliation reports her
-- as unpaid, and an exception list nobody trusts is worse than no list.
--
-- WHAT THIS SCRIPT DOES NOT FIX, AND JIMMY SHOULD DECIDE
--
-- The invoice is grossed up wrongly, in both directions, and this plan does not
-- correct it because the plan is not where the invoice is set:
--
--   Arkansas (0% fee)     bills 1,537.50 -> receives 1,537.50   +37.50/month
--   North Carolina (2.5%) bills 1,537.50 -> receives 1,499.06    -0.94/month
--
-- Both come from marking tuition UP by 2.5% instead of GROSSING it UP. Adding
-- 2.5% and then having 2.5% deducted from the larger number does not cancel.
-- To net T after a fee of r taken off the total, the invoice must be
-- T / (1 - r), never T x (1 + r):
--
--   Arkansas       1,500.00 / 1.000 = 1,500.00
--   North Carolina 1,500.00 / 0.975 = 1,538.46
--
-- Arkansas is over-collecting $37.50 a month from a family's education savings
-- account for a fee that is never charged. That is the half worth fixing first.
--
-- ALSO NOT HERE: the $100 shown on her application is an application fee, not
-- tuition, and does not belong in a monthly plan.
--
-- IDEMPOTENT. The partial unique index on (student_id, school_year_id) where
-- status = 'active' means a second active plan cannot be created; this script
-- checks first rather than relying on the error.

begin;

do $$
declare
  v_school_id  uuid;
  v_student_id uuid;
  v_year_id    uuid;
  v_plan_id    uuid;
begin
  select id into v_school_id
    from public.schools
   where name = 'The Academy Virtual';

  select id into v_student_id
    from public.students
   where school_id = v_school_id
     and lower(first_name) = 'areli'
     and lower(last_name)  = 'romero';

  if v_student_id is null then
    raise exception 'Areli Romero not found at The Academy Virtual. Run 313 first.';
  end if;

  select id into v_year_id
    from public.school_years
   where school_id = v_school_id and is_current
   limit 1;

  if v_year_id is null then
    raise exception 'No current school year at The Academy Virtual. Cannot place a plan.';
  end if;

  select id into v_plan_id
    from public.student_tuition_plans
   where student_id = v_student_id
     and school_year_id = v_year_id
     and status = 'active';

  if v_plan_id is not null then
    raise notice 'Areli Romero already has an active plan (%). Nothing written.', v_plan_id;
    return;
  end if;

  insert into public.student_tuition_plans
    (student_id, school_year_id, billing_mode, payment_channel,
     annual_tuition, prorated_tuition, proration_label, billing_basis,
     remaining_due, monthly_amount, status, source_document, notes)
  values
    (v_student_id, v_year_id, 'monthly_open', 'classwallet',
     null, null, null, null, null, 1500.00, 'active',
     'No document - month to month',
     'Enrolled 2026-09-01, 8th grade, 3rd-8th Full-School Program. Paid through CLASSWALLET '
     'Arkansas EFA, not Square - she is absent from the Square export entirely, so without this '
     'channel recorded every Square reconciliation will report her as unpaid. Guardian and payer '
     'is Brittani Jacz (bjacz1231@gmail.com), a different surname from the child. '
     'INVOICE NOTE: the ESA is currently billed 1,537.50 (tuition marked up 2.5% for a platform '
     'fee), but Arkansas deducts NO fee, so JAG receives 1,537.50 against 1,500.00 of tuition - '
     '37.50 a month of over-collection from the family''s account. Unresolved as at 2026-09-08.')
  returning id into v_plan_id;

  raise notice 'Created plan % for Areli Romero: 1,500.00/month, monthly_open, classwallet.', v_plan_id;
end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. Two students, same shape, same number.
--
--   Areli Romero      monthly_open  classwallet  1500.00  active
--   Jelina Augustave  monthly_open  classwallet  1500.00  active
--
-- Both are paid by ClassWallet and neither appears in Square.
-- ---------------------------------------------------------------------------

select
  st.first_name || ' ' || st.last_name as student,
  sc.name                              as school,
  p.billing_mode,
  p.payment_channel,
  p.monthly_amount,
  p.status,
  (select count(*) from public.funder_disbursements d
    where d.student_id = st.id)        as disbursements_on_file,
  (select coalesce(sum(d.net_amount), 0)::numeric(12,2)
     from public.funder_disbursements d
    where d.student_id = st.id)        as received_to_date
from public.student_tuition_plans p
join public.students st on st.id = p.student_id
join public.schools  sc on sc.id = st.school_id
where p.payment_channel = 'classwallet'
  and p.status = 'active'
order by st.last_name;
