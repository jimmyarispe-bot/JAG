-- ===========================================================================
-- CAN A SCHOOL LEADER ACTUALLY REPLY  -  2026-09-22
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. Jimmy, 22 September: mail to info@ should be answered by the school
-- leader, with the link to the inquiry form, so the family can book a time to
-- meet them.
--
-- That reply needs TWO links and ONE named person, per campus:
--   * the public inquiry form link      - does that school allow one
--   * the interest call booking link    - schools.admissions_booking_url, or
--                                         the newer school_admissions_contacts
--                                         row flagged is_booking_contact
--   * the school leader to send it      - the booking contact
--
-- A reply with an empty booking link sends a family to nothing. This asks
-- whether each campus has what the reply needs BEFORE anyone writes the reply.
--
-- WHAT EMPTY MEANS, before it runs.
--   1 blank booking_url on a campus -> that campus cannot offer a time to
--     meet. The reply would promise a booking and link to nowhere.
--   2 empty -> no school_admissions_contacts rows exist. Migration 327 created
--     the table and said plainly it "does not change any code path" - the
--     table is populated and unread. Empty here means the newer, better model
--     was never filled in, and everything still runs off the three old columns
--     on schools.
--   3 admissions_interest_public false -> that campus's inquiry form is not
--     public, so the link in the reply would not open for a family.
-- ===========================================================================

-- 1. What each campus has today, from the columns the engine actually reads.
select
  '1. per campus'                                          as check,
  s.name                                                   as school,
  case when coalesce(trim(s.admissions_booking_url), '') = ''
       then 'NO BOOKING LINK' else 'has booking link' end  as booking,
  case when coalesce(trim(s.admissions_contact_email), '') = ''
       then 'no contact email' else s.admissions_contact_email end as contact,
  case when s.admissions_interest_public then 'form public' else 'FORM NOT PUBLIC' end as form
from public.schools s
order by s.name;

-- 2. The newer model - one booking contact per school. Migration 327 built
--    this and deliberately left it unread. Is it filled in at all?
select
  '2. school_admissions_contacts'                          as check,
  s.name                                                   as school,
  c.name                                                   as person,
  case when c.is_booking_contact then 'BOOKING CONTACT' else 'notifications only' end as role,
  coalesce(nullif(trim(c.booking_url), ''), '(none)')      as booking_url
from public.school_admissions_contacts c
join public.schools s on s.id = c.school_id
order by s.name, c.is_booking_contact desc, c.name;

-- 3. Who holds SCHOOL_LEADER, so the reply can name a real person rather than
--    a role. Expect Heather Badger-Brown and Nina Gaddy.
select
  '3. school leaders'                                      as check,
  coalesce(u.full_name, u.email)                           as person,
  coalesce(u.email, '')                                    as email
from public.user_roles ur
join public.roles r on r.id = ur.role_id
join public.users u on u.id = ur.user_id
where r.name = 'SCHOOL_LEADER'
order by 2;
