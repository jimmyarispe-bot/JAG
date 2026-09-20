-- 391_the_two_who_were_linked_by_hand_2026_09_20.sql
--
-- WHAT THIS FIXES
--
-- Nolan Riley and Areli Romero are students whose admissions_lead_id is set,
-- but who have NO row in sis_admissions_conversions. They were tied to their
-- leads by hand-written SQL - migrations 259 and 313 - months before the
-- conversion pipeline could run at all. The column was set; nothing recorded
-- that it happened.
--
-- That matters because a student's Admissions, Documents and Scholarships tabs
-- load through getStudentConversion(), which reads THIS table, not the column.
-- For those two children the tabs are blank and will stay blank.
--
-- On 20 September 2026 the bridge went live and four families converted
-- properly. These two are the remainder: real students, correctly linked,
-- missing only the record of how they got here.
--
-- WHAT THIS DOES NOT DO
--
-- It creates no students, no families, no guardians and no enrolments - all of
-- those already exist for both children. It writes the missing history row and
-- nothing else. No money moves.
--
-- THE SNAPSHOT SAYS BACKFILLED, ON PURPOSE
--
-- These conversions did not happen tonight and did not happen through the
-- pipeline. Stamping them 'manual' with no mark would make the table claim
-- something untrue about its own history. backfilled_at_2026_09_20 and
-- linked_by_hand let anyone reading later tell a real conversion from a
-- reconstructed one.
--
-- IT IS DRIVEN BY A QUERY, NOT BY TWO IDS
--
-- Naming the two ids would be shorter and would silently do nothing if an id
-- were wrong. This inserts for EVERY student who has a lead link and no
-- conversion row, so it is correct whether that set is two rows or twenty, and
-- the report below states how many it touched.

begin;

insert into public.sis_admissions_conversions (
  application_id,
  lead_id,
  student_id,
  family_id,
  converted_by,
  conversion_source,
  converted_at,
  snapshot
)
select
  null,
  s.admissions_lead_id,
  s.id,
  s.family_id,
  null,
  'manual',
  coalesce(s.created_at, now()),
  jsonb_build_object(
    'lead_id', s.admissions_lead_id,
    'application_id', null,
    'linked_existing_student', true,
    'linked_by_hand', true,
    'backfilled_at_2026_09_20', true,
    'note', 'Lead link predates the conversion pipeline. Reconstructed, not observed.'
  )
from public.students s
where s.admissions_lead_id is not null
  and not exists (
    select 1
      from public.sis_admissions_conversions c
     where c.student_id = s.id
  )
on conflict (student_id) do nothing;

commit;

-- =========================================================================
-- THE REPORT
--
-- Run this after. Every student with a lead link should now read
-- 'conversion recorded'. A remaining '>>> NO CONVERSION ROW <<<' means the
-- insert was refused for that row and the tabs are still blank.
-- =========================================================================

select
  s.first_name || ' ' || s.last_name            as student,
  sch.name                                      as campus,
  case when c.id is null
       then '>>> NO CONVERSION ROW <<<'
       else 'conversion recorded' end           as conversion,
  coalesce(c.snapshot ->> 'linked_by_hand', 'no')  as reconstructed,
  c.converted_at
from public.students s
left join public.sis_admissions_conversions c on c.student_id = s.id
left join public.schools sch on sch.id = s.school_id
where s.admissions_lead_id is not null
order by c.converted_at desc nulls last, s.last_name;
