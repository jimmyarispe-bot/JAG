-- The Fall 2026-2027 Virtual schedule becomes course_sections.
--
-- 41 class slots, 11 teachers, parsed by coordinate from the PDF of 19
-- September 2026 and checked cell by cell against the printed grid.
--
-- COURSE MAPPING, per Jimmy on 19 September:
--   Earthology (AV)                         -> Earthology, the same class
--   Life Lab I / II                         -> one course, two levels
--   Earth Lab I / II                        -> one course, two levels
--   Entrepreneurship I / II / Advanced      -> one course, levels
--   Lit Lab (age 10-11 / 11-12 / 13-14)     -> sections of LitLab
--   Digit Lab (Middle School / 9-11 / 8-10) -> sections of DigitLab
--   SL Tutoring                             -> a section of Tutoring
-- The level or age band is NOT lost: it is kept on the section in
-- meeting_pattern.printed_as, exactly as the grid prints it.
--
-- EVERY SECTION MEETS MON-FRI. Jimmy: "all are m-f unless they are marked at FL
-- or GA then those are campus students who are m-th". That is a fact about a
-- STUDENT, not a class - the class runs five days and a campus child attends
-- four. It belongs on the enrolment, and this migration does not pretend
-- otherwise by writing it onto the section.
--
-- ENTREPRENEURSHIP BOOKS TO THE ACADEMY HS, confirmed by Jimmy. The course was
-- created there from the pay schedule and carries a 20.00 rate. Peter Alouise
-- teaches it on the VIRTUAL schedule and is HS staff; pay follows the COURSE's
-- school, so his three sections land on HS's books.
--
-- NO SESSIONS HERE. A section is a class that exists; a session is a class that
-- happens on a date. That is migration 383.

begin;

-- =========================================================================
-- 1. THE COURSES THE SCHEDULE NEEDS THAT DID NOT EXIST
-- =========================================================================
--
-- Unrated on purpose. No rate has been agreed for these three, and migration
-- 376's design names an unpriced class as skipped rather than quietly paying it
-- nothing. They will appear, loudly, in the first pay run until rates are set.

insert into public.courses (school_id, code, name, status)
select s.id, c.code, c.course_name, 'active'
from (values
  ('LIFELAB',  'Life Lab'),
  ('EARTHLAB', 'Earth Lab'),
  ('RWMATH',   'Real World Math')
) as c(code, course_name)
join public.schools s on lower(trim(s.name)) = 'the academy virtual'
on conflict (school_id, code) do update
  set name = excluded.name, status = 'active', updated_at = now();

-- =========================================================================
-- 2. THE 41 SECTIONS
-- =========================================================================

