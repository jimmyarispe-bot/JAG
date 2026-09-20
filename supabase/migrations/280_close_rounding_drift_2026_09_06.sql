-- 280: close the sub-dollar rounding drift on the FL plans.
--
-- 51 plans loaded, 35 close, 16 do not. Every one of the 16 is out by between
-- one and eight cents, and all 16 are Florida.
--
-- THIS IS NOT A LOADER BUG. The documents do not add up. Each divides the
-- parent's balance into twelve equal payments and puts the remainder nowhere:
--
--   Izrael Alexander   stated balance 3,965.00
--                      12 x 330.42  = 3,965.04     four cents over
--   Ava Perkins        stated balance 4,750.00
--                      24 x 197.92  = 4,750.08     eight cents over
--
-- The same defect as Hailey Rosser's 2,000 and Abigail McHoney's 3,325, three
-- orders of magnitude smaller. It shows up now only because the balance view
-- recomputes instead of trusting the document's own "Remaining Balance: $0.00".
--
-- WHICH NUMBER IS TRUE. The instalments are. Square charges the monthly figure,
-- the family signed the monthly figure, and the balance line is a derived total
-- that was derived wrong. So remaining_due moves to match the payments — the
-- alternative is re-issuing sixteen schedules over four cents.
--
-- THE GUARD. Only differences under one dollar are touched. A dollar or more is
-- not rounding, it is an error, and this migration aborts rather than quietly
-- rewriting what a family owes. That distinction is the whole point: the same
-- statement that fixes four cents would silently absorb four hundred.
--
-- IDEMPOTENT.

begin;

do $$
declare
  r          record;
  v_fixed    int := 0;
  v_big      text[] := '{}';
begin
  for r in
    select b.plan_id, b.student, b.remaining_due, b.forgiveness_amount,
           b.scheduled_total, b.unaccounted
      from public.student_tuition_plan_balances b
     where b.billing_mode = 'scheduled'
       and b.closes is false
  loop
    if abs(r.unaccounted) >= 1.00 then
      v_big := array_append(v_big,
        r.student || ' (' || to_char(r.unaccounted, 'FM999999990.00') || ')');
    else
      update public.student_tuition_plans p
         set remaining_due = r.forgiveness_amount + r.scheduled_total,
             notes = concat_ws(' ', p.notes,
               'Stated balance ' || to_char(p.remaining_due, 'FM999999990.00') ||
               ' did not equal the sum of its instalments; adjusted by ' ||
               to_char(-r.unaccounted, 'FM999999990.00') ||
               ' on 2026-09-06 so the plan closes. The document''s monthly ' ||
               'amounts are unchanged.'),
             updated_at = now()
       where p.id = r.plan_id;
      v_fixed := v_fixed + 1;
      raise notice '% adjusted by %', r.student, to_char(-r.unaccounted, 'FM999999990.00');
    end if;
  end loop;

  if array_length(v_big, 1) is not null then
    raise exception 'Aborting: % plan(s) are out by a dollar or more. That is an error, not rounding, and needs reading before anything is rewritten: %',
      array_length(v_big, 1), array_to_string(v_big, ', ');
  end if;

  raise notice '% plan(s) closed.', v_fixed;
end $$;

commit;

-- Expect one row: scheduled, 51 plans, 51 closing, 0 not closing.
select billing_mode,
       count(*)                                as plans,
       count(*) filter (where closes)          as closing,
       count(*) filter (where closes is false) as not_closing,
       max(abs(unaccounted))                   as worst_gap
from public.student_tuition_plan_balances
group by billing_mode
order by billing_mode;
