-- IS EVERYTHING SENDING SINCE THE FIX?
--
-- 30 September 2026, run AFTER clearing admissions_from_email on GA and FL.
--
-- WHAT THIS CAN AND CANNOT TELL YOU. The JAG records three statuses -
-- 'sent', 'failed' and 'logged' - and never 'delivered'. 'sent' means Resend
-- ACCEPTED the message, which is exactly the step that was failing for GA and
-- FL, so it is a real signal that the fix worked. It is NOT proof anything
-- reached an inbox. Nothing in this system can prove that. The inbox is the
-- only proof, and it is Jimmy's, not the database's.
--
-- 'logged' on an SMS row is not a success. engine.ts:
--     deliveryStatus = "logged";
--     deliveryError  = "SMS provider not configured for v1.0";
-- No text message has ever been transmitted.
--
-- Two blocks. The first is everything since 16:00 Eastern today - the test
-- window. The second is the two weeks before it, so the change is visible as
-- a change rather than as a number with nothing to compare it to.
--
-- Times in Eastern. Reads only.

select 'SINCE THE FIX (today, after 16:00 ET)'          as window,
       coalesce(s.name, '(no campus)')                  as campus,
       c.communication_type                             as type,
       coalesce(c.delivery_status, '(null)')            as status,
       count(*)                                         as emails,
       string_agg(distinct left(c.sent_to, 30), ' | ')  as recipients
  from public.admissions_communications c
  left join public.admissions_leads l on l.id = c.lead_id
  left join public.schools s on s.id = l.school_id
 where c.sent_at >= (date '2026-09-30' + time '16:00') at time zone 'America/New_York'
 group by 1, 2, 3, 4

union all

select 'BEFORE (16-30 Sept)',
       coalesce(s.name, '(no campus)'),
       c.communication_type,
       coalesce(c.delivery_status, '(null)'),
       count(*),
       '—'
  from public.admissions_communications c
  left join public.admissions_leads l on l.id = c.lead_id
  left join public.schools s on s.id = l.school_id
 where c.sent_at >= (date '2026-09-16') at time zone 'America/New_York'
   and c.sent_at <  (date '2026-09-30' + time '16:00') at time zone 'America/New_York'
 group by 1, 2, 3, 4

order by 1 desc, 2, 3, 4;
