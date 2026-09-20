-- 251_one_to_one_session_rate_2026_09_04.sql
--
-- 1:1 tutoring is priced PER SESSION, not per month.
--
-- A parent requests a number of sessions in a month and the charge is
-- sessions × rate. The session count is a fact about that family's plan; the
-- rate is a fact about the class. Storing a monthly 1:1 figure would force
-- somebody to multiply by hand before typing, and hand-multiplied money is
-- money that is eventually wrong.
--
-- Also fixes a display bug I introduced: NULL in the 1:1 column rendered as
-- "not offered", while NULL in the standard column rendered as "not set". One
-- blank was making two different claims. `offered_one_to_one` now carries that
-- fact explicitly, so "not offered" only ever appears because someone said so.
--
-- SAFE TO RUN BEFORE THE CODE SHIPS. This ADDS columns and leaves
-- one_to_one_amount in place, so the currently deployed page keeps working
-- until the new build lands. That old column is dropped in a later cleanup,
-- not here.

begin;

alter table public.tuition_school_prices
  add column if not exists one_to_one_session_rate numeric(12,2)
    check (one_to_one_session_rate is null or one_to_one_session_rate >= 0),
  add column if not exists offered_one_to_one boolean not null default false;

comment on column public.tuition_school_prices.one_to_one_session_rate is
  'Price of ONE 1:1 session. The month''s charge is sessions requested x this rate; the session count lives on the family plan, not here.';

comment on column public.tuition_school_prices.offered_one_to_one is
  'Whether this item is sold 1:1 at all. False and a NULL rate mean different things: not offered vs not yet priced.';

comment on column public.tuition_school_prices.one_to_one_amount is
  'SUPERSEDED by one_to_one_session_rate (migration 251). Kept only so the previously deployed build keeps reading. Do not write to it.';

comment on column public.tuition_school_prices.standard_amount is
  'Price for one billing period, where the period is this row''s billing_frequency. Monthly for The Academy Virtual and The Academy HS, which sell month to month.';

-- Carry across anything already typed. Nothing has been priced yet, so this is
-- belt and braces rather than a real backfill.
update public.tuition_school_prices
set one_to_one_session_rate = one_to_one_amount
where one_to_one_amount is not null
  and one_to_one_session_rate is null;

-- Which items are actually sold 1:1.
--
-- The four Virtual foundational classes, wherever they are priced. Per the
-- operator: Lit Lab, Digit Lab and Earthology share one session rate;
-- Structured Literacy carries its own. That is data he types, not a rule, so
-- nothing here assumes the three match.
update public.tuition_school_prices tsp
set offered_one_to_one = true
from public.tuition_catalog_items ci
where ci.id = tsp.catalog_item_id
  and ci.item_code in (
    'virtual_lit_lab',
    'virtual_digit_lab',
    'virtual_earthology',
    'virtual_structured_literacy'
  );

-- Everything else is not sold 1:1: the two packages (a full program delivered
-- one to one is a different proposition, not a default), and every high-school
-- item, which by policy is class-only.
update public.tuition_school_prices tsp
set offered_one_to_one = false
from public.tuition_catalog_items ci
where ci.id = tsp.catalog_item_id
  and ci.item_code not in (
    'virtual_lit_lab',
    'virtual_digit_lab',
    'virtual_earthology',
    'virtual_structured_literacy'
  );

commit;

-- What is sold how, per school.
select
  s.name                as school,
  ci.display_name       as item,
  ci.item_kind          as kind,
  tsp.billing_frequency as standard_period,
  tsp.standard_amount,
  case when tsp.offered_one_to_one then 'yes' else 'no' end as sold_1to1,
  tsp.one_to_one_session_rate as per_session
from public.tuition_school_prices tsp
join public.schools s                on s.id  = tsp.school_id
join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
where s.name in ('The Academy Virtual','The Academy HS')
order by s.name, ci.sort_order;
