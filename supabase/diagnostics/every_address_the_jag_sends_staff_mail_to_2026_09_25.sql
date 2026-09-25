-- EVERY ADDRESS THE JAG SENDS STAFF MAIL TO - 25 September 2026
--
-- nina.gaddy@theacademyway.org has been on Resend's suppression list since
-- 12 September, origin Bounce. It is NOT her sign-in address - that is
-- nina.gaddy@theacademyga.org, the only account on that domain. So the dead
-- address is configured somewhere else, and whatever sends to it has been
-- failing silently for thirteen days.
--
-- Staff mail is addressed from two places, neither of which is auth.users:
--
--   school_admissions_contacts.email   - the notification list per campus
--                                        (staff-recipients.ts reads this)
--   schools.admissions_contact_email   - the fallback when that table has no
--                                        row for the campus
--
-- A wrong address in either is invisible. It bounces once, Resend suppresses
-- it, and every later send is refused before it is attempted - which is
-- exactly how Peter went three weeks without a password reset.
--
-- This lists both, next to the accounts that actually exist, so a mismatch
-- is a row you can see rather than a thing to remember to check.
--
-- ONE statement. READ ONLY.

select
  s.name                                   as campus,
  'school_admissions_contacts'             as configured_in,
  sac.name                                 as contact_name,
  sac.email                                as address,
  sac.receives_notifications,
  sac.is_booking_contact,
  exists (select 1 from auth.users au
           where lower(au.email) = lower(sac.email)) as address_has_an_account
from public.schools s
join public.school_admissions_contacts sac
  on sac.school_id = s.id and sac.is_active = true

union all

select
  s.name,
  'schools.admissions_contact_email',
  null,
  s.admissions_contact_email,
  null,
  null,
  exists (select 1 from auth.users au
           where lower(au.email) = lower(s.admissions_contact_email))
from public.schools s
where s.admissions_contact_email is not null

order by campus, configured_in, address;
