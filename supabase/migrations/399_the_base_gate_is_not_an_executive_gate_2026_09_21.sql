-- ===========================================================================
-- THE BASE GATE IS NOT AN EXECUTIVE GATE  -  399  -  2026-09-21
--
-- Signing in as a test teacher showed Executive Workspace, Mission Control,
-- Briefings, KPIs, Board Reports and the entire Intelligence section. The
-- sidebar filter was correct. The permission set was not.
--
-- TWO SOURCES, and the code half is already fixed in this commit:
--
--   1. src/lib/platform/identity/permission-groups.ts granted
--      mission_control.access, executive.dashboard, executive.intelligence
--      and school.configure from the ACADEMYOS_ACCESS group - the "you may
--      use the platform" gate that TEAM_MEMBER, the default role for every
--      newly provisioned user, maps to and nothing else.
--
--   2. THIS FILE. Migration 175 additionally wrote mission_control.access to
--      TEAM_MEMBER as a platform_role_permissions row. The code fix alone
--      leaves Mission Control on screen, because loadUserPermissions() adds
--      database rows on top of the mapped set.
--
-- WHY DENY RATHER THAN DELETE. Migration 175 inserts with
-- `on conflict (role_id, permission_key) do nothing`, so a deleted row comes
-- straight back if 175 is ever replayed. A deny row survives that, and deny
-- outranks allow everywhere it is read - loadUserPermissionsWithClient() and
-- public.has_permission() both subtract denies last. Migration 357 closed the
-- School Leader hole the same way.
--
-- WHO IS AFFECTED. Only people holding TEAM_MEMBER. Jimmy Arispe holds
-- FOUNDER, Danni Treu holds EXECUTIVE_DIRECTOR + JAG_ORG_ADMIN +
-- PLATFORM_OWNER, Stacy Kenworthy holds CEO + PLATFORM_OWNER, and Heather
-- Badger-Brown and Nina Gaddy hold SCHOOL_LEADER, which carries its own
-- mission_control.access row from migration 074. None of them lose anything.
-- ===========================================================================

insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, 'mission_control.access', 'deny'
from public.roles r
where r.name = 'TEAM_MEMBER'
on conflict (role_id, permission_key) do update
  set effect = 'deny';

-- ===========================================================================
-- VERIFY. Read all four before trusting this.
-- ===========================================================================

-- 1. The deny is on record. EXPECT exactly one row saying 'deny'.
--    Empty means the insert matched no TEAM_MEMBER role and nothing changed.
select
  '1. TEAM_MEMBER mission_control' as check,
  prp.effect                       as detail,
  ''                               as extra
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where r.name = 'TEAM_MEMBER'
  and prp.permission_key = 'mission_control.access'

union all

-- 2. Anyone still ALLOWED mission_control.access through TEAM_MEMBER.
--    EXPECT NOTHING. A name here means the deny did not take.
select
  '2. STILL ALLOWED - LOOK',
  coalesce(u.full_name, u.email, u.id::text),
  ''
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
join public.platform_role_permissions prp
  on prp.role_id = r.id
 and prp.permission_key = 'mission_control.access'
 and prp.effect = 'allow'
where r.name = 'TEAM_MEMBER'

union all

-- 3. People holding TEAM_MEMBER as well as a real role. Provisioning gives
--    TEAM_MEMBER to everyone on first login and nothing ever takes it away,
--    so a teacher granted TEACHER keeps both. Each name here is carrying a
--    role that is not theirs.
select
  '3. holds TEAM_MEMBER plus another role',
  coalesce(u.full_name, u.email, u.id::text),
  string_agg(r.name, ', ' order by r.name)
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where u.id in (
  select ur2.user_id
  from public.user_roles ur2
  join public.roles r2 on r2.id = ur2.role_id
  where r2.name = 'TEAM_MEMBER'
)
group by u.id, u.full_name, u.email
having count(*) > 1

union all

-- 4. Who holds TEAM_MEMBER at all, real role or not.
select
  '4. holds TEAM_MEMBER',
  coalesce(u.full_name, u.email, u.id::text),
  ''
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where r.name = 'TEAM_MEMBER'

order by 1, 2;
