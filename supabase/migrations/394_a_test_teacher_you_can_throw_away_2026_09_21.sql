-- 394_a_test_teacher_you_can_throw_away_2026_09_21.sql
--
-- WHY THIS EXISTS
--
-- The weekly submission screen shipped on 20 September and nobody can test the
-- one part that matters. Pressing Submit on a real teacher FREEZES their real
-- week, and by design that week does not reopen - so every other way of testing
-- gets you right up to the button that writes money and then has to stop.
--
-- This creates a teacher who is not a person, teaching a course that is not a
-- course, to children who are not children, so the whole flow - including
-- Submit - can be walked and then deleted.
--
-- EVERYTHING IS PREFIXED ZZZ TEST. If any of it ever shows up somewhere real,
-- the name says what it is at a glance.
--
-- THE STUDENTS ARE ARCHIVED ON PURPOSE, AND THAT IS NOT A CONTRADICTION.
-- computeClassPay counts rows in student_enrollments and never reads the
-- students table at all, so an archived child still prices a class. Meanwhile
-- every roster query in this platform filters students.status = 'active', so
-- these two never appear in a student count. The test gets a real non-zero
-- total; the roster stays at 80.
--
-- WHAT IT DOES POLLUTE, HONESTLY: the test teacher and her five classes WILL
-- appear in computeClassPay for this week, so any network pay total run before
-- the teardown includes roughly $190 that is not owed to anybody. Run 395 when
-- the test is done.

begin;

do $$
declare
  v_school_id     uuid;
  v_year_id       uuid;
  v_employee_id   uuid;
  v_course_id     uuid;
  v_section_id    uuid;
  v_student_a     uuid;
  v_student_b     uuid;
  v_monday        date := date '2026-09-21';
  v_day           date;
  v_i             integer;
begin
  select id into v_school_id from public.schools
   where name ilike '%academy%virtual%' limit 1;
  if v_school_id is null then
    raise exception 'No school named like The Academy Virtual. Nothing created.';
  end if;

  select id into v_year_id from public.school_years
   where school_id = v_school_id and is_current is true limit 1;
  if v_year_id is null then
    select id into v_year_id from public.school_years
     where school_id = v_school_id order by start_date desc limit 1;
  end if;
  if v_year_id is null then
    raise exception 'The Academy Virtual has no school year. Nothing created.';
  end if;

  -- The teacher. user_id stays NULL here: only an auth account can fill it, and
  -- SQL cannot create one. Migration 396 links it once the account exists.
  -- employee_number is unique per school and 375 uses First.Last, so this one
  -- sorts to the bottom of any list and reads as what it is.
  insert into public.employees
    (school_id, employee_number, employee_type, employment_status)
  values (v_school_id, 'ZZZ.Test.Teacher', 'teacher', 'active')
  returning id into v_employee_id;

  insert into public.employee_profiles
    (employee_id, first_name, last_name, display_name, contact_email, job_title)
  values
    (v_employee_id, 'ZZZ TEST', 'Teacher', 'ZZZ TEST Teacher',
     'zzz.test.teacher@theacademyvirtual.org', 'Teacher');

  -- The course, and a rate for it. $20 first student plus $5 each after, which
  -- is the Earth Lab shape - so the arithmetic on screen is checkable by hand.
  insert into public.courses (school_id, code, name, status)
  values (v_school_id, 'ZZZTEST', 'ZZZ TEST Course', 'active')
  returning id into v_course_id;

  insert into public.class_pay_rates
    (course_id, base_first_student, per_additional_student,
     guest_base_first_student, effective_from)
  values (v_course_id, 20.00, 5.00, 20.00, v_monday);

  insert into public.course_sections
    (course_id, school_year_id, section_code, instructor_employee_id,
     start_time_et, status)
  values (v_course_id, v_year_id, 'ZZZ-TEST-01', v_employee_id, '10:00', 'open')
  returning id into v_section_id;

  -- Two children who are not children. Archived, so no roster query sees them.
  insert into public.students
    (school_id, first_name, last_name, student_number, status, enrollment_status)
  values (v_school_id, 'ZZZTEST', 'StudentOne', 'ZZZ001', 'archived', 'withdrawn')
  returning id into v_student_a;

  insert into public.students
    (school_id, first_name, last_name, student_number, status, enrollment_status)
  values (v_school_id, 'ZZZTEST', 'StudentTwo', 'ZZZ002', 'archived', 'withdrawn')
  returning id into v_student_b;

  -- Their enrolments DO count - that is the whole trick. Two children on the
  -- roster means 20.00 + 5.00 = 25.00 a class.
  insert into public.student_enrollments
    (student_id, course_section_id, school_year_id, enrollment_status,
     enrolled_at, attends_days, campus_student)
  values
    (v_student_a, v_section_id, v_year_id, 'enrolled', v_monday, 'M-F', false),
    (v_student_b, v_section_id, v_year_id, 'enrolled', v_monday, 'M-F', false);

  -- Five classes, Monday to Friday of go-live week, 10:00 Eastern.
  for v_i in 0..4 loop
    v_day := v_monday + v_i;
    insert into public.instructional_sessions
      (course_section_id, instructor_employee_id, scheduled_start, scheduled_end,
       session_status, session_type)
    values
      (v_section_id, v_employee_id,
       (v_day::text || ' 10:00:00-04')::timestamptz,
       (v_day::text || ' 11:00:00-04')::timestamptz,
       'scheduled', 'instruction');
  end loop;

  raise notice 'ZZZ TEST teacher employee_id: %', v_employee_id;
end $$;

commit;

-- =========================================================================
-- THE REPORT
--
-- Five classes at 25.00 each = 125.00 for the week. Every line should read
-- 'yes' and the employee_id is what you need for migration 396.
-- =========================================================================

select
  p.first_name || ' ' || p.last_name                           as teacher,
  p.employee_id::text                                          as employee_id_for_396,
  (select count(*) from public.course_sections cs
    where cs.instructor_employee_id = p.employee_id)           as sections,
  (select count(*) from public.instructional_sessions i
    where i.instructor_employee_id = p.employee_id)            as classes,
  (select count(*) from public.student_enrollments se
     join public.course_sections cs on cs.id = se.course_section_id
    where cs.instructor_employee_id = p.employee_id
      and se.enrollment_status = 'enrolled')                   as children_on_roster,
  (select to_char(r.base_first_student, 'FM999.00') || ' + ' ||
          to_char(r.per_additional_student, 'FM999.00')
     from public.class_pay_rates r
     join public.courses c on c.id = r.course_id
    where c.name = 'ZZZ TEST Course' limit 1)                  as rate,
  case when e.user_id is null
       then 'no login yet - create the auth account, then run 396'
       else 'linked' end                                       as login
from public.employee_profiles p
join public.employees e on e.id = p.employee_id
where p.first_name = 'ZZZ TEST';
