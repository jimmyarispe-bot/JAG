-- 258: The Academy GA — archive the students not enrolled for 2026-27.
--
-- Every name here was confirmed by Jimmy across 2026-09-04 and 2026-09-05.
-- Nothing is deleted. This uses the archive path from migration 188:
-- status='archived' with previous_status kept, so any of these can be restored
-- if a family turns out to be returning.
--
-- Scoped to The Academy GA only. A "Davis" or a "Wells" enrolled at another
-- campus is not touched.
--
-- This does NOT abort on a name that is absent — several of these were never in
-- JAG. It reports what it archived and what it could not find, and you should
-- read both lists.

begin;

create temp table not_enrolled (first_probe text, last_probe text, why text) on commit drop;
insert into not_enrolled values
  ('jude',        'mcspa', 'transferred (state roster)'),
  ('joshua',      'davis', 'not a 26-27 student'),
  ('jackson',     'zerch', 'not a 26-27 student'),
  ('aaliyah',     'clink', 'not enrolled 26-27'),
  ('safeeyah',    'clink', 'not enrolled 26-27'),
  ('callen',      'goldi', 'not enrolled 26-27'),
  ('jon',         'wells', 'not enrolled 26-27'),
  ('kennedy',     'bradl', 'not enrolled 26-27'),
  ('khloe',       'olliv', 'not enrolled 26-27'),
  ('zola',        'owens', 'not enrolled 26-27'),
  ('la',          'willi', 'not enrolled 26-27 (La''Marrieon)'),
  ('lionell',     'cox',   'not enrolled 26-27'),
  ('christopher', 'mungi', 'not enrolled 26-27'),
  ('elida',       'monta', 'not enrolled 26-27'),
  ('tori',        'rice',  'not enrolled 26-27');

create temp table ga_students on commit drop as
  select s.id, s.first_name, s.last_name, s.status
  from public.students s
  join public.schools sc on sc.id = s.school_id
  where sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%';

create temp table to_archive on commit drop as
  select distinct g.id, g.first_name || ' ' || g.last_name as student,
         g.status as was_status, n.why
  from ga_students g
  join not_enrolled n
    on lower(g.first_name) like n.first_probe || '%'
   and lower(g.last_name)  like n.last_probe  || '%';

-- A name that matches more than one child means the probe is too loose and this
-- would archive an enrolled student. Stop rather than guess.
do $$
declare dupes text;
begin
  select string_agg(student, ', ')
    into dupes
  from (select student from to_archive group by student having count(*) > 1) d;
  if dupes is not null then
    raise exception 'Aborting: ambiguous match on %', dupes;
  end if;
end $$;

update public.students s
   set previous_status = coalesce(s.previous_status, s.status),
       status          = 'archived',
       archived_at     = now()
  from to_archive t
 where s.id = t.id
   and s.status <> 'archived';

-- Archived.
select 'ARCHIVED' as result, student, was_status, why
from to_archive
order by student;

-- Named above but not present at The Academy GA. Either they were never in JAG,
-- they sit under a different school, or the spelling differs again.
select 'NOT FOUND AT GA' as result,
       initcap(n.first_probe) || ' ' || initcap(n.last_probe) || '...' as searched_for,
       n.why
from not_enrolled n
where not exists (
  select 1 from ga_students g
  where lower(g.first_name) like n.first_probe || '%'
    and lower(g.last_name)  like n.last_probe  || '%'
)
order by 2;

-- Who is left standing at The Academy GA.
--
-- THIS SHOULD BE 19, not 22. The verification after migration 256 showed GA
-- holding 25 students: 19 on the roster, plus the six archived here. The three
-- missing from the 22 are Nolan Riley and Andrew Ribeiro, who have state awards
-- but no student record at all, and Israel/Josiah Cooks, who is an HS student
-- whose schedule was filed in the GA folder.
--
-- 19 means this worked. Create Riley and Ribeiro and GA becomes 21.
select count(*) as active_ga_students_remaining
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
  and s.status = 'active';

commit;
