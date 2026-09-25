-- NO TEACHER BELONGS TO A CAMPUS - 25 September 2026
--
-- WHAT HAPPENED. Renee opened Timesheets and got
--
--     Could not price your classes: No school is named The Academy Virtual
--     or The Academy HS.
--
-- Both schools exist. She cannot see them.
--
--   schools RLS (039)          has_role('CEO') or can_access_school(id)
--   can_access_school (037)    teacher -> is_assigned_to_school(id)
--   is_assigned_to_school (026) a row in user_schools for auth.uid()
--
-- With no row, the schools query returns ZERO ROWS AND NO ERROR, and
-- class-pay.ts reads that as "the school does not exist". The house pattern
-- again: a policy refusal wearing a success costume. The screen blames the
-- data; the cause is membership.
--
-- IT IS NOT JUST HER. All thirteen active teachers have zero user_schools
-- rows. Every one of them would have hit this the first time they opened
-- Timesheets - which is to say, on the Friday their pay sheet is due.
--
-- WHERE THE CAMPUS COMES FROM. employees.school_id, which is already the
-- record of who works where, and which the sidebar and the employee screens
-- already believe. Nothing is invented here and no campus is decided by me.
-- The verification prints the resulting pairs so the assignments can be read
-- rather than trusted.
--
-- SCOPE. Active teachers only. Other staff - school leaders, the business
-- office - are very likely missing rows too, and the second query at the
-- bottom lists them, but who may see which campus is a different decision and
-- is not made inside a migration about teacher pay.

begin;

insert into user_schools (user_id, school_id)
select e.user_id, e.school_id
  from public.employees e
 where e.employment_status = 'active'
   and e.employee_type     = 'teacher'
   and e.user_id   is not null
   and e.school_id is not null
on conflict (user_id, school_id) do nothing;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect 13 rows, every one reading can_price_a_timesheet = true.
-- Read the campus column: it is what employees.school_id says, and if any
-- teacher is on the wrong campus that is a data fix, not a code one.
select
  pu.full_name,
  s.name                                   as assigned_campus,
  (s.name in ('The Academy Virtual','The Academy HS')) as can_price_a_timesheet
from public.employees e
join public.users pu on pu.id = e.user_id
join user_schools us on us.user_id = pu.id and us.school_id = e.school_id
join public.schools s on s.id = us.school_id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
order by pu.full_name;

-- ── WHO ELSE HAS NO CAMPUS ───────────────────────────────────────────────────
-- Read only, changes nothing. Everyone else on staff who cannot see a school.
-- Heather Badger-Brown appearing here would explain why the wrong-door screen
-- could never name her campus back on 13 September.
select
  pu.full_name,
  pu.email,
  e.employee_type,
  s.name as employee_campus
from public.employees e
join public.users pu on pu.id = e.user_id
left join public.schools s on s.id = e.school_id
where e.employment_status = 'active'
  and e.employee_type <> 'teacher'
  and not exists (select 1 from user_schools us where us.user_id = pu.id)
order by e.employee_type, pu.full_name;
