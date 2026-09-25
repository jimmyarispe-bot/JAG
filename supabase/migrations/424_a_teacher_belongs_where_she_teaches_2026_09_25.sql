-- A TEACHER BELONGS WHERE SHE TEACHES - 25 September 2026
--
-- CORRECTING MIGRATION 423, WHICH I KEYED WRONG.
--
-- 423 gave each teacher a user_schools row for employees.school_id - their
-- EMPLOYMENT campus. Renee is filed at The Academy HS and teaches Structured
-- Literacy under The Academy Virtual, so she could see a school with none of
-- her classes in it. Her timesheet went from an error to something worse: an
-- empty week, no error, $0.00, and a screen inviting her to submit it.
--
-- Jimmy, 25 September: "why isn't the person the key and not campus. we have
-- teachers teaching in multiple schools."
--
-- He is right, and migration 379 already said so in its own header:
--
--     Craig is an employee of The Academy HS and teaches here anyway;
--     pay follows the course's school, not the teacher's.
--
-- Six of the eight HS teachers are also on Virtual's payroll. Employment
-- campus was never going to describe them.
--
-- SO THE CAMPUS IS DERIVED FROM TEACHING, two ways, because both are real:
--
--   1. course_sections.instructor_employee_id - the sections she owns
--   2. instructional_sessions.instructor_employee_id - sessions she actually
--      taught, which is how cover works: a guest teacher at the other campus
--      must be able to price the class she covered
--
-- 423's rows are LEFT IN PLACE. They are additive, they are not wrong about
-- employment, and removing a teacher's access to her own campus mid-week to
-- tidy a model is not worth the risk. This adds what was missing.
--
-- THIS IS NOT THE END STATE. The deeper fix is that a pay calculation about a
-- person should not be gated on campus at all - schools RLS should let a
-- teacher read a school she teaches a course at, the way
-- teaches_course_section() already resolves sessions since migration 403.
-- That is a policy change and a separate decision. This migration makes the
-- data agree with the model that already exists.

begin;

insert into user_schools (user_id, school_id)
select distinct e.user_id, c.school_id
  from public.employees e
  join public.course_sections cs on cs.instructor_employee_id = e.id
  join public.courses c          on c.id = cs.course_id
 where e.user_id is not null
   and e.employment_status = 'active'
on conflict (user_id, school_id) do nothing;

insert into user_schools (user_id, school_id)
select distinct e.user_id, c.school_id
  from public.employees e
  join public.instructional_sessions sess on sess.instructor_employee_id = e.id
  join public.course_sections cs on cs.id = sess.course_section_id
  join public.courses c          on c.id = cs.course_id
 where e.user_id is not null
   and e.employment_status = 'active'
on conflict (user_id, school_id) do nothing;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- One row per teacher. teaches_at is where her courses live; can_see is what
-- she is now permitted to read. Every campus in teaches_at must appear in
-- can_see, or her timesheet will still drop those classes silently.
--
-- Expect Renee, Craig, Marnie and Peter to show BOTH campuses.
with teaches as (
  select distinct e.user_id, c.school_id
    from public.employees e
    join public.course_sections cs on cs.instructor_employee_id = e.id
    join public.courses c on c.id = cs.course_id
   where e.employment_status = 'active' and e.employee_type = 'teacher'
)
select
  pu.full_name,
  (select string_agg(distinct s.name, ', ' order by s.name)
     from teaches t join public.schools s on s.id = t.school_id
    where t.user_id = pu.id)                       as teaches_at,
  (select string_agg(distinct s.name, ', ' order by s.name)
     from user_schools us join public.schools s on s.id = us.school_id
    where us.user_id = pu.id)                      as can_see,
  not exists (
    select 1 from teaches t
     where t.user_id = pu.id
       and not exists (select 1 from user_schools us
                        where us.user_id = pu.id and us.school_id = t.school_id)
  )                                                as every_campus_covered
from public.employees e
join public.users pu on pu.id = e.user_id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
order by every_campus_covered, pu.full_name;
