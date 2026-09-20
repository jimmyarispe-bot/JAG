-- 272: backfill sis_enrollments for students who have none.
--
-- 91 of 93 active students had no enrolment row. The cause was not the
-- conversion bug — it was that JAG had no 2026-2027 school year until migration
-- 261, and both the import path and the admissions conversion look up a year
-- and SKIP the row rather than fail when there isn't one. Two independent
-- silent-skip paths, one missing row upstream.
--
-- The people directory, the family profile and the student profile all read
-- this table. A student with no row does not appear to be enrolled anywhere.
--
-- Now that a valid year exists, the rows can be written.
--
-- WHAT THIS WILL NOT DO: guess a program. A student whose `program` is null or
-- not a canonical code is REPORTED, not defaulted. sis_enrollments.program has
-- a CHECK constraint, and picking 'academy_virtual' for a child who attends a
-- campus would put a wrong answer somewhere it looks authoritative.
--
-- IDEMPOTENT. Only students with no row for that year are touched.

begin;

-- The current year per school. A school with none is reported below rather
-- than silently contributing nothing.
create temp table current_year on commit drop as
select sc.id as school_id, sc.name as school_name, sy.id as year_id, sy.name as year_name
from public.schools sc
join public.school_years sy on sy.school_id = sc.id and sy.is_current;

create temp table candidates on commit drop as
select s.id as student_id,
       s.first_name || ' ' || s.last_name as student,
       cy.school_name,
       cy.year_id,
       cy.year_name,
       s.program,
       coalesce(s.enrollment_start_date, current_date) as start_date
from public.students s
join current_year cy on cy.school_id = s.school_id
where s.status = 'active'
  and not exists (
    select 1 from public.sis_enrollments e
    where e.student_id = s.id and e.school_year_id = cy.year_id
  );

-- Only students whose program is a code sis_enrollments will actually accept.
create temp table loadable on commit drop as
select * from candidates
where program in ('academy_fl_campus','academy_fl_virtual','academy_ga_campus',
                  'academy_ga_hybrid','academy_hs','academy_virtual');

insert into public.sis_enrollments
  (student_id, school_year_id, program, enrollment_status, enrolled_at, is_primary)
select l.student_id, l.year_id, l.program, 'enrolled', l.start_date, true
from loadable l
-- A student may already hold a primary enrolment for that year under another
-- program. The partial unique index would reject a second one.
where not exists (
  select 1 from public.sis_enrollments e
  where e.student_id = l.student_id
    and e.school_year_id = l.year_id
    and e.is_primary
);

-- 1. Students still without an enrolment row, and why.
--
--    A null or non-canonical program is a real data gap: nothing in JAG records
--    which programme that child is actually in. Worth fixing, but not by
--    guessing here.
select 'NO PROGRAM - not loaded' as problem,
       c.student, c.school_name,
       coalesce(c.program, '-- null --') as program
from candidates c
where c.student_id not in (select student_id from loadable)
order by c.school_name, c.student;

-- 2. Schools with no current school year. Should be empty after 261.
select 'SCHOOL HAS NO CURRENT YEAR' as problem, sc.name
from public.schools sc
where not exists (select 1 from current_year cy where cy.school_id = sc.id);

-- 3. Where every school now stands.
select sc.name as school,
       count(*) filter (where s.status = 'active') as active_students,
       count(*) filter (
         where s.status = 'active'
           and exists (select 1 from public.sis_enrollments e where e.student_id = s.id)
       ) as with_enrolment,
       count(*) filter (
         where s.status = 'active'
           and not exists (select 1 from public.sis_enrollments e where e.student_id = s.id)
       ) as still_missing
from public.students s
join public.schools sc on sc.id = s.school_id
group by sc.name
order by sc.name;

commit;
