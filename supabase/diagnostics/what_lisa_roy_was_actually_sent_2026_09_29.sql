-- WHAT LISA ROY WAS ACTUALLY SENT
--
-- 29 September 2026. The communications log says a `student_accepted_email`
-- went to lisinda1974@gmail.com on 26 September with status 'sent'. That is
-- a template NAME and a provider ACK. It is not the message she read.
--
-- This returns the subject and the opening of the body of every message on
-- her record, so the acceptance can be read rather than inferred from a key.
--
-- WHAT IT STILL CANNOT TELL YOU. `delivery_status = 'sent'` means Resend
-- accepted the message. The engine computes a delivery error and never writes
-- it (noted in the 22 September audit; still true), so a bounce after the
-- handoff leaves no trace here. Resend is the only place that answers
-- "did it land".
--
-- Columns taken from 066's create statement plus the later alters, not from
-- memory.
--
-- Reads only.

select c.sent_at::date            as sent_on,
       coalesce(c.template_key, c.communication_type, '(unnamed)') as template,
       c.sent_to,
       c.delivery_status,
       c.is_staff_notification    as staff_notice,
       c.subject,
       -- The body is HTML. Tags stripped so the first sentences are readable
       -- in a results grid; nothing else about it is changed.
       left(
         regexp_replace(
           regexp_replace(coalesce(c.body, ''), '<[^>]*>', ' ', 'g'),
           '\s+', ' ', 'g'),
         400
       ) as body_opening
  from public.admissions_communications c
 where c.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'
 order by c.sent_at;
