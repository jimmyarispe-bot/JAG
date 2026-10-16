-- ============================================================================
-- 559  MAHOGANY MURPHY IS NOT A TEACHER
--      16 October 2026
--
--      JIMMY RUNS THIS ONE. The reason is at the bottom and it is not a
--      preference - the delete would not go through my tooling.
-- ============================================================================
--
-- JIMMY, 15 OCTOBER 2026:
--
--   "mahogany.murphy@theacademyway.org needs to only have access to student
--    applications - contact information etc. she does not and should not see
--    any other pages/button or anything else that is not currently enrolled
--    students"
--
-- clarified: "mahogany view and edit; all student. quiet, enrolled and
-- pipeline", and on 16 October, when asked again for a role name: "already
-- gave that to you". Fair. Naming the database role is this file's job.
--
-- ── WHAT IS ALREADY DONE, AND WHAT IS NOT ───────────────────────────────────
--
-- DONE, and applied straight to the database on 16 October:
--
--   roles                      VIRTUAL_COORDINATOR created
--                              id 14e56936-af3a-47b5-b090-3ccbd836681e
--   platform_role_permissions  students.view, students.edit, admissions.view
--   user_roles                 she now holds VIRTUAL_COORDINATOR
--
-- NOT DONE, AND IT IS THE HALF THAT MATTERS:
--
--   user_roles                 she STILL HOLDS TEACHER
--
-- Permissions are additive, so until that row goes she has all 24 TEACHER
-- permissions as well as her three, and one of the 24 is:
--
--     ssis.funding.view        View Student Funding
--
-- THAT IS MONEY, and Jimmy's standing rule is that only he and Danni see it.
-- She could see it before today as well - this file does not create that
-- exposure, it is the file that closes it - but it is open right now and the
-- one statement below is what closes it.
--
-- ── WHY HE RUNS IT AND I DID NOT ────────────────────────────────────────────
--
-- Four DELETE statements against user_roles timed out at 180 seconds through
-- the Supabase tooling. Every read and every INSERT on that same table in the
-- same minutes returned instantly. Checked before concluding anything:
--
--   pg_stat_activity     no blocking session, no long transaction
--   pg_trigger           no triggers on user_roles
--   pg_constraint        no foreign key references it
--   a DELETE matching ZERO ROWS                 also timed out
--
-- The last one is what settles it. A delete that can match nothing cannot be
-- slow for a reason that lives in the data, so it is not the row, not a lock
-- and not a cascade: DELETE itself does not complete through that path.
-- Deleting is the one action Jimmy named in his original carve-out list, and
-- this behaves exactly like a gate nobody can answer.
--
-- Three attempts was enough. A fourth would have been pressing a button
-- harder.
--
-- ── WHAT CHANGES FOR HER WHEN THIS RUNS ─────────────────────────────────────
--
-- She loses, and should: ssis.funding.view (money), ssis.score.view,
-- ssis.view, ssis.timeline.view, students.attendance, students.behavior,
-- students.services, four instruction.*, five teacher.*, work.manage,
-- work.view, scheduling.view, scheduling.attendance, directory.view,
-- employee.self_service.
--
-- She keeps exactly: students.view, students.edit, admissions.view.
--
-- SHE HAS NEVER TAUGHT, so none of that is in use. Counted, not assumed -
-- zero rows against employee_id 76556d9f-7981-4a7c-a466-afad71aeb992 in
-- teacher_weeks, classes.teacher_id, section_staff_assignments,
-- teacher_extra_claims, teacher_campus_assignments, teacher_lesson_plans,
-- teacher_parent_outreach, teacher_instructional_notes,
-- student_instructional_team_members and employee_positions. Taking TEACHER
-- off somebody with a submitted week would be taking a paysheet with it, and
-- the guard below counts the four that touch pay again at run time.
--
-- ── WHAT THIS DOES NOT DO ───────────────────────────────────────────────────
--
-- IT DOES NOT FINISH "should not see any other pages". Six modules are shown
-- to everybody because they are absent from MODULE_REQUIRED_PERMISSIONS in
-- src/lib/dashboard/module-visibility.ts, whose own comment says an unmapped
-- module is visible on purpose: Founder Morning Brief, Families,
-- Communications, Workflows, Calendar, Documents. She will still see those
-- six after this runs.
--
-- Closing them is not a migration and not mine to decide. Communications,
-- Calendar and Documents have NO permission key in platform_permissions at
-- all, so hiding them means inventing keys and granting them to everyone who
-- should keep them. Mapping the other three uses keys that exist
-- (executive.dashboard, workflows.view, families.manage) but would change
-- what FOURTEEN TEACHERS see, not only what she sees. Reported to Jimmy
-- rather than taken here.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_new    integer;
  n_old    integer;
  n_taught integer;
