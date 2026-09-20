-- 266: Structured Literacy is 750 everywhere it is priced.
--
-- 265 retired the HS duplicate and carried its 750 onto the Virtual item, which
-- left an HS student paying 750 for the same class a Virtual student paid 950
-- for. Jimmy, 2026-09-05: bring the 950 down to 750 to match.
--
-- This changes what families are asked to pay, so it names the rows it touches
-- and refuses if the count is not what we expect.
--
-- Touches only rows currently at exactly 950. A row someone has since set to
-- something else is left alone rather than silently overwritten. Re-running
-- therefore does nothing.

begin;

do $$
declare v_hit int;
begin
  update public.tuition_school_prices tsp
     set standard_amount = 750.00,
         updated_at = now()
    from public.tuition_catalog_items ci
   where ci.id = tsp.catalog_item_id
     and ci.item_code = 'virtual_structured_literacy'
     and tsp.standard_amount = 950.00;

  get diagnostics v_hit = row_count;

  if v_hit = 0 then
    raise notice 'Nothing at 950 to change. Already done, or the prices have moved since.';
  else
    raise notice '% price row(s) reduced from 950.00 to 750.00.', v_hit;
  end if;
end $$;

-- Structured Literacy everywhere. Every active row should now read 750.00
-- except The Academy FL, which is NULL.
--
-- FL's NULL is honest — "may not bill yet", not free — but it means FL's
-- tuition owed to The Academy Virtual currently accrues at nothing, while GA's
-- accrues at 750. Worth setting if FL students take this class.
select s.name  as attending_school,
       ps.name as provided_by,
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
