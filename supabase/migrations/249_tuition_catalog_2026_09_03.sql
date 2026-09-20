-- 249_tuition_catalog_2026_09_03.sql
--
-- What The Academy Way actually sells, named once.
--
-- Today the same seven-ish things appear under ~120 different titles across
-- 1,649 Square invoices, which is how "Sturctured Literacy" reached a parent.
-- A catalog fixes the naming, and it makes "what did we bill for Structured
-- Literacy last year" a question with an answer.
--
-- Three ideas, in order:
--
--   1. A catalog item is a CONCEPT, and it belongs to the school that PROVIDES
--      it. Lit Lab is the Virtual school's. The HS Experience is the high
--      school's.
--
--   2. A price is per ATTENDING school. The same class can cost different
--      things at different campuses.
--
--   3. When the attending school is not the providing school, the money is owed
--      SCHOOL TO SCHOOL, not to the family. FL and GA students take Virtual and
--      HS classes; the family is not billed and no funds move, but the debt is
--      real and it is tracked. That is what interschool_tuition_charges is for.
--
-- Amounts are deliberately left NULL. Nothing in this file invents a price.
-- That is the whole point of migration 248.

begin;

-- Guard: this seeds by school NAME, so the names must be what we think.
do $$
declare v_n int;
begin
  select count(*) into v_n
  from public.schools
  where name in ('The Academy FL','The Academy GA','The Academy HS','The Academy Virtual');
  if v_n <> 4 then
    raise exception
      'Expected the 4 known schools by name, found %. Run: select id, name from public.schools;', v_n;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. The catalog
-- ---------------------------------------------------------------------------

