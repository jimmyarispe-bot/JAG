-- 256: The Academy GA — student names corrected to the state roster spelling.
--
-- The state roster is the naming standard (Jimmy, 2026-09-05). JAG currently
-- holds "Brady Zaid" with the name reversed, "Winiacrzyk" with the letters
-- swapped, "Britelle" with one t and "Oliva" missing an i. A family whose child
-- is billed under a reversed or misspelled name has a fair complaint, and a
-- scholarship reconciliation that matches on name silently drops them.
--
-- Letters come from the roster. CAPITALIZATION does not: the roster stores
-- "Mccaskill" and "Mchoney" because its system upper-cases the first letter and
-- lower-cases the rest. That is not how the families spell their names, so this
-- writes McCaskill and McHoney.
--
-- v2. The first version aborted if any probe matched zero students, and it did:
-- Nolan Riley has no record at The Academy GA. That is a real finding, not a
-- reason to block eighteen correct renames. Zero matches is now REPORTED.
-- Two or more still aborts — that would rename the wrong child.
--
-- FOUR NAMES ARE DELIBERATELY NOT TOUCHED. They are questions, not misspellings,
-- and they are listed at the end of the output.

begin;

create temp table name_map (
  probe        text primary key,  -- first 4 letters of the surname JAG holds
  correct_first text not null,
  correct_last  text not null
) on commit drop;

insert into name_map (probe, correct_first, correct_last) values
  ('mcho', 'Abigail',   'McHoney'),
  ('mcca', 'Braydon',   'McCaskill'),
  ('neas', 'Dante',     'Neason'),
  ('pere', 'Emiliano',  'Perez'),
  ('ross', 'Hailey',    'Rosser'),
  ('madd', 'Kaelyn',    'Maddox'),
  ('brya', 'Liam',      'Bryant'),
  ('corl', 'Madison',   'Corley'),
  ('gool', 'Mason',     'Goolsby'),
  ('wils', 'Nash',      'Wilson'),
  ('wini', 'Oliver',    'Winiarczyk'),
  ('brit', 'Parker',    'Brittelle'),
  ('jex',  'Rylan',     'Jex'),
  ('john', 'Talia',     'Johnson'),
  ('seng', 'Tijan',     'Senghore'),
  ('ingr', 'Gabrielle', 'Ingram'),
  ('rile', 'Nolan',     'Riley'),
  -- Stored reversed in JAG: first_name "Brady", last_name "Zaid".
  ('zaid', 'Zaid',      'Brady'),
  -- Not on the state roster (no scholarship, full pay). Her own schedule
  -- spells it Olivia; JAG has "Oliva".
  ('bour', 'Olivia',    'Bourgeois');

create temp table ga_students on commit drop as
  select s.id, s.first_name, s.last_name
  from public.students s
  join public.schools sc on sc.id = s.school_id
  where sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%';

-- Two or more matches means the probe is not specific enough, and applying it
-- would rename a child who is not the one intended. That still stops everything.
do $$
declare bad text;
begin
  select string_agg(probe || ' -> ' || cnt::text || ' students', ', ')
    into bad
  from (
    select m.probe, count(g.id) as cnt
    from name_map m
    left join ga_students g on left(lower(g.last_name), 4) = m.probe
    group by m.probe
  ) c
  where c.cnt > 1;

  if bad is not null then
    raise exception 'Aborting: a probe matched more than one GA student and would rename the wrong child: %', bad;
  end if;
end $$;

create temp table applied on commit drop as
  select g.id,
         g.first_name || ' ' || g.last_name as was,
         m.correct_first || ' ' || m.correct_last as now
  from ga_students g
  join name_map m on left(lower(g.last_name), 4) = m.probe;

update public.students s
   set first_name = m.correct_first,
       last_name  = m.correct_last
  from name_map m
 where s.id in (select id from ga_students)
   and left(lower(s.last_name), 4) = m.probe
   and (s.first_name <> m.correct_first or s.last_name <> m.correct_last);

-- 1. What changed, and what was already correct.
select case when was = now then 'already correct' else 'RENAMED' end as result,
       was, now
from applied
order by 1 desc, 2;

-- 2. On the roster, no student record at The Academy GA. Nothing can bill these
--    children, and no schedule can be generated for them.
select 'NO RECORD AT GA' as result,
       m.correct_first || ' ' || m.correct_last as student
from name_map m
where not exists (
  select 1 from ga_students g where left(lower(g.last_name), 4) = m.probe
)
order by 2;

-- 3. The four that are questions, not misspellings.
select * from (values
  ('Israel Cooks',
   'Roster says Israel. Every schedule says Josiah. Award matches exactly (10,712). Same child under two names, or two children?'),
  ('Santiago Hernandez Alvarado',
   'Roster carries Hernandez; the schedule and JAG do not. Second surname or middle name? Which belongs in last_name?'),
  ('Andrew Matthew Ribeiro',
   'Roster carries the middle name Matthew. JAG has no middle-name field, so this is Andrew Ribeiro unless you want it in first_name.'),
  ('Christopher Mungin / Elida Montano',
   'You have confirmed both are not enrolled 26-27. Migration 258 archives them.')
) as q(name, question);

commit;
