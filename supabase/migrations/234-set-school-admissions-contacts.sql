-- 234-set-school-admissions-contacts.sql
--
-- FILL THIS IN, then run it. Nothing here is guessed — the names, addresses and
-- booking links have to come from you.
--
-- The booking URL is the public link from a Google Calendar appointment
-- schedule. In Google Calendar: Create → Appointment schedule → set your
-- availability → Share → copy the booking page link. It looks like
--   https://calendar.google.com/calendar/appointments/schedules/AcZssZ...
--
-- The email address is the leader's real inbox. It is NOT what the mail is sent
-- from — that stays the verified domain, because sending as an address we do
-- not own fails SPF and puts the school in spam folders. It is the reply-to,
-- and it is where the new-inquiry alert lands.
--
-- A school you leave alone keeps sending the no-link version of the
-- confirmation, which promises a human will be in touch. That is correct
-- behaviour, not a failure — but it is also not the point of this.
--
-- Safe to re-run.

update public.schools set
  admissions_contact_name  = 'REPLACE ME',
  admissions_contact_email = 'replace.me@theacademyway.org',
  admissions_booking_url   = 'https://calendar.google.com/calendar/appointments/schedules/REPLACE_ME'
where id = 'a1000000-0000-4000-8000-000000000001';  -- The Academy FL

update public.schools set
  admissions_contact_name  = 'REPLACE ME',
  admissions_contact_email = 'replace.me@theacademyway.org',
  admissions_booking_url   = 'https://calendar.google.com/calendar/appointments/schedules/REPLACE_ME'
where id = 'a1000000-0000-4000-8000-000000000002';  -- The Academy GA

update public.schools set
  admissions_contact_name  = 'REPLACE ME',
  admissions_contact_email = 'replace.me@theacademyway.org',
  admissions_booking_url   = 'https://calendar.google.com/calendar/appointments/schedules/REPLACE_ME'
where id = 'a1000000-0000-4000-8000-000000000003';  -- The Academy HS

update public.schools set
  admissions_contact_name  = 'REPLACE ME',
  admissions_contact_email = 'replace.me@theacademyway.org',
  admissions_booking_url   = 'https://calendar.google.com/calendar/appointments/schedules/REPLACE_ME'
where id = 'a1000000-0000-4000-8000-000000000004';  -- The Academy Virtual

-- Check. Every school should read as set; anything still saying "not set" will
-- send the no-link confirmation and no leader alert.
select
  s.name as school,
  coalesce(s.admissions_contact_name,  '— not set —') as contact_name,
  coalesce(s.admissions_contact_email, '— not set —') as contact_email,
  case
    when s.admissions_booking_url is null then '— not set, no-link email —'
    else 'set'
  end as booking_url,
  case
    when s.admissions_contact_email is null then 'NO leader alert will be sent'
    else 'leader alert -> ' || s.admissions_contact_email
  end as alert
from public.schools s
order by s.name;
