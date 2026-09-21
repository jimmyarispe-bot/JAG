-- 396_give_the_test_teacher_a_way_in_2026_09_21.sql
--
-- Links the auth account created in the Supabase dashboard to the ZZZ TEST
-- teacher that migration 394 built, so the weekly submission screen can finally
-- be walked end to end by somebody who is not a Founder.
--
-- WHY THIS IS FOUR ROWS AND NOT ONE
--
--   users                 the platform's own record. auth.users is Supabase's;
--                         public.users is JAG's, and everything here joins to
--                         the second one.
--   user_roles -> TEACHER carries teacher.view / attendance / manage /
--                         communicate / compliance, granted by migration 084.
--   user_org_assignments  THE ONE THAT IS EASY TO FORGET. A user who is not a
--                         Founder gets accessibleSchoolIds from this table. With
--                         no row they are not refused - they simply see nothing,
--                         which reads as a broken screen rather than a missing
--                         permission.
--   employees.user_id     what getTeacherEmployeeId reads. Without it the
--                         teacher pages redirect away and never say why.
--
-- MEASURED FIRST: on 20 September, all ELEVEN virtual teachers had no login at
-- all - 205 classes taught between Monday and Friday by people who could not
-- sign in to say so. This is the rehearsal for fixing that.

begin;

do $$
declare
  v_user_id     uuid := '7b298441-39c2-4196-b8c2-88facf58680d';
  v_employee_id uuid := '0ca6c35a-4d73-45f8-b697-bc254b239eb8';
  v_school_id   uuid;
  v_role_id     uuid;
begin
  -- Refuse rather than build half a teacher on a wrong id.
  if not exists (select 1 from public.employees where id = v_employee_id) then
    raise exception 'No employee %. Run 394 first, and use the employee_id it printed.', v_employee_id;
  end if;

  select school_id into v_school_id from public.employees where id = v_employee_id;

  select id into v_role_id from public.roles where name = 'TEACHER';
  if v_role_id is null then
    raise exception 'There is no TEACHER role. Nothing linked.';
  end if;

  insert into public.users (id, email, full_name, first_name, last_name)
  values (v_user_id, 'zzz.test.teacher@theacademyvirtual.org',
          'ZZZ TEST Teacher', 'ZZZ TEST', 'Teacher')
  on conflict (id) do update
    set email     = excluded.email,
        full_name = excluded.full_name;

  insert into public.user_roles (user_id, role_id)
  values (v_user_id, v_role_id)
  on conflict do nothing;

  insert into public.user_org_assignments
    (user_id, school_id, all_campuses, all_programs, is_primary)
  values (v_user_id, v_school_id, true, true, true)
  on conflict do nothing;

  update public.employees
     set user_id = v_user_id, updated_at = now()
   where id = v_employee_id;
end $$;

commit;

-- =========================================================================
-- THE REPORT
--
-- All five lines should read 'yes'. A 'MISSING' on user_org_assignments is the
-- one that looks like a broken screen rather than a permissions problem, so
-- read that line especially.
-- =========================================================================

select * from (
  select 1 as ord, 'platform user row exists' as fact,
         case when exists (select 1 from public.users
                            where id = '7b298441-39c2-4196-b8c2-88facf58680d')
              then 'yes' else 'MISSING' end as value
  union all
  select 2, 'has the TEACHER role',
         case when exists (select 1 from public.user_roles ur
                            join public.roles r on r.id = ur.role_id
                           where ur.user_id = '7b298441-39c2-4196-b8c2-88facf58680d'
                             and r.name = 'TEACHER')
              then 'yes' else 'MISSING' end
  union all
  select 3, 'assigned to a campus (or the screen shows nothing)',
         coalesce((select sc.name from public.user_org_assignments a
                     join public.schools sc on sc.id = a.school_id
                    where a.user_id = '7b298441-39c2-4196-b8c2-88facf58680d'
                    limit 1), 'MISSING')
  union all
  select 4, 'employees.user_id points at the account',
         case when exists (select 1 from public.employees
                            where id = '0ca6c35a-4d73-45f8-b697-bc254b239eb8'
                              and user_id = '7b298441-39c2-4196-b8c2-88facf58680d')
              then 'yes' else 'MISSING' end
  union all
  select 5, 'classes waiting for this teacher this week',
         (select count(*)::text from public.instructional_sessions
           where instructor_employee_id = '0ca6c35a-4d73-45f8-b697-bc254b239eb8'
             and scheduled_start >= '2026-09-21T00:00:00'
             and scheduled_start <= '2026-09-25T23:59:59')
) q
order by ord;
