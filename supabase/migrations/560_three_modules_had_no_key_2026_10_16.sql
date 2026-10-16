-- ============================================================================
-- 560  THREE MODULES HAD NO KEY
--      16 October 2026
-- ============================================================================
--
-- JIMMY, 16 OCTOBER 2026, asked which of the six modules shown to everybody
-- Mahogany Murphy may keep: "just admissions n families".
--
-- So five come off her sidebar: Founder Morning Brief, Communications,
-- Workflows, Calendar and Documents. Students stays - he asked for "view and
-- edit; all student. quiet, enrolled and pipeline", and enrolled children live
-- in that module.
--
-- ── WHY A MIGRATION AT ALL ──────────────────────────────────────────────────
--
-- MODULE_REQUIRED_PERMISSIONS in src/lib/dashboard/module-visibility.ts names
-- the permission that reveals each module, and its own comment is explicit
-- that A MODULE ABSENT FROM THAT MAP IS SHOWN TO EVERYONE. Two of the five can
-- be mapped to keys that already exist:
--
--   Founder Morning Brief   executive.dashboard   9 roles hold it
--   Workflows               workflows.view        6 roles hold it
--
-- THE OTHER THREE HAVE NO PERMISSION KEY IN THIS DATABASE AT ALL. Counted, not
-- assumed: platform_permissions has no row whose module is 'communications',
-- 'calendar' or 'documents', and no key named for them. They have been visible
-- to everyone since the sidebar existed because there has never been anything
-- to check.
--
-- ── NOBODY LOSES A MODULE THEY SEE TODAY ────────────────────────────────────
--
-- The three new keys are granted to EVERY ROLE EXCEPT the four that have no
-- business with a staff sidebar - VIRTUAL_COORDINATOR, GUEST, STUDENT and
-- PARENT. That is deliberately not "the roles that need them": the modules are
-- visible to everyone right now, so granting them to everyone-but-her leaves
-- today's screen exactly as it is for every other person and changes one.
--
-- A new key nothing else reads cannot grant access to anything. These three
-- are read by one map in one file, so the grant is a visibility fact and not
-- a widening of anyone's reach.
--
-- ── WHO IS AFFECTED BY THE TWO EXISTING KEYS, CHECKED BEFORE WRITING ────────
--
--   The 13 teachers        no sidebar at all. isTeacherOnly() redirects them
--                          to one page - Jimmy, 2 October: "no option or
--                          ability to go to or choose any other page or
--                          function in the jag. only this." TEACHER grants
--                          TEACHER_ACCESS through permission-groups, so all
--                          13 match. Unaffected.
--   Nina, Heather          SCHOOL_LEADER holds both keys. Unaffected.
--   Danni                  EXECUTIVE_DIRECTOR holds both. Unaffected.
--   Jimmy                  FOUNDER holds both. Unaffected.
--   jimmy.arispe@gmail.com TEAM_MEMBER alone - holds NEITHER. This account
--                          loses Founder Morning Brief and Workflows from its
--                          sidebar. It is Jimmy's own second account and he
--                          was told before this ran.
--
-- MAHOGANY IS NO LONGER TEACHER-ONLY, which is why she has a sidebar to
-- prune. 559 took TEACHER off her, and with it TEACHER_ACCESS.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_exist integer;
  n_two   integer;
begin
  select count(*) into n_exist
  from public.platform_permissions
  where permission_key in ('communications.view', 'calendar.view', 'documents.view');
  if n_exist <> 0 then
    raise exception 'Refusing: % of the three keys already exist. This has run.', n_exist;
  end if;

  -- THE TWO THIS FILE RELIES ON MUST BE REAL. Mapping a module to a key that
  -- does not exist hides it from everybody, permanently and silently.
  select count(*) into n_two
  from public.platform_permissions
  where permission_key in ('executive.dashboard', 'workflows.view');
  if n_two <> 2 then
    raise exception 'Refusing: executive.dashboard and workflows.view are not both present (found %).', n_two;
  end if;
end $$;

