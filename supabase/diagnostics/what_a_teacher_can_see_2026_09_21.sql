-- ===========================================================================
-- WHAT A TEACHER CAN SEE  -  2026-09-21
--
-- READ ONLY. This file changes nothing. Run it, read it, paste the results.
--
-- WHY. Signed in as the test teacher, the sidebar showed Executive Workspace,
-- Mission Control, Briefings, KPIs, Board Reports, and the whole Intelligence
-- section. It did NOT show Financial Intelligence.
--
-- That last omission is the important one. Financial Intelligence is filtered
-- by exactly the same code as the fourteen links that DID appear. So the
-- filter is working. The teacher is being shown those links because the
-- TEACHER role genuinely holds executive.* and mission_control.access in the
-- database. This is not a code bug. It is a grant nobody ever took back.
--
-- Migration 357 stripped SCHOOL_LEADER on 14 September. Nobody ever did the
-- same for TEACHER.
--
-- WHAT EMPTY MEANS, section by section. Read this BEFORE you run it.
--   Section 1 empty  -> no TEACHER role exists at all. That would be wrong;
--                       the test teacher was given it by migration 396.
--   Section 2 empty  -> the teacher holds nothing executive-shaped, and the
--                       sidebar screenshot came from some other cause. Good
--                       news, but it means I am wrong about the diagnosis.
--   Section 3 empty  -> the teacher holds NO permissions at all. That would
--                       mean Teacher Studio itself is reachable by some other
--                       route and stripping would be free.
--   Section 4 empty  -> no explicit denies are recorded yet. Expected.
-- ===========================================================================

-- 1. Does the role exist, and who holds it right now.
select
  '1. holds TEACHER'                as section,
  coalesce(u.full_name, '(no user row)') as detail,
  coalesce(u.email, '')             as extra
from public.user_roles ur
join public.roles r on r.id = ur.role_id
left join public.users u on u.id = ur.user_id
where r.name = 'TEACHER'

union all

-- 2. Executive- and money-shaped keys the TEACHER role is ALLOWED.
--    Every row here is a link on a teacher's screen.
select
  '2. ALLOWED and executive-shaped' as section,
  prp.permission_key,
  coalesce(p.module, '(no catalog row)')
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
left join public.platform_permissions p on p.permission_key = prp.permission_key
where r.name = 'TEACHER'
  and prp.effect = 'allow'
  and (
        prp.permission_key like 'executive.%'
     or prp.permission_key like 'edi.%'
     or prp.permission_key like 'finance.%'
     or prp.permission_key like 'network.%'
     or prp.permission_key like 'payroll.%'
     or prp.permission_key like 'scholarship%'
     or prp.permission_key like 'hr.%'
     or prp.permission_key in (
          'mission_control.access', 'global.reporting',
          'FINANCE_ACCESS', 'HR_ACCESS'
        )
  )

union all

-- 3. EVERYTHING the TEACHER role is allowed, so the keep list can be written
--    from what is really there instead of from what I assume is there.
select
  '3. all TEACHER allows'           as section,
  prp.permission_key,
  coalesce(p.module, '(no catalog row)')
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
left join public.platform_permissions p on p.permission_key = prp.permission_key
where r.name = 'TEACHER'
  and prp.effect = 'allow'

union all

-- 4. Anything already explicitly denied, so a second pass does not undo a
--    decision somebody already made on purpose.
select
  '4. already denied'               as section,
  prp.permission_key,
  coalesce(p.module, '(no catalog row)')
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
left join public.platform_permissions p on p.permission_key = prp.permission_key
where r.name = 'TEACHER'
  and prp.effect <> 'allow'

order by 1, 2;
