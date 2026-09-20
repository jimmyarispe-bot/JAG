-- 250_virtual_full_program_2026_09_04.sql
--
-- "The Academy Virtual — Full School Program": one priced item that contains
-- the four foundational classes, the same shape as The HS Experience.
--
-- Why a package and not just a fifth class: a family on the full program holds
-- Lit Lab, Digit Lab, Earthology and Structured Literacy. Recording that as one
-- opaque line loses which classes the student is actually in, and recording it
-- as four separate charges loses the fact that they bought a program. The
-- package plus tuition_package_items keeps both true at once — which is also
-- what lets a bundle discount be a rule about components rather than a note
-- somebody wrote on an account.
--
-- The four classes stay in the catalog exactly as they are. They are still
-- available a la carte and still available 1:1, which is the whole point of
-- keeping them as items in their own right.
--
-- SAFE TO RE-RUN. Every insert is guarded by on conflict do nothing.

begin;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.schools where name = 'The Academy Virtual';
  if v_n <> 1 then
    raise exception
      'Expected exactly 1 school named "The Academy Virtual", found %. Run: select id, name from public.schools;', v_n;
  end if;

  select count(*) into v_n
  from public.tuition_catalog_items
  where item_code in ('virtual_lit_lab','virtual_digit_lab','virtual_earthology','virtual_structured_literacy');
  if v_n <> 4 then
    raise exception
      'Expected the 4 Virtual foundational classes from migration 249, found %. Run 249 first.', v_n;
  end if;
end $$;

-- 1. The package itself. sort_order 5 puts it above its members, so the screen
--    reads program-first the way The HS Experience does.
insert into public.tuition_catalog_items
  (item_code, display_name, item_kind, provider_school_id, description, sort_order)
select
  'virtual_full_program',
  'The Academy Virtual — Full School Program',
  'package',
  s.id,
  'Includes Lit Lab, Digit Lab, Earthology and Structured Literacy',
  5
from public.schools s
where s.name = 'The Academy Virtual'
on conflict (item_code) do nothing;

-- 2. What it contains.
insert into public.tuition_package_items (package_item_id, member_item_id, sort_order)
select p.id, m.id, m.sort_order
from public.tuition_catalog_items p
join public.tuition_catalog_items m
  on m.item_code in (
    'virtual_lit_lab',
    'virtual_digit_lab',
    'virtual_earthology',
    'virtual_structured_literacy'
  )
where p.item_code = 'virtual_full_program'
on conflict (package_item_id, member_item_id) do nothing;

-- 3. Price rows, unpriced.
--
--    The Academy Virtual prices it for its own families. FL and GA get a row
--    too, because their students take the Virtual program and that tuition is
--    owed to Virtual rather than billed to the family. Same rule migration 249
--    used; repeated here rather than inferred, so the two files agree.
insert into public.tuition_school_prices (school_id, catalog_item_id, notes)
select
  s.id,
  ci.id,
  case
    when s.id = ci.provider_school_id then 'Billed to the family.'
    else 'Owed by ' || s.name || ' to ' || ps.name || '. Not billed to the family.'
  end
from public.schools s
join public.tuition_catalog_items ci on ci.item_code = 'virtual_full_program'
join public.schools ps on ps.id = ci.provider_school_id
where s.name in ('The Academy Virtual','The Academy FL','The Academy GA')
on conflict (school_id, catalog_item_id) do nothing;

commit;

-- The two packages and what each contains.
select
  ps.name            as provided_by,
  p.display_name     as package,
  m.display_name     as includes,
  m.item_code
from public.tuition_catalog_items p
join public.schools ps                on ps.id = p.provider_school_id
join public.tuition_package_items pi  on pi.package_item_id = p.id
join public.tuition_catalog_items m   on m.id = pi.member_item_id
where p.item_kind = 'package'
order by ps.name, p.sort_order, m.sort_order;
