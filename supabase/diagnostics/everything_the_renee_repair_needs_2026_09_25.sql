-- EVERYTHING THE RENEE REPAIR NEEDS - 25 September 2026
--
-- Her account is sound: renee.tracewell@theacademyhs.org,
-- id b604b16d-2c06-473f-9bc8-0a64b4b31237, confirmed, signed in this morning.
-- What is missing sits around it - a name, the employee link, the campus, and
-- probably the role.
--
-- This returns the last four facts in one row so the repair can be written
-- without a single assumed value.
--
-- ONE statement. READ ONLY.

select
  pu.email,
  pu.full_name,
  (select string_agg(r.name, ', ' order by r.name)
     from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = pu.id)                      as her_roles,
  (select id from public.schools where name = 'The Academy HS')      as hs_school_id,
  (select id from public.schools where name = 'The Academy Virtual') as virtual_school_id,
  (select e.id from public.employees e
    where e.user_id is null
      and e.employee_type = 'teacher'
      and e.employment_status = 'active'
      and e.employee_number ilike '%tracewell%')   as her_employee_row_id,
  (select id from roles where name = 'TEACHER')    as teacher_role_id
from public.users pu
where pu.id = 'b604b16d-2c06-473f-9bc8-0a64b4b31237';
