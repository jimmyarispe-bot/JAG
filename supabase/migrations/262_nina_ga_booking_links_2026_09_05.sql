-- 262: Nina Gaddy's three booking links — The Academy GA.
--
-- Nina supplied three, and the schools table has room for two. The mapping is
-- not a guess:
--
--   admissions_booking_url -> {{scheduling_link}} -> inquiry_thank_you_email,
--   whose body reads "The next step is a conversation. Please pick a time".
--   That is the INTEREST CALL, not the tour.
--
--   shadow_days_url -> {{shadow_days_link}} -> shadow_days_invited, sent when
--   gate 2 is answered yes. merge-fields.ts is explicit that this is
--   deliberately not the same link, because "tours and shadow days are
--   different appointments with different lengths, and sending a family to the
--   wrong calendar at that point in the process is not a small mistake."
--
--   SCHOOL TOURS has no column. This migration adds one rather than overwrite
--   one of the other two, which would send families to the wrong calendar in
--   exactly the way that comment warns about.
--
-- NOTE: nothing in the app reads tour_booking_url yet. The link is stored
-- correctly and safely; wiring it into the tour templates is a separate piece
-- of work. Storing it is still better than leaving it in a chat message.

begin;

alter table public.schools
  add column if not exists tour_booking_url text;

comment on column public.schools.tour_booking_url is
  'Public appointment-schedule link for school tours. Distinct from '
  'admissions_booking_url (interest calls) and shadow_days_url (shadow days). '
  'Added 2026-09-05; not yet rendered into any template.';

do $$
declare v_hit int;
begin
  update public.schools
     set admissions_booking_url = 'https://calendar.app.google/yerTX8WnJ5L3yjMN8',
         tour_booking_url       = 'https://calendar.app.google/8jPEwx92MX475duv8',
         shadow_days_url        = 'https://calendar.app.google/FD6rVQShrwth5MXBA'
   where name ilike '%academy%ga%'
      or name ilike '%academy georgia%';

  get diagnostics v_hit = row_count;

  if v_hit <> 1 then
    raise exception 'Aborting: expected to set 1 school (The Academy GA), set %.', v_hit;
  end if;

  raise notice 'Nina Gaddy''s three links set for The Academy GA.';
end $$;

-- Where all four schools now stand.
--
-- Expect The Academy FL to be the only one still missing a shadow-days link —
-- that is Danni Treu's, and it has not been supplied.
--
-- Also worth reading: The Academy HS and The Academy Virtual have a
-- thejag.org PAGE as their booking_url, not a calendar link. A page cannot be
-- booked from an email the way {{scheduling_link}} assumes. Check whether those
-- two should be appointment-schedule links like GA's and FL's.
select name,
       admissions_contact_name,
       coalesce(nullif(admissions_booking_url, ''), '-- EMPTY --') as interest_call_url,
       coalesce(nullif(tour_booking_url, ''),       '-- EMPTY --') as tour_url,
       coalesce(nullif(shadow_days_url, ''),        '-- EMPTY --') as shadow_days_url
from public.schools
order by name;

commit;
