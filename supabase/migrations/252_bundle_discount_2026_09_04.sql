-- 252_bundle_discount_2026_09_04.sql
--
-- The bundle discount, as a row rather than a number in code.
--
-- Isla Fitzgerald's Square invoice:
--
--     HS Experience        850.00
--     Structured Literacy  750.00
--     Life Math            350.00
--     Bundle discount     -100.00
--     ----------------------------
--                        1,850.00
--
-- Per the operator: flat $100, The Academy HS only, and it fires ONCE however
-- many supplementals a family adds. Isla holds two and takes $100, not $200.
--
-- It lives in a table because that $100 will change, and a discount that only a
-- deploy can alter is a discount somebody eventually applies by hand instead.
--
-- SAFE TO RE-RUN.

begin;

create table if not exists public.tuition_bundle_discounts (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid not null references public.schools(id) on delete cascade,
  name                 text not null,

  -- The package a family must hold for this rule to apply.
  package_item_id      uuid not null references public.tuition_catalog_items(id) on delete cascade,

  -- How many OTHER billable items they must also hold. "Other" excludes the
  -- package and everything inside it: holding The HS Experience plus Earth Lab
  -- is not "package plus a supplemental", because Earth Lab is already in it.
  min_additional_items integer not null default 1 check (min_additional_items >= 1),

  amount               numeric(12,2) not null check (amount >= 0),
  is_active            boolean not null default true,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (school_id, package_item_id)
);

comment on table public.tuition_bundle_discounts is
  'Flat discounts applied once per family per period when they hold a package plus enough other items.';

alter table public.tuition_bundle_discounts enable row level security;

-- Both USING and WITH CHECK. An UPDATE policy with only USING matches zero rows
-- and reports success, which is how migration 235's schools bug behaved.
drop policy if exists tuition_bundle_discounts_staff on public.tuition_bundle_discounts;
create policy tuition_bundle_discounts_staff on public.tuition_bundle_discounts
  for all
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

-- The one rule that exists today.
insert into public.tuition_bundle_discounts
  (school_id, name, package_item_id, min_additional_items, amount, notes)
select
  s.id,
  'HS Experience bundle discount',
  ci.id,
  1,
  100.00,
  'Flat $100/month, once per family, when they hold The HS Experience plus at least one supplemental class. Matches Isla Fitzgerald''s Square invoice.'
from public.schools s
join public.tuition_catalog_items ci on ci.item_code = 'hs_experience'
where s.name = 'The Academy HS'
on conflict (school_id, package_item_id) do nothing;

commit;

-- Confirm, and show the arithmetic it produces for a family shaped like Isla's.
select
  s.name                  as school,
  bd.name                 as rule,
  ci.display_name         as requires_package,
  bd.min_additional_items as plus_at_least,
  bd.amount               as discount,
  bd.is_active
from public.tuition_bundle_discounts bd
join public.schools s                on s.id  = bd.school_id
join public.tuition_catalog_items ci on ci.id = bd.package_item_id
order by s.name;
