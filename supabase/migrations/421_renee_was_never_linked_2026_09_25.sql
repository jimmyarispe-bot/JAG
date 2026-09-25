-- RENEE WAS NEVER LINKED - 25 September 2026
--
-- WHAT HAPPENED. Renee Tracewell reset her password, signed in, and landed on
-- a dashboard with six entries: Home, Families, Communications, Workflows,
-- Calendar, Documents. Teacher Studio - the one screen she was sent there to
-- use - was not among them.
--
-- That is not a sidebar fault. It is exactly what the sidebar draws for
-- somebody holding no module permissions, and she holds none, because her
-- role is TEAM_MEMBER. The other twelve teachers all carry TEACHER and all
-- read true for Teacher Studio. She is the only one.
--
-- Four things were left undone when her record was created:
--
--   1. public.users.full_name is NULL - she has no name in the system
--   2. employees.user_id is NULL   - the employee record points at no account
--   3. that employee record sits at The Academy Virtual; Renee is HS
--   4. her role is TEAM_MEMBER rather than TEACHER
--
-- And her name was typed into employee_number as "Renne.Tracewell" - both
-- misspelled and in the wrong field.
--
-- WHAT THIS DOES NOT DO. It does not remove TEAM_MEMBER. That role grants
-- ACADEMYOS_ACCESS and nothing else, it is harmless alongside TEACHER, and
-- taking it away in the same breath as adding TEACHER risks locking her out
-- of a dashboard she can currently reach. Once she confirms Teacher Studio is
-- there, removing it is a one-line follow-up.
--
-- SCHOOLS ARE LOOKED UP BY NAME, not by uuid. The ids differ only in their
-- last characters and the result grid truncated both; a transposed uuid would
-- move her to the wrong campus silently.
--
-- Her account is sound and is NOT touched: renee.tracewell@theacademyhs.org,
-- id b604b16d-2c06-473f-9bc8-0a64b4b31237, confirmed, signed in this morning.
-- Her password is untouched. She does not need to reset again.

begin;

-- ── 1. Give her a name ───────────────────────────────────────────────────────
update public.users
   set full_name = 'Renee Tracewell'
 where id = 'b604b16d-2c06-473f-9bc8-0a64b4b31237'
   and full_name is null;

-- ── 2. Link the employee record to her account, and move it to HS ────────────
-- Guarded on user_id is null so a re-run cannot steal a record that has since
-- been linked to somebody else.
update public.employees
   set user_id         = 'b604b16d-2c06-473f-9bc8-0a64b4b31237',
       school_id       = (select id from public.schools where name = 'The Academy HS'),
       employee_number = null,
       updated_at      = now()
 where id = 'e28f9b4e-dfec-4c86-aa95-540cf86b5423'
   and user_id is null;

-- ── 3. Make her a TEACHER ────────────────────────────────────────────────────
insert into user_roles (user_id, role_id)
select 'b604b16d-2c06-473f-9bc8-0a64b4b31237',
       r.id
  from roles r
 where r.name = 'TEACHER'
on conflict (user_id, role_id) do nothing;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect one row reading:
--   Renee Tracewell | renee.tracewell@theacademyhs.org | The Academy HS
--   | TEACHER, TEAM_MEMBER | true | true
--
-- can_see_teacher_studio false here means the migration did not take, and she
-- should not be told to sign in again.
with recursive role_tree as (
  select ur.user_id, r.id, r.name, r.parent_role_id
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = 'b604b16d-2c06-473f-9bc8-0a64b4b31237'
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
  s.name as school,
  (select string_agg(distinct rt.name, ', ' order by rt.name) from role_tree rt) as roles,
  coalesce(bool_or(g.permission_key in ('teacher.view','teacher.manage')), false)
    as can_see_teacher_studio,
  coalesce(bool_or(g.permission_key in ('students.view','students.edit')), false)
    as can_see_students
from public.users pu
left join public.employees e on e.user_id = pu.id
left join public.schools s   on s.id = e.school_id
left join granted g          on g.user_id = pu.id
where pu.id = 'b604b16d-2c06-473f-9bc8-0a64b4b31237'
group by pu.full_name, pu.email, s.name;
