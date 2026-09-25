-- PETER'S ADDRESS NEVER EXISTED - 25 September 2026
--
-- WHAT HAPPENED. Peter Alouise could not receive a password reset. I guessed
-- twice - free-tier mailer, unverified sending domain - and both were wrong,
-- because both asked whether we COULD send rather than what happened when we
-- did. The Resend log answers it in three events one minute apart:
--
--   09:59  Sent
--   09:59  Bounced     "Recipient not found: the recipient address does not exist"
--   09:59  Suppressed
--
-- peter.alouise@theacademyhs.org is not a mailbox. After the hard bounce
-- Resend added it to the account suppression list and refused every later
-- attempt before it left the building - no send, no error, nothing in any log
-- we were reading. The house pattern: a refusal wearing a success costume.
--
-- His real address is peter.alouise@theacademyvirtual.org, proven by his own
-- reply of 5 September signed by theacademyvirtual-org.gappssmtp.com.
--
-- HIS CAMPUS IS NOT CHANGED. He is correctly at The Academy HS. The email
-- domain does not have to match the campus - Marnie Witters is HS on a
-- theacademyway.org address - so changing school_id here would fix a spelling
-- by breaking a fact.
--
-- WHY THIS TOUCHES auth.identities AS WELL.
--
-- GoTrue stores the address twice: auth.users.email, and the email key inside
-- auth.identities.identity_data for the email provider. The dashboard updates
-- both. Updating only auth.users leaves the identity holding the dead address,
-- and auth.identities.email is a generated column reading out of that same
-- jsonb - so half a change here is worse than none.
--
-- Both are updated together, in one transaction, keyed on his uid.
--
-- His password and email_confirmed_at are untouched. He is not asked to
-- confirm the new address; he simply gets one working reset afterwards.

begin;

update auth.users
   set email      = 'peter.alouise@theacademyvirtual.org',
       updated_at = now()
 where id = 'f088f72c-553f-4504-b3f0-3f9a1ae175aa';

update auth.identities
   set identity_data = jsonb_set(
         identity_data,
         '{email}',
         to_jsonb('peter.alouise@theacademyvirtual.org'::text),
         true
       ),
       updated_at = now()
 where user_id  = 'f088f72c-553f-4504-b3f0-3f9a1ae175aa'
   and provider = 'email';

update public.users
   set email = 'peter.alouise@theacademyvirtual.org'
 where id = 'f088f72c-553f-4504-b3f0-3f9a1ae175aa';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect ONE row. All three address columns must read
-- peter.alouise@theacademyvirtual.org and all_three_agree must be true.
--
-- Anything else means the change is half applied, and he should NOT be sent a
-- reset until it reads true - a half-applied identity can lock him out of an
-- account he could reach this morning.
select
  au.email                                   as auth_users_email,
  ai.identity_data->>'email'                 as identity_email,
  pu.email                                   as app_email,
  (lower(au.email) = lower(ai.identity_data->>'email')
   and lower(au.email) = lower(pu.email))    as all_three_agree,
  au.email_confirmed_at is not null          as still_confirmed,
  s.name                                     as campus
from auth.users au
left join auth.identities ai
       on ai.user_id = au.id and ai.provider = 'email'
left join public.users pu on pu.id = au.id
left join public.employees e on e.user_id = pu.id
left join public.schools s on s.id = e.school_id
where au.id = 'f088f72c-553f-4504-b3f0-3f9a1ae175aa';
