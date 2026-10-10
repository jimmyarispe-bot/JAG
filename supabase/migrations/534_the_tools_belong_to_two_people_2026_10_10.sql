-- 534_the_tools_belong_to_two_people_2026_10_10.sql
--
-- RUN THIS *BEFORE* THE CODE DEPLOYS, which is the opposite of the usual rule
-- here and worth saying plainly. AdmissionsNavigation returns null when the
-- viewer lacks admissions.tools. If the code lands first, the permission does
-- not exist yet, nobody holds it, and JIMMY AND DANNI LOSE THE TABS TOO until
-- this runs. Nothing breaks and nothing is lost - the board still draws - but
-- the Lead List, Reporting, State Funding and the rest are unreachable in the
-- gap. Run this, then deploy.
--
-- ── WHAT THIS IS ────────────────────────────────────────────────────────────
--
-- Jimmy, 10 October 2026, looking at the two rows of tabs and buttons above
-- the admissions board:
--
--   "rename Admission Crm to Current Admissions Pipeline and take out all of
--    these highlighted for everyones view except mine"
--
-- and, asked who "everyone except me" leaves in: "me n danni".
--
-- ── WHY A PERMISSION AND NOT TWO NAMES ──────────────────────────────────────
--
-- founder-protection.ts states the rule this build follows: "Call sites must
-- never check role names - use authorize()/hasPermission()." Two email
-- addresses hard-coded in a component are two people nobody can change
-- without a deploy, and the third person added would be added in whichever
-- file somebody found first. A permission is one row.
--
-- FOUNDER and EXECUTIVE_DIRECTOR is exactly Jimmy and Danni today:
--
--   jimmy.arispe@theacademyway.org   FOUNDER
--   danni.treu@theacademyway.org     EXECUTIVE_DIRECTOR, JAG_ORG_ADMIN,
--                                    PLATFORM_OWNER
--
-- PLATFORM_OWNER was the obvious-looking choice and is the wrong one: Stacy
-- Kenworthy holds it too, with CEO. Jimmy named two people, so Stacy is not
-- granted here. One insert adds her if he wants her in - the CEO role id is
-- in the same roles table.
--
-- NOBODY ELSE COMES CLOSE. Nina Gaddy and Heather Badger-Brown are
-- SCHOOL_LEADER; everyone else is TEACHER or TEAM_MEMBER.
--
-- ── WHAT A SCHOOL LEADER SEES AFTER THIS ────────────────────────────────────
--
-- The board, and only the board. Not a reduction - until today Nina and
-- Heather did not land on the board at all, they landed on a task list and
-- reached the board through a tab. The code change that ships with this makes
-- everyone land on the board, because Jimmy asked where a school leader
-- should land and answered: "all land on the pipeline board".
--
-- What they lose is Add Lead and Bulk Import, deliberately. Jimmy: "school
-- leaders won't be able to add a lead without the parent going to the website
-- and completing the inquiry form." That is a rule about how a child enters
-- The JAG, not a missing button.
--
-- Safe to re-run: the permission is an upsert on its primary key, and the two
-- grants are upserts on (role_id, permission_key).

begin;

-- ── 1. The permission ────────────────────────────────────────────────────────
--
-- sort_order 53 puts it directly after admissions.manage (52) in the
-- permissions screen, where the three admissions keys already sit together.

insert into public.platform_permissions
  (permission_key, name, description, module, category, sort_order)
values
  ('admissions.tools',
   'Admissions Tools',
   'See the admissions tabs and tools above the pipeline board - Executive, '
   'Lead List, Reporting, Automation, Templates, State Funding, Add Lead and '
   'the rest. Without it, Admissions is the pipeline board and nothing else.',
   'admissions', 'admissions', 53)
on conflict (permission_key) do update set
  name        = excluded.name,
  description = excluded.description,
  module      = excluded.module,
  category    = excluded.category,
  sort_order  = excluded.sort_order;

-- ── 2. The two grants ────────────────────────────────────────────────────────
--
-- Role ids are looked up by name rather than written out, for the reason
-- migration 484 recorded: a hard-coded id that does not match makes the
-- insert a silent no-op, and the failure does not show until somebody opens
-- the page and finds the tabs gone.

do $$
declare
  granted integer := 0;
  r record;
begin
  for r in
    select id, name from public.roles
     where name in ('FOUNDER', 'EXECUTIVE_DIRECTOR')
  loop
    insert into public.platform_role_permissions (role_id, permission_key, effect)
    values (r.id, 'admissions.tools', 'allow')
    on conflict (role_id, permission_key) do update set effect = 'allow';

    granted := granted + 1;
  end loop;

  if granted <> 2 then
    raise exception
      'Expected FOUNDER and EXECUTIVE_DIRECTOR, granted % - check roles.name.',
      granted;
  end if;
end $$;

commit;

notify pgrst, 'reload schema';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT exactly three rows.
--
--   1  the permission exists                      admissions.tools
--   2  who holds it                               Danni Treu, Jimmy Arispe
--   3  COUNT school leaders who hold it           0   <- the one that matters
--
-- If row 3 reads anything but 0, a school leader still has the tools and the
-- gate has not done what it was written for.

select 1 as seq,
       'the permission exists' as check,
       coalesce(max(permission_key), '*** MISSING ***') as result
  from public.platform_permissions
 where permission_key = 'admissions.tools'

union all

select 2,
       'who holds it',
       coalesce(
         string_agg(distinct coalesce(u.first_name || ' ' || u.last_name, u.email), ', '
                    order by coalesce(u.first_name || ' ' || u.last_name, u.email)),
         '*** NOBODY ***')
  from public.platform_role_permissions rp
  join public.user_roles ur on ur.role_id = rp.role_id
  join public.users u on u.id = ur.user_id
 where rp.permission_key = 'admissions.tools'
   and rp.effect = 'allow'

union all

select 3,
       'COUNT school leaders who hold it',
       count(*)::text || case when count(*) = 0
                              then '  correct'
                              else '  *** A SCHOOL LEADER STILL SEES THE TOOLS ***' end
  from public.platform_role_permissions rp
  join public.roles r on r.id = rp.role_id
  join public.user_roles ur on ur.role_id = r.id
 where rp.permission_key = 'admissions.tools'
   and rp.effect = 'allow'
   and r.name = 'SCHOOL_LEADER'

 order by seq;
