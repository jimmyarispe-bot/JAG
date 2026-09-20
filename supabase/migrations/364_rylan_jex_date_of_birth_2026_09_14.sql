-- ===========================================================================
-- RYLAN JEX'S DATE OF BIRTH
-- 14 September 2026
-- ===========================================================================
--
-- Rylan Jex, The Academy GA, student number 000025, has had no date of birth
-- since his record was created.
--
-- WHERE THIS DATE COMES FROM, AND WHY IT WAS NOT APPLIED AUTOMATICALLY
--
-- An admissions lead whose student name matches his carries 2014-11-18. That
-- is a NAME MATCH, not an identification: nothing in the data ties the lead to
-- the student — no shared guardian email, no shared phone, no student id on
-- the lead. Two families can share a name, and a lead can be a sibling, a
-- cousin, or a second inquiry from a different household.
--
-- A date of birth is not cosmetic. It sets grade placement and it goes on
-- state scholarship filings; for Step Up and GOAL it is part of what the award
-- is issued against. A wrong one looks correct forever and nobody re-checks
-- it, which is worse than a blank that makes somebody ask.
--
-- So it was left alone until a person who knows the family confirmed it.
-- Jimmy confirmed on 14 September 2026 that the lead and the student are the
-- same child. That confirmation — not the name match — is the authority for
-- this write.
--
-- WHAT THIS DOES NOT DO
--
-- Rylan still has NO GRADE LEVEL, and this migration does not invent one. He
-- stays on the January parent list for that field alone; see
-- claude/january-parent-data-refresh.md. The ten students whose date of birth
-- exists nowhere in the system are untouched here — only their families have
-- those dates.
--
-- SAFETY
--
-- The update is pinned on four facts at once: campus, student number, first
-- name and last name. Any one of them wrong and it matches nothing rather than
-- writing a date onto a different child. It also refuses to overwrite a date
-- that is already there, so a second run changes nothing.
-- ===========================================================================

begin;

update public.students s
   set date_of_birth = date '2014-11-18',
       updated_at    = now()
  from public.schools sc
 where sc.id = s.school_id
   and sc.name = 'The Academy GA'
   and s.student_number = '000025'
   and lower(s.first_name) = 'rylan'
   and lower(s.last_name)  = 'jex'
   and s.date_of_birth is null;

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. Rylan himself. EXPECT one row, date_of_birth 2014-11-18, grade still null.
select
  '1. rylan' as check,
  sc.name || ' / ' || s.first_name || ' ' || s.last_name || ' / #' || s.student_number as detail,
  'dob ' || coalesce(s.date_of_birth::text, 'STILL NULL — the update matched nothing')
    || ' / grade ' || coalesce(s.grade_level, 'null') as extra
from public.students s
join public.schools sc on sc.id = s.school_id
where s.student_number = '000025'
  and sc.name = 'The Academy GA'

union all

-- 2. Nobody else was touched. EXPECT exactly one row per campus count, and the
--    total to have gone down by one against the eleven from 363.
select
  '2. still missing',
  sc.name,
  count(*) filter (where s.date_of_birth is null)::text || ' no date of birth, '
    || count(*) filter (where s.grade_level is null)::text || ' no grade level'
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active' and s.enrollment_status = 'enrolled'
  and (s.date_of_birth is null or s.grade_level is null)
group by sc.name

union all

-- 3. The January list as it now stands. EXPECT ten with no date of birth
--    (Wren Peters among them by Jimmy's instruction) plus Rylan for grade only.
select
  '3. january list',
  sc.name || ' / ' || s.first_name || ' ' || s.last_name,
  case
    when s.date_of_birth is null and s.grade_level is null then 'no date of birth AND no grade'
    when s.date_of_birth is null then 'no date of birth'
    else 'no grade level'
  end
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active' and s.enrollment_status = 'enrolled'
  and (s.date_of_birth is null or s.grade_level is null)

order by 1, 2;
