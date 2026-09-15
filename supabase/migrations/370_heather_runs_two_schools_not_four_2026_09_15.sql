-- 370_heather_runs_two_schools_not_four_2026_09_15.sql
--
-- WHAT HAPPENED
--
-- 15 September 2026. Heather Badger-Brown received an email titled
-- "Decision needed: Julian Oubre Towa". She clicked it and landed on a decision
-- about Trisha Wilkerson — a 3rd grader at The Academy FL — with Accept and
-- Decline buttons in front of her, under an email that told her the answer
-- would be recorded against her name.
--
-- Two faults put her there. The broken link is fixed in code. This file fixes
-- the other one, which is worse, because the link at least failed visibly:
--
--     Heather is assigned to ALL FOUR campuses, and The Academy FL is her
--     PRIMARY.
--
--     full_name              assigned_school       is_primary
--     Heather Badger-Brown   The Academy FL        true
--     Heather Badger-Brown   The Academy GA        false
--     Heather Badger-Brown   The Academy HS        false
--     Heather Badger-Brown   The Academy Virtual   false
--
-- She runs Virtual and HS. Migration 257 said so in September, in its own
-- header: "Heather runs admissions for TWO schools", and "FL and GA are not
-- Heather's". Florida and Georgia have been hers in the data the whole time.
--
-- SO THIS IS NOT AN RLS HOLE, AND THAT MATTERS
--
-- The obvious reading of the screenshot is that row-level security leaked a
-- Florida family to a Virtual school leader. It did not. RLS worked exactly as
-- written; `can_access_school` was asked whether Heather may see Florida and
-- correctly answered yes, because somebody had told the database she may. The
-- decisions page shows every pending gate and trusts RLS to scope it, and RLS
-- scoped it to what the assignments say.
--
-- A permissions system enforcing wrong data is indistinguishable from a
-- permissions system that is broken, right up until you look at the data. That
-- is the whole lesson of this file.
--
-- WHERE IT CAME FROM
--
-- The same place as Nina's. `provision_auth_user` used to hand every new
-- account a hard-coded Florida assignment; migration 348 removed that and
-- cleaned up Nina Gaddy, who had been auto-assigned Florida alongside Georgia
-- at 13:05:00.400126 on the day her account was made. Heather was never
-- cleaned up — 348 fixed the person we had found, not the class of person.
-- Section 3c below goes looking for the rest of them.
--
-- WHY VIRTUAL IS THE PRIMARY AND NOT HS
--
-- Her title in JAG is "Director of Virtual Schools". A person's workspace
-- header should say the thing their own title says.
--
-- BOTH TABLES, ALWAYS
--
-- `can_access_school` accepts either user_schools or user_org_assignments, so
-- deleting from one of them is the same as deleting from neither. 348 says the
-- same thing in the same words, because it is the mistake this pair invites.

-- -----------------------------------------------------------------------------
-- 1) Florida and Georgia are not hers.
-- -----------------------------------------------------------------------------

delete from public.user_schools us
using public.users u
where us.user_id = u.id
  and lower(u.email) = 'heather.brown@theacademyway.org'
  and us.school_id in (
    'a1000000-0000-4000-8000-000000000001',  -- The Academy FL
    'a1000000-0000-4000-8000-000000000002'   -- The Academy GA
  );

delete from public.user_org_assignments uoa
using public.users u
where uoa.user_id = u.id
  and lower(u.email) = 'heather.brown@theacademyway.org'
  and uoa.school_id in (
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000002'
  );

-- -----------------------------------------------------------------------------
-- 2) Exactly one primary, and it is Virtual.
--
--    Cleared first. Deleting the Florida row happens to remove the only
--    is_primary = true she had, but writing this as "clear, then set" means the
--    result is correct whatever the rows looked like when it ran — including on
--    a re-run, and including if somebody flips a primary between now and then.
-- -----------------------------------------------------------------------------

update public.user_org_assignments uoa
   set is_primary = false
  from public.users u
 where uoa.user_id = u.id
   and lower(u.email) = 'heather.brown@theacademyway.org';

update public.user_org_assignments uoa
   set is_primary = true
  from public.users u
 where uoa.user_id = u.id
   and lower(u.email) = 'heather.brown@theacademyway.org'
   and uoa.school_id = 'a1000000-0000-4000-8000-000000000004';  -- Academy Virtual

-- -----------------------------------------------------------------------------
-- 3) VERIFICATION
-- -----------------------------------------------------------------------------

-- 3a. Heather. Expect exactly TWO rows — Academy Virtual (primary) and
--     The Academy HS — present in both tables. No Florida. No Georgia.
select
  'heather after' as check,
  s.name as school,
  exists (
    select 1 from public.user_schools us
    where us.user_id = u.id and us.school_id = s.id
  ) as in_user_schools,
  uoa.is_primary
from public.users u
join public.user_org_assignments uoa on uoa.user_id = u.id
join public.schools s on s.id = uoa.school_id
where lower(u.email) = 'heather.brown@theacademyway.org'
order by uoa.is_primary desc, s.name;

-- 3b. Exactly one primary. A person with two primaries has an arbitrary
--     workspace; a person with none has an empty one.
select
  'heather primary count' as check,
  count(*) filter (where uoa.is_primary) as primaries,
  count(*) as assignments
from public.users u
join public.user_org_assignments uoa on uoa.user_id = u.id
where lower(u.email) = 'heather.brown@theacademyway.org';

-- 3c. THE ONE THAT MATTERS. Every School Leader and their campuses.
--
--     348 fixed Nina. This file fixes Heather. If a third name appears here
--     holding a campus that is not theirs, the cleanup is still incomplete and
--     somebody else is being shown other people's children.
select
  'every school leader' as check,
  u.full_name,
  u.email,
  s.name as school,
  uoa.is_primary
from public.users u
join public.user_roles ur on ur.user_id = u.id
join public.roles r on r.id = ur.role_id
left join public.user_org_assignments uoa on uoa.user_id = u.id
left join public.schools s on s.id = uoa.school_id
where r.name = 'SCHOOL_LEADER'
order by u.full_name, uoa.is_primary desc nulls last, s.name;

-- 3d. Anybody at all holding all four campuses. Four is not a school leader;
--     four is a provisioning accident or a network role that should say so.
select
  'holds every campus' as check,
  u.full_name,
  u.email,
  count(distinct uoa.school_id) as campuses
from public.users u
join public.user_org_assignments uoa on uoa.user_id = u.id
group by u.full_name, u.email
having count(distinct uoa.school_id) >= 4
order by u.full_name;

-- 3e. Pending decisions Heather can now reach, by campus. Expect Academy
--     Virtual and The Academy HS only — no Trisha Wilkerson, no Florida.
select
  'gates heather can see' as check,
  s.name as school,
  count(*) as pending
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
join public.schools s on s.id = l.school_id
where g.status = 'pending'
  and exists (
    select 1
    from public.users u
    join public.user_org_assignments uoa on uoa.user_id = u.id
    where lower(u.email) = 'heather.brown@theacademyway.org'
      and uoa.school_id = l.school_id
  )
group by s.name
order by s.name;
