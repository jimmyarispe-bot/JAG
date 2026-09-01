-- 236_school_from_address.sql
--
-- The address a school's mail is sent FROM.
--
-- Until now every email in the network left as `noreply@thejag.org` — the
-- software platform's domain. A family enquiring at The Academy GA has never
-- heard of The JAG, and an address they do not recognise is the first thing
-- that makes a school look like a mailing list.
--
-- Each school has its own domain (theacademyfl.org, theacademyga.org,
-- theacademyhs.org, theacademyvirtual.org), so each can send as itself once
-- that domain is verified in Resend.
--
-- Null is the supported, safe state: mail falls back to the EMAIL_FROM
-- environment variable. That matters because a From address on a domain Resend
-- has not verified is REJECTED — the email does not arrive. So this stays empty
-- for a school until its DNS is actually done, and filling it in early is the
-- one way to make this worse rather than better.
--
-- Safe to re-run.

alter table public.schools
  add column if not exists admissions_from_email text;

comment on column public.schools.admissions_from_email is
  'Envelope From for this school''s outbound mail, e.g. admissions@theacademyga.org. '
  'The domain MUST be verified in Resend or the send is rejected. Null falls back '
  'to the EMAIL_FROM environment variable, which is the correct state until DNS '
  'is verified.';

-- Shape only. Whether the domain is verified lives in Resend, not here, and a
-- constraint that pretended to know would be a constraint that lies.
alter table public.schools
  drop constraint if exists schools_admissions_from_email_shape;
alter table public.schools
  add constraint schools_admissions_from_email_shape
  check (
    admissions_from_email is null
    or admissions_from_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );

-- Current state, per school.
select
  s.name as school,
  coalesce(s.admissions_contact_name,  '— not set —') as contact,
  coalesce(s.admissions_from_email, '— falls back to EMAIL_FROM —') as sends_from,
  case when s.admissions_booking_url is null then 'no link' else 'has link' end as booking
from public.schools s
order by s.name;
