-- ==========================================================================
-- 517 — LEESA DAVIS CAN ACTUALLY USE THE JAG
--
-- 8 October 2026.
--
-- ── THE PROBLEM THIS SOLVES ───────────────────────────────────────────────
--
-- Leesa Davis now exists twice and the two halves are not joined:
--
--   users              leesa.davis@theacademyvirtual.org, Teacher,
--                      The Academy HS + The Academy Virtual
--   employees          E-000011, Specialized Virtual Teacher, active
--                      user_id IS NULL
--
-- Every teacher screen starts at getTeacherEmployeeId (teacher/queries.ts:7):
--
--     select id from employees
--      where user_id = <the signed-in user> and employment_status = 'active'
--
-- With user_id null that returns nothing. She would sign in successfully,
-- land on her week, and find it empty — no classes, no hours, no children,
-- and no error anywhere saying why. Zero rows with no error is a refusal
-- wearing a success costume, and this is the cheapest possible version of
-- it: one null column.
--
-- ── WHAT THIS DOES ────────────────────────────────────────────────────────
--
-- Joins the two records. One column, employees.user_id.
--
-- ── WHAT IT DOES NOT DO ───────────────────────────────────────────────────
--
-- IT DOES NOT CREATE OR ENABLE A SIGN-IN. If Leesa cannot yet log in, that
-- is an invitation sent from /dashboard/admin/users, by a person. No
-- migration should be minting anybody's access.
--
-- It does not change her campus. employees.school_id holds ONE campus and
-- her account carries both; the verify grid below shows how Heather
-- Badger-Brown — the other HS-and-Virtual person — is set up, so the house
-- pattern decides that rather than me.
--
-- It does not give her any classes. See section 2 of the verify.
--
-- Idempotent. Re-running changes nothing.
-- ==========================================================================

begin;

do $$
declare
  v_user     uuid;
  v_employee uuid;
  v_linked   uuid;
begin
  select u.id into v_user
  from public.users u
  where lower(trim(u.email)) = 'leesa.davis@theacademyvirtual.org';

  if v_user is null then
    raise exception
      '517: no account at leesa.davis@theacademyvirtual.org. Create her user '
      'at /dashboard/admin/users first — that is a person''s job, not this '
      'file''s. Nothing changed.';
  end if;

  select e.id, e.user_id into v_employee, v_linked
  from public.employees e
  join public.employee_profiles p on p.employee_id = e.id
  where lower(trim(coalesce(p.first_name,''))) = 'leesa'
    and lower(trim(coalesce(p.last_name,'')))  = 'davis'
    and e.employment_status = 'active';

  if v_employee is null then
    raise exception '517: no active employee record for Leesa Davis.';
  end if;

  if v_linked is not null and v_linked <> v_user then
    raise exception
      '517: her employee record is already joined to a DIFFERENT account. '
      'Repointing one person at another account is not something this should '
      'do quietly.';
  end if;

  update public.employees
  set user_id = v_user
  where id = v_employee and user_id is distinct from v_user;

  raise notice '517: Leesa Davis joined. employee % -> user %', v_employee, v_user;
end $$;

commit;

-- 1 ----------------------------------- CAN THE TEACHER SCREENS FIND HER NOW
-- This runs the EXACT lookup every teacher page begins with. A row here
-- means her week will load. No row means it will be blank.
select
  1                                                     as ord,
  'THE LOOKUP EVERY TEACHER SCREEN STARTS WITH'         as section,
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) as person,
  u.email                                               as signs_in_as,
  coalesce(s.name, '(no campus)')                       as employee_campus,
  e.employee_type || ' / ' || e.employment_status       as detail,
  'FOUND — her week will load'                          as verdict
from public.employees e
join public.users u on u.id = e.user_id
left join public.employee_profiles p on p.employee_id = e.id
left join public.schools s on s.id = e.school_id
where e.employment_status = 'active'
  and lower(trim(u.email)) = 'leesa.davis@theacademyvirtual.org'

union all

-- 2 -------------------------------------- HAS SHE ANYTHING TO TEACH YET
-- A joined record with no sections is still an empty week. She cannot log
-- classes, hours or children against sections she is not on.
select
  2,
  'THE CLASSES SHE IS ON',
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
  coalesce(cs.section_code, '(none)'),
  coalesce(sa.assignment_role, '—'),
  case when sa.is_active then 'active' else 'inactive' end,
  'assigned'
from public.employees e
join public.employee_profiles p on p.employee_id = e.id
join public.section_staff_assignments sa on sa.employee_id = e.id
left join public.course_sections cs on cs.id = sa.course_section_id
where lower(trim(coalesce(p.first_name,''))) = 'leesa'
  and lower(trim(coalesce(p.last_name,'')))  = 'davis'

union all

select
  2,
  'THE CLASSES SHE IS ON',
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
  coalesce(cs.section_code, '(none)'),
  'instructor of record',
  'on course_sections',
  'assigned'
from public.employees e
join public.employee_profiles p on p.employee_id = e.id
join public.course_sections cs on cs.instructor_employee_id = e.id
where lower(trim(coalesce(p.first_name,''))) = 'leesa'
  and lower(trim(coalesce(p.last_name,'')))  = 'davis'

union all

-- 3 --------------------- HOW THE OTHER HS-AND-VIRTUAL PERSON IS SET UP
-- Heather Badger-Brown carries both campuses on her account too. Whatever
-- her employee record says is the house pattern, and Leesa should match it
-- rather than match a guess of mine.
select
  3,
  'THE EXISTING HS-AND-VIRTUAL PERSON, FOR COMPARISON',
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
  coalesce(u.email, '(no account linked)'),
  coalesce(s.name, '(no campus)'),
  e.employee_type || ' / ' || e.employment_status,
  'copy this shape'
from public.employees e
join public.employee_profiles p on p.employee_id = e.id
left join public.users u on u.id = e.user_id
left join public.schools s on s.id = e.school_id
where lower(trim(coalesce(p.last_name,''))) in ('badger-brown', 'brown')
  and e.employment_status = 'active'

order by ord, person, employee_campus;