with slot(course_code, section_code, employee_number, start_et, end_et, printed_as, teacher) as (
  values
  ('EARTHOLOGY', 'MURPHY-0900', 'Mahogany.Murphy', time '09:00', time '09:50', 'Earthology', 'Mahogany Murphy'),
  ('STRUCTLIT', 'TRACEWELL-0900', 'Renne.Tracewell', time '09:00', time '09:50', 'Structured Literacy', 'Renee Tracewell'),
  ('STRUCTLIT', 'HAWKINS-0900', 'Kim.Hawkins', time '09:00', time '09:50', 'Structured Literacy', 'Kim Hawkins'),
  ('LITLAB', 'MANGHUN-0900', 'Casandra.Manghun', time '09:00', time '09:50', 'Lit Lab (age 10-11)', 'Cassandra Manghum'),
  ('RWMATH', 'ALOUISE-0900', 'Peter.Alouise', time '09:00', time '09:50', 'Real World Math', 'Peter Alouise'),
  ('LIFELAB', 'MANN-0900', 'Craig.Mann', time '09:00', time '09:50', 'Life Lab I', 'Craig Mann'),
  ('EARTHLAB', 'WITTERS-0900', 'Marnie.Witters', time '09:00', time '09:50', 'Earth Lab II', 'Marnie Witters'),
  ('STRUCTLIT', 'MURPHY-1000', 'Mahogany.Murphy', time '10:00', time '10:50', 'Structured Literacy', 'Mahogany Murphy'),
  ('STRUCTLIT', 'TRACEWELL-1000', 'Renne.Tracewell', time '10:00', time '10:50', 'Structured Literacy', 'Renee Tracewell'),
  ('STRUCTLIT', 'HAWKINS-1000', 'Kim.Hawkins', time '10:00', time '10:50', 'Structured Literacy', 'Kim Hawkins'),
  ('DIGITLAB', 'ROGERS-1000', 'Raven.Rogers', time '10:00', time '10:50', 'Digit Lab Middle School', 'Raven Rogers'),
  ('LITLAB', 'MANGHUN-1000', 'Casandra.Manghun', time '10:00', time '10:50', 'Lit Lab (age 11-12)', 'Cassandra Manghum'),
  ('ENTREP', 'ALOUISE-1000', 'Peter.Alouise', time '10:00', time '10:50', 'Advanced Entrepreneurship', 'Peter Alouise'),
  ('LIFELAB', 'MANN-1000', 'Craig.Mann', time '10:00', time '10:50', 'Life Lab II', 'Craig Mann'),
  ('EARTHLAB', 'WITTERS-1000', 'Marnie.Witters', time '10:00', time '10:50', 'Earth Lab I', 'Marnie Witters'),
  ('STRUCTLIT', 'VANELLA-1100', 'Marissa.Vanella', time '11:00', time '11:50', 'Structured Literacy', 'Marisa Vanella'),
  ('STRUCTLIT', 'TRACEWELL-1100', 'Renne.Tracewell', time '11:00', time '11:50', 'Structured Literacy', 'Renee Tracewell'),
  ('STRUCTLIT', 'HAWKINS-1100', 'Kim.Hawkins', time '11:00', time '11:50', 'Structured Literacy', 'Kim Hawkins'),
  ('DIGITLAB', 'ROGERS-1100', 'Raven.Rogers', time '11:00', time '11:50', 'Digit Lab Middle School', 'Raven Rogers'),
  ('LITLAB', 'MANGHUN-1100', 'Casandra.Manghun', time '11:00', time '11:50', 'Lit Lab (age 13-14)', 'Cassandra Manghum'),
  ('ENTREP', 'ALOUISE-1100', 'Peter.Alouise', time '11:00', time '11:50', 'Entrepreneurship II', 'Peter Alouise'),
  ('LIFELAB', 'MANN-1100', 'Craig.Mann', time '11:00', time '11:50', 'Life Lab II', 'Craig Mann'),
  ('STRUCTLIT', 'VANELLA-1200', 'Marissa.Vanella', time '12:00', time '12:50', 'Structured Literacy', 'Marisa Vanella'),
  ('STRUCTLIT', 'MURPHY-1200', 'Mahogany.Murphy', time '12:00', time '12:50', 'Structured Literacy', 'Mahogany Murphy'),
  ('STRUCTLIT', 'TRACEWELL-1200', 'Renne.Tracewell', time '12:00', time '12:50', 'Structured Literacy', 'Renee Tracewell'),
  ('STRUCTLIT', 'HAWKINS-1200', 'Kim.Hawkins', time '12:00', time '12:50', 'Structured Literacy', 'Kim Hawkins'),
  ('RWMATH', 'ALOUISE-1200', 'Peter.Alouise', time '12:00', time '12:50', 'Real World Math', 'Peter Alouise'),
  ('TUTORING', 'MANN-1200', 'Craig.Mann', time '12:00', time '12:50', 'Tutoring', 'Craig Mann'),
  ('STRUCTLIT', 'VANELLA-1300', 'Marissa.Vanella', time '13:00', time '13:50', 'Structured Literacy', 'Marisa Vanella'),
  ('STRUCTLIT', 'MURPHY-1300', 'Mahogany.Murphy', time '13:00', time '13:50', 'Structured Literacy', 'Mahogany Murphy'),
  ('STRUCTLIT', 'MEDLONG-1300', 'Holly.Medlong', time '13:00', time '13:50', 'Structured Literacy', 'Holly Medlong'),
  ('DIGITLAB', 'ROGERS-1300', 'Raven.Rogers', time '13:00', time '13:50', 'Digit Lab (ages 9-11)', 'Raven Rogers'),
  ('LITLAB', 'MANGHUN-1300', 'Casandra.Manghun', time '13:00', time '13:50', 'Lit Lab (age 11-12)', 'Cassandra Manghum'),
  ('DIGITLAB', 'VEDDER-1300', 'Jessica.Vedder', time '13:00', time '13:50', 'Digit Lab (ages 8-10)', 'Jessica Vedder'),
  ('ENTREP', 'ALOUISE-1300', 'Peter.Alouise', time '13:00', time '13:50', 'Entrepreneurship I', 'Peter Alouise'),
  ('EARTHOLOGY', 'MANN-1300', 'Craig.Mann', time '13:00', time '13:50', 'Earthology (AV)', 'Craig Mann'),
  ('EARTHLAB', 'WITTERS-1300', 'Marnie.Witters', time '13:00', time '13:50', 'Earth Lab II', 'Marnie Witters'),
  ('STRUCTLIT', 'MEDLONG-1400', 'Holly.Medlong', time '14:00', time '14:50', 'Structured Literacy', 'Holly Medlong'),
  ('RWMATH', 'ROGERS-1400', 'Raven.Rogers', time '14:00', time '14:50', 'HS Real World Math', 'Raven Rogers'),
  ('EARTHOLOGY', 'VEDDER-1400', 'Jessica.Vedder', time '14:00', time '14:50', 'Earthology', 'Jessica Vedder'),
  ('TUTORING', 'VEDDER-1700', 'Jessica.Vedder', time '17:00', time '17:50', 'Tutoring', 'Jessica Vedder')
),
resolved as (
  select sl.*, c.id as course_id, e.id as employee_id, sy.id as school_year_id
  from slot sl
  join public.courses c on c.code = sl.course_code
  join public.employees e on e.employee_number = sl.employee_number
  join public.school_years sy
    on sy.school_id = c.school_id and sy.is_current
)
insert into public.course_sections
  (course_id, school_year_id, section_code, instructor_employee_id,
   status, day_pattern, start_time_et, end_time_et, instructional_minutes,
   meeting_pattern)
