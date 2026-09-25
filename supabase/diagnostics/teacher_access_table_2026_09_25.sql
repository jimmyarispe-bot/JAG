-- EVERY ACTIVE TEACHER, AND WHAT SHE CAN ACTUALLY REACH - 25 September 2026
--
-- ONE statement, so the result grid shows this and nothing else.
--
-- Starts from employees, not from accounts, so a teacher with no account still
-- appears - Renee Tracewell has no employees.user_id and would otherwise
-- vanish from her own audit.
--
-- READ ONLY.

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
),
role_names as (
  select user_id, string_agg(distinct name, ', ' order by name) as roles
  from role_tree
  group by user_id
)
select
  coalesce(pu.full_name, e.employee_number, '(no name)') as teacher,
  pu.email,
  s.name                       as school,
  (e.user_id is not null)      as employee_linked_to_user,
  (au.id is not null)          as has_sign_in_account,
  coalesce(rn.roles, '(none)') as roles,
  coalesce(bool_or(g.permission_key in ('teacher.view','teacher.manage')), false)
                               as can_see_teacher_studio,
  coalesce(bool_or(g.permission_key in ('students.view','students.edit')), false)
                               as can_see_students
from public.employees e
left join public.users pu on pu.id = e.user_id
left join auth.users au   on au.id = pu.id
left join public.schools s on s.id = e.school_id
left join role_names rn   on rn.user_id = pu.id
left join granted g       on g.user_id = pu.id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
group by
  pu.full_name, e.employee_number, pu.email, s.name,
  e.user_id, au.id, rn.roles
order by can_see_teacher_studio, teacher;
