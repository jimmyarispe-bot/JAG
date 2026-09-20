-- 253_ga_annual_tuition_2026_09_04.sql
--
-- The Academy GA charges its families an ANNUAL tuition: $19,950 for 2026-27,
-- a school rate rather than a per-student number.
--
-- From Braydon McCaskill's Schedule of Tuition Payments:
--
--     Annual Tuition (12 months)              19,950.00
--     Prorated Tuition, August - May          16,625.00
--     GA Goal Scholarship                     -1,000.00
--     GA Special Needs Scholarship (100%)    -14,562.00
--     ------------------------------------------------
--     Remaining Tuition Due                    1,063.00
--
-- 19,950 / 12 = 1,662.50 a month, x 10 months = 16,625. Proration is monthly
-- rate x months attending, and the scholarships come off the PRORATED figure,
-- not the annual one.
--
-- Note what this does NOT change: GA students also take The Academy Virtual and
-- The Academy HS classes, and that tuition is owed school to school rather than
-- billed to the family. Those rows already exist and stay unpriced. A GA family
-- is charged this one annual figure; the campus settles the rest internally.
--
-- 'tuition' joins the item_kind list because this is neither a class nor a fee,
-- and calling it either would be a small lie that later code would believe.
--
-- SAFE TO RE-RUN.

begin;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.schools where name = 'The Academy GA';
  if v_n <> 1 then
    raise exception
      'Expected exactly 1 school named "The Academy GA", found %. Run: select id, name from public.schools;', v_n;
  end if;
end $$;

-- Widen item_kind to admit tuition.
alter table public.tuition_catalog_items
  drop constraint if exists tuition_catalog_items_item_kind_check;

alter table public.tuition_catalog_items
  add constraint tuition_catalog_items_item_kind_check
  check (item_kind in ('class','package','fee','tuition'));

insert into public.tuition_catalog_items
  (item_code, display_name, item_kind, provider_school_id, description, sort_order)
select
  'ga_annual_tuition',
  'The Academy GA — Annual Tuition',
  'tuition',
  s.id,
  'Full-year campus tuition. Prorated by months attending; scholarships apply to the prorated figure.',
  1
from public.schools s
where s.name = 'The Academy GA'
on conflict (item_code) do nothing;

-- Priced ANNUALLY, which is why billing_frequency is not the default. The
-- screen reads this column to print "/ year" rather than "/ month", so the
-- period travels with the number instead of living in someone's head.
insert into public.tuition_school_prices
  (school_id, catalog_item_id, standard_amount, billing_frequency, offered_one_to_one, notes)
select
  s.id,
  ci.id,
  19950.00,
  'annual',
  false,
  'Billed to the family. 2026-27 rate.'
from public.schools s
join public.tuition_catalog_items ci on ci.item_code = 'ga_annual_tuition'
where s.name = 'The Academy GA'
on conflict (school_id, catalog_item_id) do update
  set standard_amount   = excluded.standard_amount,
      billing_frequency = excluded.billing_frequency,
      updated_at        = now();

commit;

-- What The Academy GA now charges, and what it merely owes.
select
  ci.display_name       as item,
  ci.item_kind          as kind,
  ps.name               as provided_by,
  case when tsp.school_id = ci.provider_school_id
       then 'billed to the family'
       else 'owed to ' || ps.name end as who_pays,
  tsp.standard_amount,
  tsp.billing_frequency
from public.tuition_school_prices tsp
join public.schools s                on s.id  = tsp.school_id
join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
join public.schools ps               on ps.id = ci.provider_school_id
where s.name = 'The Academy GA'
order by (tsp.school_id = ci.provider_school_id) desc, ci.sort_order;
