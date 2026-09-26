-- A parent's payment lands at the campus their child attends.
--
-- Jimmy, 26 September 2026, choosing between one Square location and four:
-- the campus the child attends.
--
-- WHY A COLUMN AND NOT AN ENVIRONMENT VARIABLE. SQUARE_LOCATION_ID is one
-- string for the whole deployment, and this network keeps seven books. A
-- single location would land every family's tuition in one ledger and leave
-- somebody to attribute it back to a campus afterwards - which is exactly the
-- step that gets skipped, and the reason ClassWallet attribution had to be
-- reconstructed by hand in September.
--
-- WHAT THE VERIFY CALL FOUND, AND WHY THIS MATTERS. The Square account holds
-- twelve locations, and the platform's own suggestion for the variable was
-- "Enrichments.org" - simply the first in the list, and a different business.
-- Four are campuses, one is the network, two are New Jersey (closed), and
-- four are inactive. The right id is never the first one; it is the one that
-- matches the school.
--
-- INACTIVE LOCATIONS ARE NOT MAPPED. The Academy AZ, The Academy Florida,
-- The Academy TN and The Academy Way are inactive in Square, and a payment
-- cannot be taken at an inactive location. A campus with no id here must
-- REFUSE a payment rather than fall back to another campus's location - a
-- fallback would move real money into the wrong book, silently, which is the
-- worst failure available in this whole chain.
--
-- Safe to re-run.

begin;

alter table public.schools
  add column if not exists square_location_id text;

comment on column public.schools.square_location_id is
  'The Square location a payment for this campus is taken at. Null means no '
  'payment can be taken for this campus - the payment path must refuse rather '
  'than fall back to another campus''s location.';

update public.schools s
   set square_location_id = m.location_id,
       updated_at         = now()
  from (values
          ('the academy fl',      'L18GSW0AK9W6N'),  -- The Academy FL - PSL
          ('the academy ga',      'LTAVJXSWAWND1'),
          ('the academy hs',      'LXEAHTJPA57FN'),
          ('the academy virtual', 'LXS2070R6BK2K')
       ) as m(school_name, location_id)
 where lower(trim(s.name)) = m.school_name
   and s.square_location_id is distinct from m.location_id;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect four campuses with an id and any other school with none.
--
-- A campus reading NO LOCATION - CANNOT TAKE PAYMENT is not broken; it is the
-- honest state until somebody decides where its money should land. It becomes
-- a problem only the day that campus tries to charge a family, and the payment
-- path will say so then rather than charging the wrong ledger.

select s.name as campus,
       coalesce(s.square_location_id, 'NO LOCATION - CANNOT TAKE PAYMENT') as square_location,
       case s.square_location_id
         when 'L18GSW0AK9W6N' then 'The Academy FL - PSL'
         when 'LTAVJXSWAWND1' then 'The Academy GA'
         when 'LXEAHTJPA57FN' then 'The Academy HS'
         when 'LXS2070R6BK2K' then 'The Academy Virtual'
         when null            then null
         else 'UNRECOGNISED - check this against the Square location list'
       end as square_calls_it
  from public.schools s
 order by s.name;
