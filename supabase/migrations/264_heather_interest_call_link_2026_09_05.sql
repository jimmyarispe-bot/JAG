-- 264: Heather's interest-call link — The Academy HS and The Academy Virtual.
--
-- This REPLACES a live wrong answer, not a blank one. Both schools currently
-- hold https://www.thejag.org/dashboard/admin/admissions-contacts in
-- admissions_booking_url — the internal staff screen for managing admissions
-- contacts. That is what {{scheduling_link}} renders into the inquiry email,
-- directly under "The next step is a conversation. Please pick a time that
-- suits you."
--
-- Every family who has inquired about either school was sent to a dashboard
-- they cannot log into. A blank link reads as an oversight; that one reads as a
-- broken school.
--
-- One link covers both schools, confirmed by Jimmy, the same way the
-- shadow-days link does.
--
-- With this, all four schools are complete across every appointment type they
-- actually offer.

begin;

do $$
declare v_hit int;
begin
  -- Refuse if either school is missing, rather than quietly setting one.
  if (select count(*) from public.schools
      where name ilike '%academy%hs%' or name ilike '%academy%virtual%') <> 2 then
    raise exception 'Aborting: expected exactly 2 schools matching HS and Virtual.';
  end if;

  update public.schools
     set admissions_booking_url = 'https://calendar.app.google/dKM8Ynka5WpNfJ4k7'
   where name ilike '%academy%hs%'
      or name ilike '%academy%virtual%';

  get diagnostics v_hit = row_count;

  if v_hit <> 2 then
    raise exception 'Aborting: expected to set 2 schools, set %.', v_hit;
  end if;

  raise notice 'Interest-call link set for The Academy HS and The Academy Virtual.';
end $$;

-- Nothing should still point at a thejag.org dashboard page. If this returns a
-- row, a families-facing field is still holding an internal URL.
select name, admissions_booking_url as still_an_admin_url
from public.schools
where admissions_booking_url ilike '%thejag.org/dashboard%'
   or tour_booking_url       ilike '%thejag.org/dashboard%'
   or shadow_days_url        ilike '%thejag.org/dashboard%';

-- The final picture. Every school, every appointment type.
--
-- Tours are a physical-campus thing: FL and GA have them, HS and Virtual do not.
-- An empty tour_booking_url on those two is correct, not missing.
select name,
       admissions_contact_name,
       coalesce(nullif(admissions_booking_url, ''), '-- EMPTY --') as interest_call_url,
       coalesce(nullif(tour_booking_url, ''),       '-- n/a, no campus --') as tour_url,
       coalesce(nullif(shadow_days_url, ''),        '-- EMPTY --') as shadow_days_url
from public.schools
order by name;

commit;
