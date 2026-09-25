-- CASSANDRA'S NAME HAS AN M IN IT - 25 September 2026
--
-- The JAG holds  cassandra.manghuN@theacademyvirtual.org
-- Her mailbox is cassandra.manghuM@theacademyvirtual.org
--
-- Confirmed from her own message header, not from anyone's memory.
--
-- One letter. Every reset she requested was accepted by the form, answered
-- with "if an account exists, a reset link is on its way", and never sent -
-- because for that address no account exists, and Supabase answers an unknown
-- address with silent success so the form cannot be used to discover who has
-- an account. Correct behaviour, invisible failure.
--
-- THIS IS THE SECOND TIME TODAY. Peter Alouise went three weeks on
-- peter.alouise@theacademyhs.org, a mailbox that does not exist, fixed in
-- migration 422 this afternoon. Two of thirteen teachers had an address that
-- could never receive anything, and in both cases the person was told the
-- email was on its way.
--
-- The 9 September cost analysis spells her "Cassandra Manghum". The JAG has
-- spelled her with an N since her account was created on the 25th. Nobody
-- compared the two.
--
-- KEYED ON THE WRONG ADDRESS, not on a uuid, because the address is unique and
-- is the thing we know for certain. All three places GoTrue and the app keep
-- it are updated together - auth.users, the email inside
-- auth.identities.identity_data, and public.users - for the reason set out in
-- 422: updating one leaves the others holding a dead address.
--
-- Her password and confirmation are untouched. She has never signed in, so
-- after this she uses Forgot password once and it will actually arrive.

begin;

update auth.users
   set email      = 'cassandra.manghum@theacademyvirtual.org',
       updated_at = now()
 where lower(email) = 'cassandra.manghun@theacademyvirtual.org';

update auth.identities ai
   set identity_data = jsonb_set(
         ai.identity_data,
         '{email}',
         to_jsonb('cassandra.manghum@theacademyvirtual.org'::text),
         true
       ),
       updated_at = now()
  from auth.users au
 where au.id = ai.user_id
   and ai.provider = 'email'
   and lower(au.email) = 'cassandra.manghum@theacademyvirtual.org';

update public.users
   set email = 'cassandra.manghum@theacademyvirtual.org'
 where lower(email) = 'cassandra.manghun@theacademyvirtual.org';

commit;

-- ── VERIFY: HER ─────────────────────────────────────────────────────────────
-- Expect ONE row, all three addresses reading manghuM, all_three_agree true.
select
  au.email                                as auth_users_email,
  ai.identity_data->>'email'              as identity_email,
  pu.email                                as app_email,
  (lower(au.email) = lower(ai.identity_data->>'email')
   and lower(au.email) = lower(pu.email)) as all_three_agree,
  au.email_confirmed_at is not null       as still_confirmed
from auth.users au
left join auth.identities ai on ai.user_id = au.id and ai.provider = 'email'
left join public.users pu on pu.id = au.id
where lower(au.email) like 'cassandra.mangh%';

-- ── VERIFY: EVERYONE ELSE ───────────────────────────────────────────────────
-- Twice in one day is a pattern, not bad luck. This prints the sign-in address
-- the JAG holds for every active teacher so they can be read against what the
-- people actually are. A wrong one cannot be detected by the system - the
-- reset form is silent by design - so it has to be read by a person who knows
-- them.
--
-- Marissa Vanella is still unexplained. Her address here is the one to check
-- against her own message header, the way Cassandra's just was.
select
  pu.full_name,
  pu.email as the_address_the_jag_will_send_to,
  s.name   as campus
from public.employees e
join public.users pu on pu.id = e.user_id
left join public.schools s on s.id = e.school_id
where e.employment_status = 'active'
  and e.employee_type = 'teacher'
order by pu.full_name;
