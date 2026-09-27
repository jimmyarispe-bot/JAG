-- MARISA HAS ONE S - 25 September 2026
--
-- The third wrong address in one day, and the third found by asking the person
-- rather than the system.
--
--   The JAG holds  marissa.vanella@theacademyvirtual.org   (two S)
--   Her mailbox is marisa.vanella@theacademyvirtual.org    (one S)
--
-- Confirmed from her own message header: "Marisa Vanella
-- <marisa.vanella@theacademyvirtual.org>".
--
-- She wrote: "I was unable to reset my password. I did not receive the link to
-- reset it. I checked all the folders in my email... When I requested the
-- password link, I copy-pasted my email address to make sure it was accurate."
-- She was right every time. The address she pasted was correct and the JAG's
-- was not, so Supabase found no account and answered with silent success.
--
-- THREE OF THIRTEEN.
--   Peter Alouise    peter.alouise@theacademyhs.org       did not exist  (422)
--   Cassandra Manghum  ...manghuN vs manghuM              did not exist  (427)
--   Marisa Vanella     mariSSa vs mariSa                  did not exist  (428)
--
-- Nothing in the platform could have caught any of them. The reset form is
-- enumeration-safe by design - it must answer an unknown address exactly as it
-- answers a known one, or it becomes a tool for discovering who has an account.
-- The cost of that correct decision is that a typo is invisible forever. The
-- only detector is a human who knows the person, which is how all three were
-- found this evening.
--
-- Worth doing properly later: when an address on an employee record has never
-- successfully received anything, that is a fact the system DOES know and could
-- surface on the staff screen. Not tonight.
--
-- NAMES TOO. Both women have been misspelled in their own records since the
-- accounts were created this morning - the name each of them sees on her own
-- screen, and the name that will appear on a pay report. Corrected here from
-- the same headers the addresses came from.
--
-- Marnie Witters and Mahogany Murphy on @theacademyway.org were checked in the
-- same pass and are CORRECT. Recorded so nobody 'fixes' them later.

begin;

-- ── MARISA: THE ADDRESS, IN ALL THREE PLACES ────────────────────────────────
update auth.users
   set email      = 'marisa.vanella@theacademyvirtual.org',
       updated_at = now()
 where lower(email) = 'marissa.vanella@theacademyvirtual.org';

update auth.identities ai
   set identity_data = jsonb_set(
         ai.identity_data,
         '{email}',
         to_jsonb('marisa.vanella@theacademyvirtual.org'::text),
         true
       ),
       updated_at = now()
  from auth.users au
 where au.id = ai.user_id
   and ai.provider = 'email'
   and lower(au.email) = 'marisa.vanella@theacademyvirtual.org';

update public.users
   set email = 'marisa.vanella@theacademyvirtual.org'
 where lower(email) = 'marissa.vanella@theacademyvirtual.org';

-- ── THE NAMES ────────────────────────────────────────────────────────────────
update public.users
   set full_name = 'Marisa Vanella'
 where lower(email) = 'marisa.vanella@theacademyvirtual.org'
   and full_name is distinct from 'Marisa Vanella';

update public.users
   set full_name = 'Cassandra Manghum'
 where lower(email) = 'cassandra.manghum@theacademyvirtual.org'
   and full_name is distinct from 'Cassandra Manghum';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect thirteen rows. Marisa reads one S in the name and all three address
-- columns; Cassandra reads Manghum. all_three_agree must be true on every row
-- that has an account - a false means an address is half-changed and that
-- person must NOT be told to reset until it is sorted.
select
  pu.full_name,
  au.email                                   as sign_in_address,
  ai.identity_data->>'email'                 as identity_address,
  pu.email                                   as app_address,
  (lower(au.email) = lower(ai.identity_data->>'email')
   and lower(au.email) = lower(pu.email))    as all_three_agree
from public.employees e
join public.users pu on pu.id = e.user_id
left join auth.users au on au.id = pu.id
left join auth.identities ai on ai.user_id = pu.id and ai.provider = 'email'
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
order by all_three_agree, pu.full_name;