select course_id, school_year_id, section_code, employee_id,
       'open', 'M-F', start_et, end_et, 50,
       jsonb_build_object('printed_as', printed_as, 'teacher_on_grid', teacher,
                          'source', 'Fall 2026-2027 Virtual Schedule, 19 Sept 2026')
from resolved
on conflict (course_id, school_year_id, section_code) do update
  set instructor_employee_id = excluded.instructor_employee_id,
      start_time_et          = excluded.start_time_et,
      end_time_et            = excluded.end_time_et,
      day_pattern            = excluded.day_pattern,
      meeting_pattern        = excluded.meeting_pattern,
      updated_at             = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- EXPECT 41 ROWS. Fewer means a course code or an employee_number did not
-- resolve and that class silently did not load - a teacher who would be paid
-- for nothing. Check the count before anything else.

select c.name as course,
       sec.section_code,
       sec.meeting_pattern->>'printed_as' as printed_on_the_grid,
       p.display_name as teacher,
       to_char(sec.start_time_et, 'HH24:MI') as starts,
       sch.name as books_to,
       case when r.id is null then 'NO RATE - will be skipped in a pay run'
            else 'rate set' end as rate
from public.course_sections sec
join public.courses c on c.id = sec.course_id
join public.schools sch on sch.id = c.school_id
join public.employees e on e.id = sec.instructor_employee_id
join public.employee_profiles p on p.employee_id = e.id
left join public.class_pay_rates r on r.course_id = c.id and r.employee_id is null
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
order by sec.start_time_et, c.name, sec.section_code;