-- ── THE THREE KEYS ─────────────────────────────────────────────────────────

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  ('communications.view', 'View Communications',
   'See the Communications module in the sidebar. Visibility only - the letters themselves are governed by admissions and student permissions.',
   'communications', 'communications', 10),
  ('calendar.view', 'View Calendar',
   'See the Calendar module in the sidebar. Visibility only.',
   'calendar', 'calendar', 10),
  ('documents.view', 'View Documents',
   'See the Documents module in the sidebar. Visibility only - a document''s own access is decided where it lives.',
   'documents', 'documents', 10);

-- ── GRANTED TO EVERYONE WHO SEES THEM TODAY, WHICH IS EVERYONE BUT HER ──────

insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, k, 'allow'
from public.roles r
cross join (values ('communications.view'), ('calendar.view'), ('documents.view')) as t(k)
where r.name not in ('VIRTUAL_COORDINATOR', 'GUEST', 'STUDENT', 'PARENT');

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  n_keys   integer;
  n_grants integer;
  n_roles  integer;
  n_hers   integer;
  n_nina   integer;
begin
  select count(*) into n_keys
  from public.platform_permissions
  where permission_key in ('communications.view', 'calendar.view', 'documents.view');
  if n_keys <> 3 then
    raise exception 'Refusing: % of the three keys landed.', n_keys;
  end if;

  select count(*) into n_roles from public.roles
  where name not in ('VIRTUAL_COORDINATOR', 'GUEST', 'STUDENT', 'PARENT');

  select count(*) into n_grants
  from public.platform_role_permissions
  where permission_key in ('communications.view', 'calendar.view', 'documents.view');
  if n_grants <> n_roles * 3 then
    raise exception 'Refusing: % grants written, expected % (% roles x 3).', n_grants, n_roles * 3, n_roles;
  end if;

  -- SHE MUST NOT HAVE THEM, which is the entire point of the file.
  select count(*) into n_hers
  from public.user_roles u
  join public.platform_role_permissions p on p.role_id = u.role_id
  where u.user_id = '1c3f0db3-f21f-43d3-9505-fda92b127f24'
    and p.permission_key in ('communications.view', 'calendar.view', 'documents.view',
                             'executive.dashboard', 'workflows.view', 'workflows.manage');
  if n_hers <> 0 then
    raise exception 'Refusing: Mahogany can reach % of the five hidden modules.', n_hers;
  end if;

  -- AND NINA MUST STILL SEE EVERY ONE OF THE FIVE. The failure this guards
  -- against is a map entry naming a key nobody holds, which hides a module
  -- from the person whose job it is.
  select count(*) into n_nina
  from public.user_roles u
  join public.platform_role_permissions p on p.role_id = u.role_id
  where u.user_id = '71c13ddb-1cd4-4bca-bd8f-3a824f22ece2'
    and p.permission_key in ('communications.view', 'calendar.view', 'documents.view',
                             'executive.dashboard', 'workflows.view');
  if n_nina <> 5 then
    raise exception 'Refusing: Nina can reach only % of the 5 keys the sidebar now needs.', n_nina;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - the five modules, and who can still open each
-- ============================================================================

select p.permission_key, count(distinct u.user_id) as people_who_hold_it
from public.platform_role_permissions p
left join public.user_roles u on u.role_id = p.role_id
where p.permission_key in ('executive.dashboard', 'workflows.view',
                           'communications.view', 'calendar.view', 'documents.view')
group by p.permission_key
order by p.permission_key;

select u.email, count(p.permission_key) as of_the_five
from public.users u
join public.user_roles ur on ur.user_id = u.id
left join public.platform_role_permissions p
       on p.role_id = ur.role_id
      and p.permission_key in ('executive.dashboard', 'workflows.view',
                               'communications.view', 'calendar.view', 'documents.view')
where u.email in ('mahogany.murphy@theacademyway.org', 'nina.gaddy@theacademyga.org',
                  'heather.brown@theacademyway.org', 'danni.treu@theacademyway.org',
                  'jimmy.arispe@theacademyway.org', 'jimmy.arispe@gmail.com')
group by u.email
order by u.email;