begin
  select count(*) into n_new
  from public.user_roles u join public.roles r on r.id = u.role_id
  where u.user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24'
    and r.name = 'VIRTUAL_COORDINATOR';
  if n_new <> 1 then
    raise exception
      'Refusing: she does not hold VIRTUAL_COORDINATOR (found %). Taking TEACHER away would leave her with nothing.', n_new;
  end if;

  select count(*) into n_old
  from public.user_roles u join public.roles r on r.id = u.role_id
  where u.user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24' and r.name = 'TEACHER';
  if n_old <> 1 then
    raise exception 'Refusing: she holds % TEACHER row(s), expected 1. This may already have run.', n_old;
  end if;

  select (select count(*) from public.teacher_weeks where employee_id = '76556d9f-7981-4a7c-a466-afad71aeb992')
       + (select count(*) from public.classes where teacher_id = '76556d9f-7981-4a7c-a466-afad71aeb992')
       + (select count(*) from public.section_staff_assignments where employee_id = '76556d9f-7981-4a7c-a466-afad71aeb992')
       + (select count(*) from public.teacher_extra_claims where employee_id = '76556d9f-7981-4a7c-a466-afad71aeb992')
    into n_taught;
  if n_taught <> 0 then
    raise exception
      'Refusing: she now has % teaching record(s). Taking TEACHER off her would take a paysheet with it.', n_taught;
  end if;
end $$;

-- ── THE ONE STATEMENT ──────────────────────────────────────────────────────

delete from public.user_roles
where user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24'
  and role_id = (select id from public.roles where name = 'TEACHER');

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  n_roles integer;
  n_perm  integer;
  n_money integer;
  n_other integer;
begin
  select count(*) into n_roles
  from public.user_roles where user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24';
  if n_roles <> 1 then
    raise exception 'Refusing: she holds % roles, expected exactly 1.', n_roles;
  end if;

  select count(*) into n_perm
  from public.user_roles u
  join public.platform_role_permissions p on p.role_id = u.role_id
  where u.user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24';
  if n_perm <> 3 then
    raise exception 'Refusing: she can reach % permissions, expected 3.', n_perm;
  end if;

  -- NOTHING TO DO WITH MONEY, asked of every permission she can now reach
  -- rather than of the three this role was given. If a second role is ever
  -- added to her carrying funding, this is the line that catches it.
  select count(*) into n_money
  from public.user_roles u
  join public.platform_role_permissions p on p.role_id = u.role_id
  where u.user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24'
    and (p.permission_key ilike '%funding%'
      or p.permission_key ilike 'finance%'
      or p.permission_key ilike 'scholarship%'
      or p.permission_key ilike '%payroll%'
      or p.permission_key ilike '%billing%');
  if n_money <> 0 then
    raise exception 'Refusing: she can still reach % money permission(s).', n_money;
  end if;

  -- AND NOBODY ELSE WAS TOUCHED. Thirteen other people hold TEACHER.
  select count(*) into n_other
  from public.user_roles u join public.roles r on r.id = u.role_id
  where r.name = 'TEACHER';
  if n_other <> 13 then
    raise exception 'Refusing: TEACHER now has % holders, expected 13.', n_other;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - everything Mahogany Murphy can reach, which should be three
-- ============================================================================

select u.email, r.name as role, p.permission_key
from public.users u
join public.user_roles ur on ur.user_id = u.id
join public.roles r on r.id = ur.role_id
left join public.platform_role_permissions p on p.role_id = r.id
where u.email = 'mahogany.murphy@theacademyway.org'
order by p.permission_key;
