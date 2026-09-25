-- WHY RENEE WAS NOT TOLD HER ADDRESS - 25 September 2026
--
-- Renee Tracewell signed in at thejag.org, the executive platform door, and was
-- correctly refused. The refusal screen is supposed to finish the sentence with
-- her campus sign-in address. It did not - she got "ask your school's admissions
-- office" instead, which is the fallback for "we could not work out her campus".
--
-- resolveTenantSignInHost (src/lib/jag-platform/wrong-door.ts) does exactly two
-- lookups. This runs both of them by hand. Whichever returns nothing is the bug.
--
-- READ ONLY. Nothing here changes anything.

-- 1) Does she exist, and under which email? Her screen showed
--    theacademyhys.org, which may or may not be the address we provisioned.
select
  u.id            as auth_user_id,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  u.created_at
from auth.users u
where lower(u.email) like '%tracewell%'
order by u.created_at;

-- 2) LOOKUP ONE: user_schools -> schools.organization_id.
--    A null here means she is attached to no campus, and the screen can never
--    name one. This is also what would stop her signing in at the right door.
select
  u.email,
  us.user_id,
  s.id            as school_id,
  s.name          as school_name,
  s.organization_id
from auth.users u
left join user_schools us on us.user_id = u.id
left join schools s       on s.id = us.school_id
where lower(u.email) like '%tracewell%';

-- 3) LOOKUP TWO: organization_brands.org_organization_id -> subdomain.
--    The whole brand table, so it is obvious whether her org is in it at all.
select
  id,
  organization_id,
  org_organization_id,
  subdomain,
  display_name
from organization_brands
order by subdomain;

-- 4) THE TWO JOINED - what the code actually computes for her.
--    A row with a subdomain means the screen should have printed
--    <subdomain>.thejag.org/login. A row with a null subdomain is the fault.
select
  u.email,
  s.name                as school_name,
  s.organization_id,
  ob.subdomain,
  case
    when ob.subdomain is null then 'FALLBACK - she is told to ask her school'
    else 'https://' || ob.subdomain || '.thejag.org/login'
  end                   as what_the_screen_should_say
from auth.users u
left join user_schools us        on us.user_id = u.id
left join schools s              on s.id = us.school_id
left join organization_brands ob on ob.org_organization_id = s.organization_id
where lower(u.email) like '%tracewell%';

-- 5) And the same question for every other teacher, because if Renee is not
--    attached to a campus the other twelve may not be either - and they are all
--    about to be sent the sign-in instructions.
select
  e.first_name || ' ' || e.last_name as employee,
  e.work_email,
  u.id is not null                   as has_auth_account,
  us.school_id is not null           as attached_to_campus,
  ob.subdomain
from employees e
left join auth.users u           on lower(u.email) = lower(e.work_email)
left join user_schools us        on us.user_id = u.id
left join schools s              on s.id = us.school_id
left join organization_brands ob on ob.org_organization_id = s.organization_id
where e.is_active = true
order by attached_to_campus, employee;
