-- WHAT CAN A TEACHER ACTUALLY SEE - 25 September 2026 (v3)
--
-- v1 and v2 each failed on a column I assumed instead of read. Every column
-- below is now taken from the migration that creates the table:
--
--   public.users   (001)  id, email, full_name
--   roles          (001)  id, name              + parent_role_id (074)
--   user_roles     (001)  user_id, role_id      -- no role, no is_active
--   employees      (046)  id, school_id, user_id, employee_number,
--                         employee_type, employment_status
--                         -- no name, no email: those live on public.users
--   platform_role_permissions (074) role_id, permission_key, effect
--
-- WHY THIS MATTERS. Renee's sidebar is Home, Families, Communications,
-- Workflows, Calendar, Documents - exactly the modules that name NO required
-- permission in src/lib/dashboard/module-visibility.ts. That is the shape the
-- sidebar takes when the permission list handed to it is EMPTY.
--
-- READ ONLY.

-- 1) Is she joined up at all: auth account -> public.users -> employee row.
select
  au.id     as auth_user_id,
  au.email  as auth_email,
  pu.id     as public_user_id,
  pu.full_name,
  e.id      as employee_id,
  e.employee_type,
  e.employment_status,
  s.name    as school_name
from auth.users au
left join public.users pu on pu.id = au.id
left join public.employees e on e.user_id = pu.id
left join public.schools s on s.id = e.school_id
where lower(au.email) like '%tracewell%';

-- 2) Her roles, by name.
select
  pu.email,
  r.name as role_name
from public.users pu
join user_roles ur on ur.user_id = pu.id
join roles r on r.id = ur.role_id
where lower(pu.email) like '%tracewell%';

-- 3) Every permission those roles grant, parent roles included.
with recursive her_roles as (
  select r.id, r.name, r.parent_role_id
  from public.users pu
  join user_roles ur on ur.user_id = pu.id
  join roles r on r.id = ur.role_id
  where lower(pu.email) like '%tracewell%'
  union
  select p.id, p.name, p.parent_role_id
  from roles p
  join her_roles c on c.parent_role_id = p.id
)
select
  hr.name as from_role,
  prp.permission_key,
  prp.effect
from her_roles hr
join platform_role_permissions prp on prp.role_id = hr.id
order by
  case when prp.permission_key like 'teacher%' then 0 else 1 end,
  prp.permission_key;

-- 4) THE ANSWER, for every active teacher at once.
--    can_see_teacher_studio false = she signs in and Teacher Studio is not in
--    her sidebar. Nobody gets the pay-sheet instructions until every row is
--    true.
with recursive role_tree as (
  select ur.user_id, r.id, r.name, r.parent_role_id
  from user_roles ur
  join roles r on r.id = ur.role_id
  union
  select rt.user_id, p.id, p.name, p.parent_role_id
  from roles p
  join role_tree rt on rt.parent_role_id = p.id
),
granted as (
  select distinct rt.user_id, prp.permission_key
  from role_tree rt
  join platform_role_permissions prp
    on prp.role_id = rt.id and prp.effect = 'allow'
)
select
  pu.full_name,
  pu.email,
  s.name as school_name,
  coalesce(bool_or(g.permission_key in ('teacher.view','teacher.manage')), false)
    as can_see_teacher_studio,
  coalesce(bool_or(g.permission_key in ('students.view','students.edit')), false)
    as can_see_students
from public.employees e
join public.users pu on pu.id = e.user_id
left join public.schools s on s.id = e.school_id
left join granted g on g.user_id = pu.id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
group by pu.full_name, pu.email, s.name
order by can_see_teacher_studio, pu.full_name;

-- 5) Does the TEACHER role carry teacher permissions AT ALL?
--    Nothing here means no teacher anywhere can see Teacher Studio, and the
--    fault is the role rather than the thirteen people.
select
  r.name as role_name,
  prp.permission_key,
  prp.effect
from roles r
left join platform_role_permissions prp on prp.role_id = r.id
where r.name in ('TEACHER','EMPLOYEE')
order by r.name, prp.permission_key;

-- 6) Any active teacher with no employees.user_id at all - those never reach
--    query 4, so count them separately rather than letting them vanish.
select
  e.id as employee_id,
  e.employee_number,
  e.employee_type,
  e.employment_status,
  s.name as school_name
from public.employees e
left join public.schools s on s.id = e.school_id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
  and e.user_id is null;
