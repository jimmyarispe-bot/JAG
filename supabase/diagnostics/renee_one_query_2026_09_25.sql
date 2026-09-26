-- ONE statement, because the SQL Editor only shows the last result set.
-- Read only. Nothing here changes anything.
--
-- WHAT TO LOOK FOR
--   'week row'   : a status other than 'open' means the sheet is FROZEN and
--                  the GREATNESS dropdown is hidden. That is the answer.
--                  No week row for someone means they have never touched it.
--   'no campus'  : who the old save would have refused (Craig's fault).
--   'claim'      : what has actually been filed against this week.

select 'week row'::text as finding,
       coalesce(p.display_name, e.employee_number)::text as person,
       w.status::text as detail_1,
       (w.gross_cents / 100.0)::text as detail_2,
       coalesce(w.submitted_at::text, '-') as detail_3
  from public.teacher_week_submissions w
  join public.employees e on e.id = w.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where w.week_start = date '2026-09-21'

union all

select 'no campus',
       coalesce(p.display_name, e.employee_number),
       'employees.school_id is null',
       e.employee_number,
       '-'
  from public.employees e
  left join public.employee_profiles p on p.employee_id = e.id
 where e.school_id is null
   and e.employment_status = 'active'

union all

select 'claim',
       coalesce(p.display_name, e.employee_number),
       c.work_code,
       c.quantity::text,
       coalesce(s.name, 'no campus on claim')
  from public.contractor_work_claims c
  join public.employees e on e.id = c.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
  left join public.schools s on s.id = c.school_id
 where c.work_date >= date '2026-09-21'

order by 1, 2;
