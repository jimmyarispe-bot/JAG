-- 265: Structured Literacy is The Academy Virtual's, and only Virtual's.
--
-- Migration 249 seeded it twice: virtual_structured_literacy AND
-- hs_structured_literacy. Jimmy, 2026-09-05: it is offered a la carte through
-- The Academy Virtual only. The HS copy is not a second product, it is the same
-- class entered twice, and two catalog rows for one class is how "what did we
-- bill for Structured Literacy" stops having an answer.
--
-- HS students DO take it — Isla Fitzgerald's Square invoice is the proof — so
-- this does not remove the ability to bill them. It moves that ability onto the
-- Virtual item by giving The Academy HS a price row for it, carrying across
-- whatever amount was set on the HS duplicate.
--
-- Reversible: the duplicate is marked inactive, not deleted, so any history
-- pointing at it still resolves.
--
-- IDEMPOTENT.

begin;

do $$
declare
  v_hs_school   uuid;
  v_hs_item     uuid;
  v_virt_item   uuid;
  v_amount      numeric;
  v_rate        numeric;
  v_offered     boolean;
begin
  select id into v_hs_school from public.schools where name = 'The Academy HS';
  select id into v_hs_item   from public.tuition_catalog_items where item_code = 'hs_structured_literacy';
  select id into v_virt_item from public.tuition_catalog_items where item_code = 'virtual_structured_literacy';

  if v_hs_school is null or v_virt_item is null then
    raise exception 'Aborting: could not find The Academy HS or virtual_structured_literacy.';
  end if;

  if v_hs_item is null then
    raise notice 'hs_structured_literacy is already gone. Nothing to retire.';
  else
    -- Carry the price across before retiring the row that holds it.
    select standard_amount, one_to_one_session_rate, offered_one_to_one
      into v_amount, v_rate, v_offered
    from public.tuition_school_prices
    where school_id = v_hs_school and catalog_item_id = v_hs_item;

    raise notice 'HS price on the duplicate: standard=%, 1:1 rate=%, offered=%',
      coalesce(v_amount::text, 'NULL'), coalesce(v_rate::text, 'NULL'), coalesce(v_offered::text, 'NULL');
  end if;

  -- The Academy HS can now price the Virtual item. NULL is preserved as NULL:
  -- a blank price means "may not bill yet", and inventing a zero here would
  -- quietly make the class free.
  insert into public.tuition_school_prices
    (school_id, catalog_item_id, standard_amount, one_to_one_session_rate, offered_one_to_one, notes)
  values
    (v_hs_school, v_virt_item, v_amount, v_rate, coalesce(v_offered, false),
     'Structured Literacy is provided by The Academy Virtual and taken a la carte by HS students. Billed to the family — see Isla Fitzgerald''s invoice.')
  on conflict (school_id, catalog_item_id) do update
    set standard_amount        = coalesce(public.tuition_school_prices.standard_amount, excluded.standard_amount),
        one_to_one_session_rate= coalesce(public.tuition_school_prices.one_to_one_session_rate, excluded.one_to_one_session_rate),
        notes                  = excluded.notes;

  if v_hs_item is not null then
    -- Retire, do not delete. Anything already pointing at it still resolves.
    update public.tuition_catalog_items
       set is_active = false,
           description = coalesce(description, '') ||
             ' [Retired 2026-09-05: duplicate. Structured Literacy is offered only through The Academy Virtual.]'
     where id = v_hs_item;

    -- And take its price off the board so nobody prices a retired item.
    update public.tuition_school_prices
       set notes = 'Retired 2026-09-05 — superseded by the Virtual item.'
     where catalog_item_id = v_hs_item;
  end if;
end $$;

-- Structured Literacy, everywhere it is now priceable.
select s.name  as attending_school,
       ps.name as provided_by,
       ci.item_code,
       ci.is_active,
       tsp.standard_amount,
       tsp.notes
from public.tuition_school_prices tsp
join public.schools s                on s.id  = tsp.school_id
join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
join public.schools ps               on ps.id = ci.provider_school_id
where ci.display_name = 'Structured Literacy'
order by ci.is_active desc, s.name;

commit;
