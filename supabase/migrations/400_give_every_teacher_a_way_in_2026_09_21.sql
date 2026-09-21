-- ===========================================================================
-- GIVE EVERY TEACHER A WAY IN  -  400  -  2026-09-21
--
-- Replaces the approach in 396, which hardcoded one user id and one employee
-- id. Both went stale the moment the test account was torn down and rebuilt,
-- and a migration that refuses on a dead id is a migration nobody can run.
--
-- THIS FILE NAMES NOBODY. It links a teacher when, and only when, an auth
-- account already exists whose address matches the contact_email on that
-- teacher's profile. You create the account in Supabase Auth; this migration
-- finds it. Run it once per account, or once after creating several - it does
-- the same thing either way.
--
-- IT CANNOT RUN AWAY WITH ITSELF. It acts only on teachers whose auth account
-- you have already created by hand. No account, no row, no change.
--
-- WHY FIVE WRITES AND NOT ONE
--
--   public.users          the platform's own record. auth.users is Supabase's.
--                         Everything else joins to the second one.
--   user_roles TEACHER    carries teacher.view / attendance / manage /
--                         communicate / compliance, and is what puts Teacher
--                         Studio and Scheduling in the sidebar.
--   user_roles TEAM_MEMBER   REVOKED. Provisioning gives TEAM_MEMBER to every
--                         new account and nothing ever takes it back, so a
--                         teacher granted TEACHER was carrying both. Before
--                         tonight that meant Mission Control and the whole
--                         Executive section on a teacher's screen. Migration
--                         399 and the ACADEMYOS_ACCESS change closed the leak;
--                         this closes the door it came through.
--   user_org_assignments  THE ONE THAT IS EASY TO FORGET. A non-Founder gets
--                         accessibleSchoolIds from this table. With no row they
--                         are not refused - they see nothing, which reads as a
--                         broken screen rather than a missing permission.
--   employees.user_id     what getTeacherEmployeeId reads. Without it the
--                         teacher pages redirect away and never say why.
--
-- MEASURED FIRST: on 20 September all eleven virtual teachers had no login at
-- all, against 205 classes taught that week by people who could not sign in to
-- say so.
-- ===========================================================================

begin;

do $$
declare
  r               record;
  v_teacher_role  uuid;
  v_team_role     uuid;
  v_linked        int := 0;
begin
  select id into v_teacher_role from public.roles where name = 'TEACHER';
  if v_teacher_role is null then
    raise exception 'There is no TEACHER role. Nothing linked.';
  end if;

  -- May legitimately be null on a database that never provisioned anyone.
  select id into v_team_role from public.roles where name = 'TEAM_MEMBER';

  for r in
    select
      au.id           as auth_user_id,
      au.email        as email,
      e.id            as employee_id,
      e.school_id     as school_id,
      coalesce(p.first_name, '')  as first_name,
      coalesce(p.last_name, '')   as last_name,
      coalesce(
        nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
        p.display_name,
        au.email
      )               as full_name
    from public.employees e
    join public.employee_profiles p on p.employee_id = e.id
    join auth.users au
      on lower(au.email) = lower(p.contact_email)
    where e.employee_type = 'teacher'
      and coalesce(e.employment_status, 'active') = 'active'
      and p.contact_email is not null
  loop
    insert into public.users (id, email, full_name, first_name, last_name)
    values (r.auth_user_id, r.email, r.full_name,
            nullif(r.first_name, ''), nullif(r.last_name, ''))
    on conflict (id) do update
      set email     = excluded.email,
          full_name = coalesce(excluded.full_name, public.users.full_name);

    insert into public.user_roles (user_id, role_id)
    values (r.auth_user_id, v_teacher_role)
    on conflict do nothing;

    -- The revoke. A teacher is not a Team Member as well.
    if v_team_role is not null then
      delete from public.user_roles
       where user_id = r.auth_user_id
         and role_id = v_team_role;
    end if;

    insert into public.user_org_assignments
      (user_id, school_id, all_campuses, all_programs, is_primary)
    values (r.auth_user_id, r.school_id, true, true, true)
    on conflict do nothing;

    update public.employees
       set user_id = r.auth_user_id, updated_at = now()
     where id = r.employee_id;

    v_linked := v_linked + 1;
  end loop;

  raise notice 'Teachers linked or refreshed: %', v_linked;
end $$;

commit;

-- ===========================================================================
-- THE REPORT. Read all four.
-- ===========================================================================

-- 1. Every active teacher and whether they can sign in now. 'NO LOGIN' means
--    no auth account exists at that address yet - create it in Supabase Auth
--    and run this file again. It is safe to run any number of times.
select
  '1. teacher'                                        as section,
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, e.employee_number
  )                                                   as person,
  coalesce(p.contact_email, '(no address on file)')   as detail,
  case when e.user_id is null then 'NO LOGIN' else 'can sign in' end as status
from public.employees e
left join public.employee_profiles p on p.employee_id = e.id
where e.employee_type = 'teacher'
  and coalesce(e.employment_status, 'active') = 'active'

union all

-- 2. Anyone still carrying TEAM_MEMBER alongside a real role.
--    EXPECT NOTHING. A name here is a teacher wearing somebody else's role.
select
  '2. STILL A TEAM MEMBER - LOOK',
  coalesce(u.full_name, u.email, u.id::text),
  string_agg(r.name, ', ' order by r.name),
  ''
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where u.id in (
  select ur2.user_id from public.user_roles ur2
  join public.roles r2 on r2.id = ur2.role_id
  where r2.name = 'TEAM_MEMBER'
)
group by u.id, u.full_name, u.email
having count(*) > 1

union all

-- 3. The four rows each linked teacher needs. Any 'MISSING' here is a teacher
--    who signs in and finds a screen that does not work.
select
  '3. rows for ' || coalesce(u.full_name, u.email),
  case when exists (select 1 from public.user_roles ur
                     join public.roles r on r.id = ur.role_id
                    where ur.user_id = u.id and r.name = 'TEACHER')
       then 'TEACHER role yes' else 'TEACHER role MISSING' end,
  case when exists (select 1 from public.user_org_assignments a
                    where a.user_id = u.id)
       then 'campus yes' else 'campus MISSING' end,
  case when exists (select 1 from public.employees e2
                    where e2.user_id = u.id)
       then 'employee link yes' else 'employee link MISSING' end
from public.users u
where u.id in (select user_id from public.employees where user_id is not null)

union all

-- 4. Teachers with no address on file. They cannot be matched to an auth
--    account by this migration at all, and need contact_email filled in first.
select
  '4. no address on file',
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, e.employee_number
  ),
  '', ''
from public.employees e
left join public.employee_profiles p on p.employee_id = e.id
where e.employee_type = 'teacher'
  and coalesce(e.employment_status, 'active') = 'active'
  and (p.contact_email is null or trim(p.contact_email) = '')

order by 1, 2;
