-- WHO IS ASSIGNED TO A CAMPUS - 25 September 2026
--
-- Renee's timesheet says "No school is named The Academy Virtual or The
-- Academy HS." Both exist. She cannot SEE them.
--
-- schools RLS (migration 039): has_role('CEO') or can_access_school(id)
-- can_access_school (037), for a teacher: has_role('TEACHER')
--                                        and is_assigned_to_school(id)
-- is_assigned_to_school (026): a row in user_schools for auth.uid()
--
-- No user_schools row means the schools query returns zero rows AND NO ERROR,
-- and class-pay.ts reads that as "the school does not exist". Migration 421
-- gave her the role and the employee link but never made her a member of a
-- campus - my omission.
--
-- This asks it of every active teacher, because a second one missing a row
-- would fail the same silent way the moment they open Timesheets.
--
-- ONE statement. READ ONLY.

select
  pu.full_name,
  pu.email,
  s_emp.name                          as employee_campus,
  count(us.school_id)                 as user_schools_rows,
  string_agg(s_us.name, ', ' order by s_us.name) as assigned_campuses,
  (count(us.school_id) > 0)           as can_see_schools_at_all,
  bool_or(s_us.name in ('The Academy Virtual','The Academy HS'))
                                      as can_price_a_timesheet
from public.employees e
join public.users pu       on pu.id = e.user_id
left join public.schools s_emp on s_emp.id = e.school_id
left join user_schools us  on us.user_id = pu.id
left join public.schools s_us  on s_us.id = us.school_id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
group by pu.full_name, pu.email, s_emp.name
order by can_price_a_timesheet, pu.full_name;
