-- 269: Structured Literacy a la carte is 850 per month.
--
-- Jimmy, 2026-09-05: "a la carte structured literacy class via the academy
-- virtual is 850 per month."
--
-- This reverses migration 266, which set it to 750. 266 was written from the
-- price sitting on the retired HS duplicate row, which turns out to have been
-- the old price rather than the current one.
--
-- READ THIS BEFORE RUNNING. It re-opens the Square question.
--
-- At 750, the catalog reproduced Isla Fitzgerald's live Square invoice exactly:
--     HS Experience 850 + Structured Literacy 750 + Life Math 350 - 100 = 1,850
-- At 850 it computes 1,950 against the 1,850 she is actually billed.
--
-- So the 100 gap is real after all, and it is a genuine price difference rather
-- than a catalog error: Isla is paying the old Structured Literacy rate.
--
-- That means SQUARE MIGRATION WAVE 2 STILL NEEDS GRANDFATHERED PER-FAMILY
-- RATES. Cutover requires an exact match to what Square charges today, and a
-- family must be holdable at a rate that differs from list price. Do not start
-- Wave 2 without it.
--
-- Sets every school that prices this class, so GA's tuition-owed to The Academy
-- Virtual stays in step with what Virtual actually charges.

begin;

do $$
declare v_hit int;
begin
  update public.tuition_school_prices tsp
     set standard_amount = 850.00,
         updated_at = now()
    from public.tuition_catalog_items ci
   where ci.id = tsp.catalog_item_id
     and ci.item_code = 'virtual_structured_literacy'
     and ci.is_active
     and coalesce(tsp.standard_amount, -1) <> 850.00;

  get diagnostics v_hit = row_count;
  raise notice '% price row(s) set to 850.00.', v_hit;
end $$;

select s.name  as attending_school,
       coalesce(tsp.standard_amount::text, '-- UNPRICED --') as amount,
       case when s.id = ci.provider_school_id
            then 'billed to the family'
            else 'owed to ' || ps.name end as who_pays
from public.tuition_school_prices tsp
join public.schools s                on s.id  = tsp.school_id
join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
join public.schools ps               on ps.id = ci.provider_school_id
where ci.item_code = 'virtual_structured_literacy'
  and ci.is_active
order by s.name;

commit;
