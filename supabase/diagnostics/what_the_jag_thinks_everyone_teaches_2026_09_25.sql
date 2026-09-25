-- WHAT THE JAG THINKS EVERYONE TEACHES - 25 September 2026
--
-- Craig Mann says he teaches five classes on a Monday: Life Lab I at 9, Life
-- Lab II at 10, Life Lab II at 11, a 1:1 with Ivy at 12, and Earthology for AV
-- at 1. The JAG shows him three, all named Entrepreneurship, at 10, 11 and 1.
--
-- This matters more than a wrong label. The pay sheet prices whatever is in
-- instructional_sessions, and the rate is per COURSE - class_pay_rates is
-- keyed on the course, because Structured Literacy pays 35.00 where LitLab
-- pays 20.00 for the same person. A session under the wrong course name pays
-- the wrong amount, silently and correctly, according to the data it was
-- given.
--
-- So before anyone submits a pay sheet, this is the sheet to check: every
-- session the JAG has for the current week, per teacher, with the rate that
-- would be applied. Read it against what each teacher says they actually
-- teach.
--
-- The week is Monday 21 - Friday 25 September 2026, the week Renee's screen
-- offered to submit.
--
-- ONE statement. READ ONLY. Nothing here can move money.

select
  pu.full_name                                    as teacher,
  sch.name                                        as campus,
  to_char(sess.scheduled_start, 'Dy DD Mon')      as day,
  to_char(sess.scheduled_start, 'HH12:MI AM')     as starts,
  c.name                                          as course_the_jag_has,
  cs.section_code,
  sess.session_status,
  (sess.instructor_employee_id is distinct from cs.instructor_employee_id)
                                                  as somebody_covered,
  cpr.base_first_student                          as rate_first_student,
  cpr.per_additional_student                      as rate_each_additional,
  (cpr.employee_id is null)                       as NO_RATE_SO_UNPAID
from public.instructional_sessions sess
join public.course_sections cs on cs.id = sess.course_section_id
join public.courses c          on c.id  = cs.course_id
join public.schools sch        on sch.id = c.school_id
join public.employees e        on e.id  = sess.instructor_employee_id
join public.users pu           on pu.id = e.user_id
left join public.class_pay_rates cpr
       on cpr.employee_id = e.id
      and cpr.course_id   = c.id
where sess.scheduled_start >= '2026-09-21T00:00:00'
  and sess.scheduled_start <= '2026-09-25T23:59:59'
order by pu.full_name, sess.scheduled_start;
