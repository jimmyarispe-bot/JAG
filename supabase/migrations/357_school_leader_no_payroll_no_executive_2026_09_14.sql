-- ===========================================================================
-- A SCHOOL LEADER WAS LOOKING AT PAYROLL
-- 14 September 2026
-- ===========================================================================
--
-- WHAT WAS SEEN. Nina Gaddy, SCHOOL_LEADER, signed in and her sidebar carried
-- Human Capital & Workforce, Executive Workspace, Mission Control, and the
-- whole executive band — Forecasting, Risk, Scenarios, Decisions,
-- Recommendations, Strategy, Benchmarks, Capacity, Intelligence Network.
--
-- /dashboard/hr opens with "What is the workforce actually costing?" and, in
-- her own words on screen, teacher and contractor pay per campus straight from
-- the QuickBooks books: $140,236 across 16 people at Virtual and HS.
--
-- THE REQUIREMENT, restated by Jimmy today: she should only see academic,
-- child-related information — attendance, grades, schedules. Teacher Studio and
-- Scheduling stay, confirmed. Everything else above goes.
--
-- WHY 349 DID NOT CATCH IT. 349 was written to the requirement as it was given
-- in September — "never see anything about money, scholarships, funds, funding,
-- taxes" — and it denies exactly those: finance, scholarships, funding,
-- accounting, payroll, banking, billing.
--
-- It does not deny `hr`. Payroll reached her through the one door that is not
-- called payroll: the workforce module, whose landing page is contractor and
-- teacher pay. The deny list named the money by its own vocabulary, and HR keeps
-- the same numbers under a different word.
--
-- Nor does it deny the executive surfaces, which were never in scope then.
--
-- WHY THESE KEYS. Not guessed from module names — read from
-- intelligence-navigation.ts, which is what actually decides whether those
-- sidebar items appear:
--
--   EXECUTIVE_ENTRY = executive.intelligence, executive.dashboard,
--                     global.reporting, edi.view, edi.executive, edi.manage,
--                     edi.board
--   plus mission_control.access, executive.board_reports, executive.risk_view,
--        executive.strategic, network.view, network.manage, network.admin
--
-- and MODULE_REQUIRED_PERMISSIONS.hr = hr.view, hr.manage, HR_ACCESS.
--
-- WHY `deny` AND NOT DELETE — unchanged from 349, and it still matters. Two
-- layers grant these: this table, and a hard-coded TypeScript role map that does
-- not read this table. Deleting a row here leaves the code map intact and the
-- permission still granted. `has_permission()` checks deny first and returns
-- false; loadUserPermissions subtracts denied keys after expanding the mapped
-- set. One row, both layers.
--
-- WHY DRIVEN OFF THE CATALOG. Hand-typing the list is how `hr` got missed in
-- the first place. This selects from platform_permissions by module AND by key
-- pattern, so a new executive or workforce permission added later is denied by
-- re-running this rather than by somebody remembering.
--
-- Safe to re-run.
-- ===========================================================================

insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'deny'
from public.roles r
cross join public.platform_permissions p
where r.name = 'SCHOOL_LEADER'
  and (
        p.module in (
          'hr', 'workforce', 'human_capital', 'people', 'staff',
          'executive', 'intelligence', 'network', 'edi', 'strategy'
        )
     or p.permission_key like 'hr.%'
     or p.permission_key like 'executive.%'
     or p.permission_key like 'edi.%'
     or p.permission_key like 'network.%'
     or p.permission_key like 'mission_control.%'
     or p.permission_key like 'workforce.%'
     or p.permission_key like 'payroll.%'
     or p.permission_key like 'compensation.%'
     or p.permission_key in (
          'HR_ACCESS', 'WORKFORCE_ACCESS', 'EXECUTIVE_ACCESS',
          'global.reporting'
        )
  )
  -- ------------------------------------------------------------------------
  -- THE KEEP LIST. Everything a School Leader's job actually needs. Written as
  -- exclusions rather than trusted to the patterns above, because the cost of
  -- this migration going one key too far is Nina locked out of her own campus
  -- on a Monday.
  --
  -- `instruction.executive` and `scheduling.executive` are deliberately safe:
  -- they are prefixed instruction./scheduling. and never matched by
  -- 'executive.%'. They gate teacher attendance and upcoming classes, which are
  -- academic.
  -- ------------------------------------------------------------------------
  and p.permission_key not like 'admissions.%'
  and p.permission_key not like 'students.%'
  and p.permission_key not like 'student.%'
  and p.permission_key not like 'scheduling.%'
  and p.permission_key not like 'teacher.%'
  and p.permission_key not like 'instruction.%'
  and p.permission_key not like 'attendance.%'
  and p.permission_key not like 'grades.%'
  and p.permission_key not like 'school.%'
  and p.permission_key not like 'calendar.%'
  and p.permission_key not like 'documents.%'
  and p.permission_key not like 'communications.%'
  and p.permission_key not in ('ACADEMYOS_ACCESS', 'ADMISSIONS_ACCESS', 'TEACHER_ACCESS')
on conflict (role_id, permission_key) do update
  set effect = 'deny';

-- ===========================================================================
-- VERIFY. Read all four sections before trusting this.
-- ===========================================================================

-- 1. Who holds SCHOOL_LEADER. Expect Heather Badger-Brown and Nina Gaddy and
--    nobody else. A third name here means this migration just changed what that
--    person can see too.
select '1. holds SCHOOL_LEADER' as check, u.full_name as detail, u.email as extra
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where r.name = 'SCHOOL_LEADER'

union all

-- 2. Still ALLOWED and money- or executive-shaped. EXPECT NOTHING. A row here
--    is a key that reached her screen and still does.
select '2. STILL ALLOWED - LOOK', prp.permission_key, coalesce(p.module, '(no catalog row)')
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
left join public.platform_permissions p on p.permission_key = prp.permission_key
where r.name = 'SCHOOL_LEADER'
  and prp.effect = 'allow'
  and (
       prp.permission_key ~ '^(hr|executive|edi|network|mission_control|workforce|payroll|compensation|finance|fi|scholarships|funding|billing|accounting|banking|tuition|tax)\.'
    or prp.permission_key in ('HR_ACCESS','WORKFORCE_ACCESS','EXECUTIVE_ACCESS','FINANCE_ACCESS','global.reporting')
  )

union all

-- 3. What she keeps. Expect admissions, students, scheduling, teacher,
--    instruction, calendar, documents, communications. If this is thin, the
--    migration went too far and she cannot do her job.
select '3. kept', prp.permission_key, prp.effect
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where r.name = 'SCHOOL_LEADER'
  and prp.effect = 'allow'

union all

-- 4. How many keys this migration denied in total.
select '4. denied count', count(*)::text, ''
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where r.name = 'SCHOOL_LEADER' and prp.effect = 'deny'

order by 1, 2;
