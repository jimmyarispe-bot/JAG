-- 263: Danni Treu's tour and shadow-days links — The Academy FL.
--
-- FL already had its interest-call link. These are the other two, completing
-- the campus.
--
-- Same mapping as GA (migration 262):
--   admissions_booking_url -> {{scheduling_link}} -> interest calls
--   tour_booking_url       -> school tours (column added in 262, not yet wired
--                             into any template)
--   shadow_days_url        -> {{shadow_days_link}} -> gate 2's "yes"

begin;

do $$
declare v_hit int;
begin
  update public.schools
     set tour_booking_url = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ38fBMga-fHs9171KtS42JNoYYbgFAG-_kiNd5cSadV7W12a3ckNlymdY8DLpSCXuThSjRKS7nF',
         shadow_days_url  = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ08ft9Thu7y1d6zUhleQWltGhmMHO7ix6eoHBEJHufDoLN9kQ8TeOeXqXtERayPR19wIFc1D6th'
   where name ilike '%academy%fl%'
      or name ilike '%academy florida%';

  get diagnostics v_hit = row_count;

  if v_hit <> 1 then
    raise exception 'Aborting: expected to set 1 school (The Academy FL), set %.', v_hit;
  end if;

  raise notice 'Danni Treu''s tour and shadow-days links set for The Academy FL.';
end $$;

-- All four schools, all three appointment types.
--
-- Expected after this runs:
--   FL  complete
--   GA  complete
--   HS  interest call is an ADMIN PAGE, no tour (correct - no campus), no shadow days
--   Virtual  same
--
-- Tours are a physical-campus thing. Empty tour_booking_url on HS and Virtual
-- is correct, not missing.
select name,
       admissions_contact_name,
       coalesce(nullif(admissions_booking_url, ''), '-- EMPTY --') as interest_call_url,
       coalesce(nullif(tour_booking_url, ''),       '-- EMPTY --') as tour_url,
       coalesce(nullif(shadow_days_url, ''),        '-- EMPTY --') as shadow_days_url
from public.schools
order by name;

commit;
