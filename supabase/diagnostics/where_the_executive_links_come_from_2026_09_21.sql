-- ===========================================================================
-- WHERE THE EXECUTIVE LINKS COME FROM  -  2026-09-21
--
-- READ ONLY. Four selects. No insert, no update, no delete, no drop.
--
-- WHY THIS EXISTS. The first query asked what the role named TEACHER is
-- allowed, and the answer had nothing executive in it. That answer was true
-- and useless, because the application does not read the role you hold. It
-- calls public.user_role_ids(), which walks UP roles.parent_role_id and
-- returns your role plus every ancestor, then grants the union of all of them.
--
-- Migration 074 wrote the chain:
--     CEO -> EXECUTIVE_DIRECTOR -> REGIONAL_DIRECTOR -> SCHOOL_LEADER -> ADMISSIONS
--     EMPLOYEE -> TEACHER
--
-- Read as inheritance, ADMISSIONS inherits CEO.
--
-- WHAT EMPTY MEANS, before it runs.
--   A empty -> TEACHER has no parent, the chain is not the cause, and I am
--              wrong for the second time tonight.
--   B empty -> nothing executive-shaped reaches a teacher by inheritance.
--              Then the links came from the viewing session, not the role,
--              and the next thing to check is impersonation.
--   C empty -> impossible if A returned rows; treat it as a broken query.
--   D empty -> no deny rows anywhere. Expected for TEACHER. NOT expected for
--              SCHOOL_LEADER, which migration 357 denied on 14 September. If
--              D shows no SCHOOL_LEADER rows, 357 did not survive.
-- ===========================================================================

with recursive chain as (
  -- every role, seeded as its own root
  select r.id as root_id, r.name as root_name, r.id as anc_id, r.parent_role_id, 0 as depth
  from public.roles r
  union
  -- climb to the parent, carrying the root along
  select c.root_id, c.root_name, p.id, p.parent_role_id, c.depth + 1
  from public.roles p
  join chain c on p.id = c.parent_role_id
),
executive_shaped as (
  select prp.role_id, prp.permission_key, prp.effect
  from public.platform_role_permissions prp
  where (
       prp.permission_key like 'executive.%'
    or prp.permission_key like 'edi.%'
    or prp.permission_key like 'network.%'
    or prp.permission_key like 'finance.%'
    or prp.permission_key like 'payroll.%'
    or prp.permission_key in (
         'mission_control.access', 'global.reporting',
         'FINANCE_ACCESS', 'HR_ACCESS', 'PAYROLL_ACCESS'
       )
  )
)

-- A. The ancestor chain for TEACHER. Depth 0 is TEACHER itself.
select
  'A. TEACHER chain'                       as section,
  c.depth::text || ' ' || anc.name         as detail,
  coalesce(anc.display_name, '')           as extra
from chain c
join public.roles anc on anc.id = c.anc_id
where c.root_name = 'TEACHER'

union all

-- B. Executive-shaped keys a TEACHER actually receives, and which ancestor
--    hands each one over. Every row here is a link on a teacher's screen.
select
  'B. TEACHER inherits'                    as section,
  e.permission_key                         as detail,
  'from ' || anc.name || ' (' || e.effect || ')'
from chain c
join public.roles anc on anc.id = c.anc_id
join executive_shaped e on e.role_id = c.anc_id
where c.root_name = 'TEACHER'
  and e.effect = 'allow'

union all

-- C. The whole network picture: how many executive-shaped keys each role
--    reaches through inheritance. This is the blast radius, not just teachers.
select
  'C. blast radius'                        as section,
  c.root_name                              as detail,
  count(*) filter (where e.effect = 'allow')::text || ' allowed, '
    || count(*) filter (where e.effect <> 'allow')::text || ' denied'
from chain c
join executive_shaped e on e.role_id = c.anc_id
group by c.root_name
having count(*) filter (where e.effect = 'allow') > 0

union all

-- D. Every explicit deny that exists, by role. Migration 357 should appear
--    here under SCHOOL_LEADER. If it does not, 357 was undone.
select
  'D. denies on record'                    as section,
  r.name                                   as detail,
  count(*)::text || ' denied keys'
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where prp.effect <> 'allow'
group by r.name

order by 1, 2;
