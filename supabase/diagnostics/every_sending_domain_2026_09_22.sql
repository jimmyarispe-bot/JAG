/*
  EVERY SENDING DOMAIN — read-only. Nothing here writes.

  WHY. Seven sends failed because theacademyga.org and theacademyfl.org are not
  verified in Resend. Those two failed only because something was actually sent
  from them. A campus that has an unverified from-address but has not yet
  triggered a send looks perfectly healthy right up until the first parent is
  meant to hear from it.

  The from-address is schools.admissions_from_email (engine.ts line 99). When it
  is null the send falls back to EMAIL_FROM, and ultimately to
  noreply@thejag.org, which IS verified - that is why 55 emails went out fine.

  WHAT EMPTY MEANS, decided before running it:

  1. per campus  — a NULL from-address is SAFE, not broken: that campus falls
                   back to the verified JAG domain. A non-null address on an
                   unverified domain is the dangerous state, and it is silent
                   until someone sends.
  2. domains     — this is your registrar to-do list. Every domain listed here
                   other than thejag.org must be added and verified at
                   https://resend.com/domains or its mail will be rejected.
*/

-- 1. What every campus is configured to send as.
select
  '1. per campus' as check,
  coalesce(name, 'unnamed school') as detail,
  coalesce(admissions_from_email, 'NULL - falls back to noreply@thejag.org') as extra
from public.schools

union all

-- 2. The distinct domains that must be verified in Resend.
select
  '2. domains',
  lower(split_part(admissions_from_email, '@', 2)),
  count(*)::text || ' campus(es)'
from public.schools
where admissions_from_email is not null
  and admissions_from_email like '%@%'
group by lower(split_part(admissions_from_email, '@', 2))

order by 1, 2;
