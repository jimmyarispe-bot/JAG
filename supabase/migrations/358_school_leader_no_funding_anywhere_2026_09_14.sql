-- ===========================================================================
-- THE MONEY KEEPS FINDING A PREFIX NOBODY WROTE DOWN
-- 14 September 2026
-- ===========================================================================
--
-- After 357 ran, this was still allowed to SCHOOL_LEADER:
--
--     ssis.funding.view
--
-- Student Success describes its own contents as "Funding, scholarships, and
-- state funding center". So per-student scholarship and state funding amounts
-- were still on Nina Gaddy's screen, inside a module she is supposed to have.
--
-- THIS IS THE THIRD TIME, AND THE PATTERN IS THE POINT.
--
--   349 denied `funding.%`      — missed `ssis.funding.view`, wrong prefix
--   349 denied `payroll.%`      — missed `hr.*`, whose landing page IS payroll
--   357 denied `hr.%`           — missed `ssis.funding.view`, wrong prefix again
--
-- Every one of those matched the START of a key. Money does not respect
-- prefixes: it appears wherever a module decides to surface it, under whatever
-- namespace that module owns.
--
-- SO THIS MATCHES THE WORD ANYWHERE IN THE KEY. Not `funding.%` but any key
-- containing "funding", at any position, in any namespace, present or future.
-- A module invented next year called `wellbeing.tuition_support.view` is caught
-- by this and would have been missed by all three migrations above.
--
-- WHAT IS DELIBERATELY NOT DENIED. `admissions.%`, on the same reasoning 349
-- gave: admissions is the entire point of the role, and the funding pages inside
-- admissions are guarded separately in the application. Denying them here would
-- take away the job rather than the money.
--
-- Nothing academic contains these words. Checked against the keys SCHOOL_LEADER
-- actually holds: scheduling.*, instruction.*, students.*, teacher.*, ssis.score,
-- ssis.timeline, compliance.*, work.* — none of them match, so this cannot reach
-- attendance, grades or schedules.
--
-- `deny` not delete, unchanged from 349 and 357: the TypeScript role map grants
-- these independently and does not read this table.
--
-- Safe to re-run.
-- ===========================================================================

insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'deny'
from public.roles r
cross join public.platform_permissions p
where r.name = 'SCHOOL_LEADER'
  and p.permission_key ~* '(fund|scholarship|tuition|payment|invoice|billing|financ|payroll|compensation|revenue|budget|tax|salary|wage|stipend|reimburs)'
  and p.permission_key not like 'admissions.%'
on conflict (role_id, permission_key) do update
  set effect = 'deny';

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. ANY key containing a money word, anywhere, still allowed. EXPECT NOTHING
--    except admissions keys, which are kept on purpose.
select
  '1. money-shaped and STILL ALLOWED' as check,
  prp.permission_key as detail,
  coalesce(p.module, '(no catalog row)') as extra
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
left join public.platform_permissions p on p.permission_key = prp.permission_key
where r.name = 'SCHOOL_LEADER'
  and prp.effect = 'allow'
  and prp.permission_key ~* '(fund|scholarship|tuition|payment|invoice|billing|financ|payroll|compensation|revenue|budget|tax|salary|wage|stipend|reimburs)'

union all

-- 2. What this migration denied. ssis.funding.view must appear here.
select '2. denied by 358', prp.permission_key, prp.effect
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where r.name = 'SCHOOL_LEADER'
  and prp.effect = 'deny'
  and prp.permission_key ~* '(fund|scholarship|tuition|payment|invoice|billing|financ|payroll|compensation|revenue|budget|tax|salary|wage|stipend|reimburs)'

union all

-- 3. The academic work is untouched. Expect attendance, grades, schedules,
--    students, instruction, teacher — all still 'allow'. If this thins out, stop.
select '3. academic kept', prp.permission_key, prp.effect
from public.platform_role_permissions prp
join public.roles r on r.id = prp.role_id
where r.name = 'SCHOOL_LEADER'
  and prp.effect = 'allow'
  and prp.permission_key ~* '^(students?|scheduling|instruction|teacher|attendance|grades|ssis|admissions)\.'

order by 1, 2;
