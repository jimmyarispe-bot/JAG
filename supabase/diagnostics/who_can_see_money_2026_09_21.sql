-- ===========================================================================
-- WHO CAN SEE MONEY  -  2026-09-21
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. Role inheritance means the role you were given is not the permission
-- set you got. public.user_role_ids() walks up roles.parent_role_id, so
-- ADMISSIONS reaches CEO. Arguing about roles in the abstract is a waste of a
-- Monday morning; this asks the only question that matters:
--
--     WHICH NAMED PEOPLE CAN SEE MONEY RIGHT NOW.
--
-- The standing rule is that only Danni and Jimmy see anything to do with
-- money. Section 2 is the test of that rule. Every name in it that is not
-- Danni or Jimmy is a person who can see the money today.
--
-- Denies are honoured the same way the application honours them: a deny on
-- ANY role in a person's expanded set removes that key, even when an ancestor
-- allows it. That is what migration 357 relied on.
--
-- WHAT EMPTY MEANS, before it runs.
--   1 empty -> no users hold any role. Impossible; treat as a broken query.
--   2 empty -> nobody outside the money keys at all. That would mean even you
--              and Danni cannot see finance, which would be wrong in the other
--              direction.
--   3 empty -> nobody holds ADMISSIONS. Then the 61-key blast radius is real
--              but unoccupied, and this is a trap to close, not a live leak.
-- ===========================================================================

with recursive expanded as (
  select ur.user_id, r.id as role_id, r.parent_role_id
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  union
  select e.user_id, p.id, p.parent_role_id
  from public.roles p
  join expanded e on p.id = e.parent_role_id
),
money_keys as (
  select prp.role_id, prp.permission_key, prp.effect
  from public.platform_role_permissions prp
  where prp.permission_key like 'finance.%'
     or prp.permission_key like 'payroll.%'
     or prp.permission_key like 'banking.%'
     or prp.permission_key like 'accounting.%'
     or prp.permission_key like 'tuition.%'
     or prp.permission_key like 'invoice.%'
     or prp.permission_key in (
          'FINANCE_ACCESS', 'PAYROLL_ACCESS', 'BANKING_ACCESS', 'ACCOUNTING_ACCESS'
        )
),
per_user as (
  select
    e.user_id,
    m.permission_key,
    bool_or(m.effect = 'allow')  as any_allow,
    bool_or(m.effect <> 'allow') as any_deny
  from expanded e
  join money_keys m on m.role_id = e.role_id
  group by e.user_id, m.permission_key
),
effective as (
  select user_id, permission_key
  from per_user
  where any_allow and not any_deny
)

-- 1. Every person and the roles they were given. Names, not ids.
select
  '1. who holds what'                        as section,
  coalesce(u.full_name, u.email, u.id::text) as person,
  string_agg(r.name, ', ' order by r.name)   as detail
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
group by u.id, u.full_name, u.email

union all

-- 2. THE RULE. Everyone who can effectively see money, and how many keys.
--    Every name here that is not Danni or Jimmy is a finding.
select
  '2. CAN SEE MONEY'                         as section,
  coalesce(u.full_name, u.email, u.id::text) as person,
  count(*)::text || ' money keys'            as detail
from effective ef
join public.users u on u.id = ef.user_id
group by u.id, u.full_name, u.email

union all

-- 3. Who holds ADMISSIONS specifically -- the role whose chain reaches CEO.
select
  '3. holds ADMISSIONS'                      as section,
  coalesce(u.full_name, u.email, u.id::text) as person,
  coalesce(u.email, '')                      as detail
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where r.name = 'ADMISSIONS'

order by 1, 2;
