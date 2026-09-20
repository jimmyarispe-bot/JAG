-- Carwyn Williams.
--
-- The last unidentified child on the Fall 2026-2027 Virtual schedule. His line
-- on the grid reads "Carwyn 5:30 Math 8x" - a first name and nothing else, which
-- is why the roster import skipped him: one word is not a name to match on, and
-- guessing would have been worse than leaving a gap.
--
-- From his Admissions/Registration Application for The Academy Virtual:
--
--   Carwyn Williams, born 11 August 2014, 6th grade
--   Start date 24 June 2026
--   Program: Tutoring - Math, and ONLY that
--   Guardian: Sheena Williams, ho.sheena@gmail.com, 902-932-2832
--   101-5524 Heatherwood Crt, Halifax, Nova Scotia, B3K 5N7, CANADA
--   No scholarship
--
-- HE IS IN CANADA. Nova Scotia is Atlantic Time, one hour ahead of Eastern. His
-- 17:00 ET class is 18:00 for him. Nothing here depends on that, but a reminder
-- sent "at 5pm" would reach him at the wrong hour, and no part of this platform
-- currently knows a student can be in another timezone.
--
-- TUTORING ONLY, so exactly one enrolment - Jessica Vedder's 17:00 Tutoring,
-- section VEDDER-1700. Not a campus child, so no Friday-afternoon rule.
--
-- THE TIME ON THE GRID DOES NOT MATCH THE SECTION. The cell sits in the 5:00
-- row but reads "5:30". The section was created 17:00-17:50 from the row it was
-- printed in. If Carwyn actually meets at 5:30 the section's hours are wrong by
-- half an hour - which changes nothing about pay, since tutoring is a flat
-- 20.00 per session, but does make a calendar lie to a family in another
-- country. Worth a look at the grid rather than a guess from here.
--
-- WHAT IS NOT CAPTURED. His psychological report (CarWil_-_February_2025.pdf)
-- came attached to the application, as did a separate password document. The
-- report is not loaded here: it is sensitive, it belongs behind the same
-- document handling as an IEP, and there is still no path in this platform for
-- a document that arrives by email. That is the fourth time this week the same
-- gap has decided what a record does not contain.
--
-- His guardian cannot be linked either: student_family_link needs a row in
-- public.users, which references auth.users, so an account cannot be made in
-- SQL. Sheena Williams exists on the application and nowhere in the platform.

begin;

insert into public.students
  (school_id, first_name, last_name, date_of_birth, grade_level, status,
   enrollment_status, lifecycle_stage, school_year_id, student_number)
select s.id, 'Carwyn', 'Williams', date '2014-08-11', '6th_grade', 'active',
       'enrolled', 'active', sy.id,
       public.generate_student_number(s.id)
from public.schools s
left join public.school_years sy
  on sy.school_id = s.id and sy.is_current
where lower(trim(s.name)) = 'the academy virtual'
  and not exists (
    select 1 from public.students x
    where lower(trim(x.first_name)) = 'carwyn'
      and lower(trim(x.last_name))  = 'williams'
  );

insert into public.student_enrollments
  (student_id, course_section_id, school_year_id, enrollment_status,
   enrolled_at, attends_days, campus_student)
select st.id, sec.id, sec.school_year_id, 'enrolled',
       timestamptz '2026-08-10 00:00:00-04', 'M-F', false
from public.students st
join public.course_sections sec
  on sec.section_code = 'VEDDER-1700'
 and sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
where lower(trim(st.first_name)) = 'carwyn'
  and lower(trim(st.last_name))  = 'williams'
on conflict (student_id, course_section_id) do update
  set enrollment_status = 'enrolled',
      attends_days      = 'M-F',
      campus_student    = false,
      updated_at        = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- One student, one enrolment. Carwyn must show a six-digit student number, a
-- date of birth, and Jessica Vedder's 17:00 Tutoring. If the enrolment row is
-- missing, section VEDDER-1700 does not exist - run the sections migration
-- first.

select st.first_name, st.last_name, st.date_of_birth, st.grade_level,
       st.student_number, st.enrollment_status,
       c.name as course, p.display_name as teacher,
       to_char(sec.start_time_et,'HH24:MI') as starts,
       e.attends_days, e.campus_student
from public.students st
left join public.student_enrollments e on e.student_id = st.id
left join public.course_sections sec on sec.id = e.course_section_id
left join public.courses c on c.id = sec.course_id
left join public.employees emp on emp.id = sec.instructor_employee_id
left join public.employee_profiles p on p.employee_id = emp.id
where lower(trim(st.first_name)) = 'carwyn'
  and lower(trim(st.last_name))  = 'williams';
