-- Craig Mann's week of 21 September 2026, as the pay path sees it.
-- ONE statement, because the SQL Editor shows only the last result set.
-- Read only.
--
--   'week'   : his submission row. No 'week' line at all means he has not
--              submitted - the classes below are still what he would be paid.
--   'class'  : every session of his that week, with the date, whether it was
--              held, how many children were on the roster, and who taught it.
--   'claim'  : GREATNESS Reports or other non-class work filed against the week.

select 'week'::text as line,
       w.week_start::text as when_it_was,
       w.status::text as detail,
       (w.gross_cents / 100.0)::text as amount,
       coalesce(w.submitted_at::text, '-') as extra
  from public.teacher_week_submissions w
  join public.employees e on e.id = w.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where coalesce(p.display_name, e.employee_number) ilike '%mann%'
   and w.week_start = date '2026-09-21'

union all

select 'class',
       to_char(s.scheduled_start at time zone 'America/New_York', 'Dy Mon DD HH12:MI AM'),
       coalesce(c.name, 'class') || ' / ' || coalesce(cs.section_code, '?')
         || ' [' || coalesce(s.session_status, 'scheduled') || ']',
       (select count(*)::text
          from public.student_enrollments se
         where se.course_section_id = s.course_section_id
           and se.enrollment_status = 'active'),
       case when s.original_instructor_employee_id is not null
            then 'covered' else '-' end
  from public.instructional_sessions s
  join public.course_sections cs on cs.id = s.course_section_id
  join public.courses c on c.id = cs.course_id
  join public.employees e on e.id = s.instructor_employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where coalesce(p.display_name, e.employee_number) ilike '%mann%'
   and s.scheduled_start >= timestamp '2026-09-21 00:00:00'
   and s.scheduled_start <  timestamp '2026-09-26 00:00:00'

union all

select 'claim',
       cl.work_date::text,
       cl.work_code,
       cl.quantity::text,
       coalesce(sc.name, 'no campus on claim')
  from public.contractor_work_claims cl
  join public.employees e on e.id = cl.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
  left join public.schools sc on sc.id = cl.school_id
 where coalesce(p.display_name, e.employee_number) ilike '%mann%'
   and cl.work_date >= date '2026-09-21'

order by 1, 2;
