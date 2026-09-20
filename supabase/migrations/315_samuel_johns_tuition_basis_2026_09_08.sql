-- 315_samuel_johns_tuition_basis_2026_09_08.sql
--
-- Corrects Samuel Johns's tuition plan to record TUITION rather than the
-- grossed-up invoice. Requires 314.
--
-- WHAT IS WRONG
--
-- His plan carries monthly_amount = 1902.33. That is not his tuition; it is the
-- INVOICE. The Arizona ESA disbursement breaks down as:
--
--     gross debited from the ESA   1,902.33
--     ClassWallet fee (2.0%)          38.05
--     received by JAG              1,864.28
--
-- and 1,864.28 / 0.98 = 1,902.33 exactly, to the cent. Someone grossed that
-- figure up correctly and then copied the GROSS into the plan. Arizona is the
-- one state where the invoice arithmetic is right; only the record of it is
-- wrong.
--
-- WHY IT MATTERS THAT THE PLAN SAYS 1,864.28
--
-- The plan is what every tuition report, revenue figure and family balance is
-- built on. At 1,902.33 it asserts that $38.05 a month of ClassWallet's
-- processing fee is school tuition. Across a ten-month year that is $380.50 of
-- payment-processing charge sitting inside a tuition number, and every
-- comparison against Jelina Augustave (1,500.00) and Areli Romero (1,500.00),
-- who are both stored at tuition, is off by the fee.
--
-- THE INVOICE DOES NOT CHANGE. Arizona should still be billed 1,902.33. This
-- migration changes what JAG believes the tuition IS, not what is charged.
--
-- WHAT THIS SCRIPT DELIBERATELY DOES NOT TOUCH
--
-- 1. payment_channel. His plan says 'square_recurring' - "Square series
--    #000054, payer Sharona Dobson" - while ClassWallet Arizona has paid him
--    seven times, most recently 2026-08-21. Both cannot be the whole truth, and
--    if BOTH are live he is being charged 1,902.33 twice a month.
--
--    The channel is left as it is ON PURPOSE. If it stays 'square_recurring'
--    and the money really comes from ClassWallet, every Square reconciliation
--    flags him as unpaid - noisy, but VISIBLE, and it generates the question.
--    If it were changed to 'classwallet' and a Square series is in fact still
--    charging that card, the charge would reconcile against nothing and nobody
--    would ever see it. A visible wrong beats an invisible one. Jimmy is
--    checking Square series #000054 and #000048.
--
-- 2. Izabella McCallum. Her plan says 850.00/month; Arkansas EFA paid 865.73 on
--    2026-09-02. That gap of 15.73 fits none of the formulas - not x1.025
--    (871.25), not /0.98 (867.35), not /0.975 (871.79). It is unexplained, and
--    a plan should not be edited to match a number nobody can account for.
--
-- SAFE TO RE-RUN. Guarded on the current value, so a second run changes
-- nothing and says so.

begin;

do $$
declare
  v_student_id uuid;
  v_plan_id    uuid;
  v_current    numeric(12,2);
  v_channel    text;
begin
  select st.id into v_student_id
    from public.students st
   where lower(st.first_name) = 'samuel'
     and lower(st.last_name)  = 'johns';

  if v_student_id is null then
    raise exception 'Samuel Johns not found.';
  end if;

  select p.id, p.monthly_amount, p.payment_channel
    into v_plan_id, v_current, v_channel
    from public.student_tuition_plans p
   where p.student_id = v_student_id
     and p.status = 'active';

  if v_plan_id is null then
    raise exception 'Samuel Johns has no active tuition plan. Nothing to correct.';
  end if;

  if v_current = 1864.28 then
    raise notice 'Already 1,864.28. Nothing to do.';
    return;
  end if;

  if v_current <> 1902.33 then
    raise exception 'Expected monthly_amount 1902.33 but found %. Not changing it - '
                    'this script was written against a specific figure and the plan '
                    'has moved since.', v_current;
  end if;

  update public.student_tuition_plans
     set monthly_amount = 1864.28,
         updated_at     = now(),
         notes          = coalesce(notes || E'\n', '') ||
                          'CORRECTED 2026-09-08 (script 315): monthly_amount was 1,902.33, which is the '
                          'INVOICE, not the tuition. The Arizona ESA debits 1,902.33, ClassWallet keeps '
                          '38.05 (2.0%), and JAG receives 1,864.28 - and 1,864.28 / 0.98 = 1,902.33 to '
                          'the cent, so the gross-up was done correctly and the gross was then recorded '
                          'as tuition. At 1,902.33 the plan asserted that 38.05/month of processing fee '
                          'was school tuition: 380.50 a year, and every comparison with Jelina Augustave '
                          'and Areli Romero (both stored at tuition) was off by the fee. '
                          'THE INVOICE IS UNCHANGED - Arizona is still billed 1,902.33. '
                          'STILL OPEN: payment_channel reads square_recurring ("Square series #000054, '
                          'payer Sharona Dobson") while ClassWallet Arizona has paid him seven times, '
                          'latest 2026-08-21. If that Square series is live he is being charged twice. '
                          'Left as square_recurring deliberately so Square reconciliation keeps flagging '
                          'him until it is checked.'
   where id = v_plan_id;

  raise notice 'Samuel Johns: monthly_amount 1,902.33 -> 1,864.28. Channel still % (unresolved).', v_channel;
end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. Every student JAG knows is funded by ClassWallet, with what the
-- plan says against what has actually arrived.
--
-- Expect:
--   Jelina Augustave   classwallet       1500.00   received 14,649.36 over 10
--   Areli Romero       classwallet       1500.00   received  1,537.50 over  1
--   Samuel Johns       square_recurring  1864.28   received 10,874.25 over  7
--   Izabella McCallum  square_recurring   850.00   received    865.73 over  1
--
-- The two square_recurring rows are the open question: ClassWallet is paying
-- them and the plan says Square.
-- ---------------------------------------------------------------------------

select
  st.first_name || ' ' || st.last_name  as student,
  sc.name                               as school,
  p.billing_mode,
  p.payment_channel,
  p.monthly_amount                      as tuition_per_month,
  count(d.id)                           as disbursements,
  coalesce(sum(d.net_amount), 0)::numeric(12,2) as received_to_date,
  max(d.settled_on)                     as last_paid
from public.students st
join public.schools sc               on sc.id = st.school_id
join public.student_tuition_plans p  on p.student_id = st.id and p.status = 'active'
join public.funder_disbursements d   on d.student_id = st.id
group by st.first_name, st.last_name, sc.name, p.billing_mode,
         p.payment_channel, p.monthly_amount
order by sum(d.net_amount) desc;
