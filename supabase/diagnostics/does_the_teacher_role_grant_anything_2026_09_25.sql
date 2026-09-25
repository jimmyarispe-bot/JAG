-- DOES THE TEACHER ROLE GRANT ANYTHING - 25 September 2026
--
-- ONE statement. If TEACHER and EMPLOYEE come back with no teacher.* rows,
-- then no teacher anywhere can see Teacher Studio and the fault is one role
-- definition, not thirteen people.
--
-- READ ONLY.

select
  r.name                              as role_name,
  r.parent_role_id is not null        as inherits_from_a_parent,
  coalesce(prp.permission_key, '(no permissions at all)') as permission_key,
  prp.effect
from roles r
left join platform_role_permissions prp on prp.role_id = r.id
where r.name in ('TEACHER','EMPLOYEE')
order by r.name, prp.permission_key;
