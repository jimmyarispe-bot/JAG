-- IS EVERY CLASS ACTUALLY PRICED - 25 September 2026
--
-- CORRECTING MY OWN QUERY. The earlier version joined class_pay_rates on
-- employee_id = the teacher, and reported almost every class unpaid. That was
-- wrong. rateOn (src/lib/finance/class-pay.ts:196) resolves a rate as:
--
--     r.employeeId === null || r.employeeId === employeeId
--
-- A NULL employee_id is the NETWORK rate and applies to anybody teaching the
-- course - which is nearly every rate in the system. My join matched only
-- person-specific rates, so the one row it found priced was Craig's Tutoring,
-- the single personal rate migration 379 exists to allow.
--
-- This resolves it the way the code does, including the precedence: a rate
-- belonging to the person beats the rate belonging to nobody, and the latest
-- effective_from on or before the class date wins.
--
-- Times are rendered in Eastern. The earlier grid printed raw UTC and read
-- four hours late; the section codes were right all along.
--
-- ONE statement. READ ONLY.

with sessions_this_week as (
  select
    sess.id,
    sess.scheduled_start,
    sess.session_status,
    e.id   as employee_id,
    pu.full_name,
    c.id   as course_id,
    c.name as course_name,
    sch.name as course_campus,
    cs.section_code
  from public.instructional_sessions sess
  join public.course_sections cs on cs.id = sess.course_section_id
  join public.courses c          on c.id  = cs.course_id
  join public.schools sch        on sch.id = c.school_id
  join public.employees e        on e.id  = sess.instructor_employee_id
  join public.users pu           on pu.id = e.user_id
  where sess.scheduled_start >= '2026-09-21T00:00:00'
    and sess.scheduled_start <= '2026-09-26T04:00:00'
),
resolved as (
  select
    s.*,
    (
      select r.base_first_student
      from public.class_pay_rates r
      where r.course_id = s.course_id
        and (r.employee_id is null or r.employee_id = s.employee_id)
        and r.effective_from <= s.scheduled_start::date
      order by (r.employee_id = s.employee_id) desc nulls last,
               r.effective_from desc
      limit 1
    ) as rate_first_student,
    (
      select r.employee_id is not null
      from public.class_pay_rates r
      where r.course_id = s.course_id
        and (r.employee_id is null or r.employee_id = s.employee_id)
        and r.effective_from <= s.scheduled_start::date
      order by (r.employee_id = s.employee_id) desc nulls last,
               r.effective_from desc
      limit 1
    ) as rate_is_personal
  from sessions_this_week s
)
select
  full_name                                                  as teacher,
  course_name,
  course_campus,
  count(*)                                                   as sessions_this_week,
  min(to_char(scheduled_start at time zone 'America/New_York','HH12:MI AM')) as earliest_start_et,
  max(rate_first_student)                                    as rate_first_student,
  bool_or(rate_is_personal)                                  as uses_a_personal_rate,
  (max(rate_first_student) is null)                          as TRULY_UNPRICED
from resolved
group by full_name, course_name, course_campus
order by TRULY_UNPRICED desc, full_name, course_name;
