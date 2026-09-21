-- ===========================================================================
-- TEACHERS AND THEIR LOGINS  -  2026-09-21
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. On 20 September all eleven virtual teachers had no login, against 205
-- classes scheduled that week. Before creating accounts I need the real list:
-- who they are, what address to create the account under, which school the
-- login has to be assigned to, and who is already linked.
--
-- WHAT EMPTY MEANS, before it runs.
--   1 empty -> no employees are typed as teachers. The list is built some
--              other way and section 2 is the one to trust.
--   2 empty -> nobody has a login yet. Expected as of last night.
--   3 empty -> no classes are scheduled this week, which would contradict the
--              205 measured on Saturday. Treat that as a broken query, not as
--              a quiet week.
-- ===========================================================================

-- 1. Every teacher, their address, their school, and whether they can sign in.
select
  '1. teacher'                                            as section,
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name,
    e.employee_number
  )                                                       as person,
  coalesce(p.contact_email, '(no address on file)')       as address,
  coalesce(s.name, '(no school)')                         as school,
  case when e.user_id is null then 'NO LOGIN' else 'linked' end as login,
  e.id::text                                              as employee_id
from public.employees e
left join public.employee_profiles p on p.employee_id = e.id
left join public.schools s on s.id = e.school_id
where e.employee_type = 'teacher'
  and coalesce(e.employment_status, 'active') = 'active'

union all

-- 2. Teachers who ARE linked, and to which platform user. Every name here can
--    already sign in today.
select
  '2. already linked',
  coalesce(u.full_name, u.email, u.id::text),
  coalesce(u.email, ''),
  '',
  '',
  e.id::text
from public.employees e
join public.users u on u.id = e.user_id
where e.employee_type = 'teacher'

union all

-- 3. Who is actually teaching this week, so the account order follows the
--    classes rather than the alphabet. Week of Monday 21 September.
select
  '3. teaching this week',
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name,
    e.employee_number
  ),
  count(*)::text || ' classes',
  '',
  case when e.user_id is null then 'NO LOGIN' else 'linked' end,
  e.id::text
from public.instructional_sessions i
join public.employees e on e.id = i.instructor_employee_id
left join public.employee_profiles p on p.employee_id = e.id
where (i.scheduled_start at time zone 'America/New_York')::date >= date '2026-09-21'
  and (i.scheduled_start at time zone 'America/New_York')::date <  date '2026-09-28'
group by e.id, e.employee_number, e.user_id, p.first_name, p.last_name, p.display_name

order by 1, 2;