create table if not exists public.tuition_catalog_items (
  id                 uuid primary key default gen_random_uuid(),
  item_code          text not null unique,
  display_name       text not null,
  item_kind          text not null check (item_kind in ('class','package','fee')),
  -- The school whose program this is. When a student attends elsewhere, this is
  -- the school the tuition is owed TO.
  provider_school_id uuid not null references public.schools(id) on delete restrict,
  description        text,
  sort_order         integer not null default 0,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.tuition_catalog_items is
  'The billable concepts, named once. item_code is the stable key; display_name is what a parent reads.';

-- The HS Experience contains three classes. A family holding the package holds
-- those classes; this is what makes the bundle discount expressible as a rule
-- about components rather than a note on an account.
create table if not exists public.tuition_package_items (
  id              uuid primary key default gen_random_uuid(),
  package_item_id uuid not null references public.tuition_catalog_items(id) on delete cascade,
  member_item_id  uuid not null references public.tuition_catalog_items(id) on delete cascade,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (package_item_id, member_item_id),
  check (package_item_id <> member_item_id)
);

-- ---------------------------------------------------------------------------
-- 2. Prices, per attending school
-- ---------------------------------------------------------------------------

create table if not exists public.tuition_school_prices (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  catalog_item_id   uuid not null references public.tuition_catalog_items(id) on delete cascade,

  -- Inside the full school program, or taken a la carte as a class. Per the
  -- operator those are the same number today. They are still different
  -- enrollments, and this one column prices both.
  standard_amount   numeric(12,2) check (standard_amount is null or standard_amount >= 0),

  -- 1:1 tutoring. NULL means this item is NOT offered 1:1 at this school —
  -- which is true of every high-school item by policy.
  one_to_one_amount numeric(12,2) check (one_to_one_amount is null or one_to_one_amount >= 0),

  billing_frequency text not null default 'monthly'
    check (billing_frequency in ('annual','semester','quarterly','monthly','weekly','per_session')),

  is_active         boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (school_id, catalog_item_id)
);

comment on column public.tuition_school_prices.standard_amount is
  'NULL means not priced yet. Nothing may bill or accrue against a NULL amount.';

-- ---------------------------------------------------------------------------
-- 3. Tuition owed between schools
-- ---------------------------------------------------------------------------

create table if not exists public.interschool_tuition_charges (
  id               uuid primary key default gen_random_uuid(),
  -- The campus the student attends. It owes.
  owing_school_id  uuid not null references public.schools(id) on delete restrict,
  -- The school that provides the instruction. It is owed.
  owed_school_id   uuid not null references public.schools(id) on delete restrict,
  student_id       uuid references public.students(id) on delete set null,
  catalog_item_id  uuid not null references public.tuition_catalog_items(id) on delete restrict,
  delivery_mode    text not null default 'standard'
                     check (delivery_mode in ('standard','one_to_one')),
  period_start     date not null,
  period_end       date not null,
  amount           numeric(12,2) not null check (amount >= 0),

  -- 'accrued' is the resting state, and the one the operator asked for: the
  -- obligation is recorded and no funds move. Settlement is a deliberate act,
  -- not something a nightly job does on its own.
  status           text not null default 'accrued'
                     check (status in ('accrued','settled','waived','void')),
  status_reason    text,
  settled_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  check (owing_school_id <> owed_school_id),
  check (period_end >= period_start)
);

-- One charge per student, per item, per mode, per period. Accrual can be re-run
-- without doubling the debt.
create unique index if not exists interschool_tuition_charges_unique_period
  on public.interschool_tuition_charges (student_id, catalog_item_id, delivery_mode, period_start)
  where student_id is not null and status <> 'void';

create index if not exists interschool_tuition_charges_owed
  on public.interschool_tuition_charges (owed_school_id, status, period_start);
create index if not exists interschool_tuition_charges_owing
  on public.interschool_tuition_charges (owing_school_id, status, period_start);

comment on table public.interschool_tuition_charges is
  'Tuition owed by one school to another when a student attends one campus and takes another school''s program. Never becomes a family invoice.';

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.tuition_catalog_items       enable row level security;
alter table public.tuition_package_items       enable row level security;
alter table public.tuition_school_prices       enable row level security;
alter table public.interschool_tuition_charges enable row level security;

drop policy if exists tuition_catalog_items_read on public.tuition_catalog_items;
create policy tuition_catalog_items_read on public.tuition_catalog_items
  for select using (
    has_permission('finance.view') or has_permission('finance.manage')
    -- Role fallback. If the finance.* permission keys are not seeded in this
    -- database, has_permission() is false for everyone and the catalog locks
    -- out the person who owns it. A policy that can only fail closed on a
    -- missing row is not a security control, it is an outage.
    or has_role('CEO') or has_role('FOUNDER')
  );

drop policy if exists tuition_catalog_items_write on public.tuition_catalog_items;
create policy tuition_catalog_items_write on public.tuition_catalog_items
  for all
  using (has_permission('finance.manage') or has_role('CEO') or has_role('FOUNDER'))
  with check (has_permission('finance.manage') or has_role('CEO') or has_role('FOUNDER'));

drop policy if exists tuition_package_items_read on public.tuition_package_items;
create policy tuition_package_items_read on public.tuition_package_items
  for select using (
    has_permission('finance.view') or has_permission('finance.manage')
    or has_role('CEO') or has_role('FOUNDER')
  );

drop policy if exists tuition_package_items_write on public.tuition_package_items;
create policy tuition_package_items_write on public.tuition_package_items
  for all
  using (has_permission('finance.manage') or has_role('CEO') or has_role('FOUNDER'))
  with check (has_permission('finance.manage') or has_role('CEO') or has_role('FOUNDER'));

-- Note both USING and WITH CHECK. An UPDATE policy with only USING matches zero
-- rows and reports success — that is exactly how migration 235's schools bug
-- behaved, and it is not being repeated here.
drop policy if exists tuition_school_prices_staff on public.tuition_school_prices;
create policy tuition_school_prices_staff on public.tuition_school_prices
  for all
  using (can_access_school(school_id))
  with check (can_access_school(school_id));

drop policy if exists interschool_tuition_charges_staff on public.interschool_tuition_charges;
create policy interschool_tuition_charges_staff on public.interschool_tuition_charges
  for all
  using (can_access_school(owing_school_id) or can_access_school(owed_school_id))
  with check (can_access_school(owing_school_id) or can_access_school(owed_school_id));

-- ---------------------------------------------------------------------------
-- 5. Seed the catalog
-- ---------------------------------------------------------------------------

insert into public.tuition_catalog_items
  (item_code, display_name, item_kind, provider_school_id, description, sort_order)
select v.item_code, v.display_name, v.item_kind, s.id, v.description, v.sort_order
from (values
  -- The Academy Virtual — foundational classes. All part of the full school
  -- program, and each also available a la carte as a class or 1:1.
  ('virtual_lit_lab',              'Lit Lab',             'class', 'The Academy Virtual', 'Foundational class',  10),
  ('virtual_digit_lab',            'Digit Lab',           'class', 'The Academy Virtual', 'Foundational class',  20),
  ('virtual_earthology',           'Earthology',          'class', 'The Academy Virtual', 'Foundational class',  30),
  ('virtual_structured_literacy',  'Structured Literacy', 'class', 'The Academy Virtual', 'Foundational class',  40),

  -- The Academy High School — the package, then what it contains.
  ('hs_experience',                'The HS Experience',   'package', 'The Academy HS', 'Includes Life Lab, Entrepreneurship and Earth Lab', 100),
  ('hs_life_lab',                  'Life Lab',            'class',   'The Academy HS', 'Part of The HS Experience; also available a la carte as a class', 110),
  ('hs_entrepreneurship',          'Entrepreneurship',    'class',   'The Academy HS', 'Part of The HS Experience; also available a la carte as a class', 120),
  ('hs_earth_lab',                 'Earth Lab',           'class',   'The Academy HS', 'Part of The HS Experience; also available a la carte as a class', 130),

  -- High school supplemental classes.
  ('hs_life_math',                 'Life Math',           'class', 'The Academy HS', 'Supplemental class', 200),
  ('hs_structured_literacy',       'Structured Literacy', 'class', 'The Academy HS', 'Supplemental class', 210)
) as v(item_code, display_name, item_kind, school_name, description, sort_order)
join public.schools s on s.name = v.school_name
on conflict (item_code) do nothing;

-- The HS Experience contains three classes.
insert into public.tuition_package_items (package_item_id, member_item_id, sort_order)
select p.id, m.id, m.sort_order
from public.tuition_catalog_items p
join public.tuition_catalog_items m
  on m.item_code in ('hs_life_lab','hs_entrepreneurship','hs_earth_lab')
where p.item_code = 'hs_experience'
on conflict (package_item_id, member_item_id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Seed the price rows, unpriced
-- ---------------------------------------------------------------------------
--
-- Virtual and HS get their own items. FL and GA get both sets, because their
-- students take Virtual and HS classes — those rows are what will accrue as
-- tuition owed. Every amount is NULL until a human sets it.

insert into public.tuition_school_prices (school_id, catalog_item_id, one_to_one_amount, notes)
select s.id, ci.id, null,
  case
    when s.id = ci.provider_school_id then 'Billed to the family.'
    else 'Owed by ' || s.name || ' to ' || ps.name || '. Not billed to the family.'
  end
from public.schools s
join public.tuition_catalog_items ci on true
join public.schools ps on ps.id = ci.provider_school_id
where s.name in ('The Academy FL','The Academy GA','The Academy HS','The Academy Virtual')
  and (
    -- a school always prices its own items
    s.id = ci.provider_school_id
    -- and the two campuses price everything, because they consume both programs
    or s.name in ('The Academy FL','The Academy GA')
  )
on conflict (school_id, catalog_item_id) do nothing;

commit;

-- ---------------------------------------------------------------------------
-- What you now have to fill in.
-- ---------------------------------------------------------------------------
select
  s.name                                       as school,
  ps.name                                      as provided_by,
  case when s.id = ci.provider_school_id
       then 'bill the family'
       else 'owed to ' || ps.name end          as who_pays,
  ci.display_name                              as item,
  ci.item_kind                                 as kind,
  tsp.standard_amount,
  tsp.one_to_one_amount
from public.tuition_school_prices tsp
join public.schools s               on s.id  = tsp.school_id
join public.tuition_catalog_items ci on ci.id = tsp.catalog_item_id
join public.schools ps              on ps.id = ci.provider_school_id
order by s.name, ci.sort_order;
