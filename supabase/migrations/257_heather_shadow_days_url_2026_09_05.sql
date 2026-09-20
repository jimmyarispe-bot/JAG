-- 257: Heather's shadow-days booking link — The Academy Virtual and The Academy HS.
--
-- v2. The first version resolved the school from Heather's name and aborted
-- unless exactly one matched. Heather runs admissions for TWO schools, so that
-- guard was the wrong shape: it would have refused to set either.
--
-- Set by school name instead, and the guard now checks that both schools were
-- found rather than that only one was.
--
-- schools.shadow_days_url is what {{shadow_days_link}} merges into when Gate 2
-- is answered "yes". It is empty for every school today, so that mail goes out
-- with a blank link where the booking URL should be.

begin;

do $$
declare
  v_url  text := 'https://calendar.app.google/puNQFFnA4KiX3KNS7';
  v_hit  int;
  v_miss text;
begin
  -- Both schools must exist before anything is written. A name that matches
  -- nothing would otherwise pass silently and leave one campus still blank.
  select string_agg(want, ', ')
    into v_miss
  from (values ('%academy%virtual%'), ('%academy%hs%')) as w(want)
  where not exists (
    select 1 from public.schools s where s.name ilike w.want
  );

  if v_miss is not null then
    raise exception 'Aborting: no school matches %', v_miss;
  end if;

  update public.schools
     set shadow_days_url = v_url
   where name ilike '%academy%virtual%'
      or name ilike '%academy%hs%';

  get diagnostics v_hit = row_count;

  if v_hit <> 2 then
    raise exception 'Aborting: expected to set 2 schools, set %. Check for a name matching both patterns.', v_hit;
  end if;

  raise notice 'Shadow-days link set for The Academy Virtual and The Academy HS.';
end $$;

-- Where every school now stands. Anything still blank mails a family an empty
-- link the next time Gate 2 is answered yes.
--
-- The Academy FL and The Academy GA are expected to be blank here — those are
-- not Heather's. They still need their own links.
select name,
       admissions_contact_name,
       coalesce(nullif(shadow_days_url, ''), '-- STILL EMPTY --') as shadow_days_url,
       coalesce(nullif(admissions_booking_url, ''), '-- STILL EMPTY --') as booking_url
from public.schools
order by name;

commit;
