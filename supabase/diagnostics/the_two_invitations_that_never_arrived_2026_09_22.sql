/*
  THE TWO INVITATIONS THAT NEVER ARRIVED — read-only. Nothing here writes.

  PURPOSE. Print, word for word, what Dominic Anders' and Deidra Williams'
  families were meant to receive on 15 Sep 2026 and never did, so Jimmy can
  approve the wording before either is re-sent.

  This is not a draft anybody has written. It is the message the platform
  actually composed and handed to Resend, which rejected it because
  theacademyfl.org was unverified. The wording has therefore already been
  through the template and the merge fields.

  HOW TO SEND ONE once approved: open the lead page (the URL is in the result),
  find the failed communication, and use Resend. That calls
  resendCommunication(), which re-sends this exact subject and body and writes
  a fresh row with metadata.resent_from pointing at the original.

  KNOWN ISSUE, worth deciding before you click: resendCommunication() calls
  sendTransactionalEmail() WITHOUT a `from`, so the re-send will come from
  EMAIL_FROM (noreply@theacademyway.org) rather than from
  danni.treu@theacademyfl.org. It will deliver - that domain is verified - but
  the family sees a different sender than the school they toured.

  WHAT EMPTY MEANS: zero rows would mean these communications are not where
  the audit found them. Two rows is correct - one per family.
*/

select
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as student,
  coalesce(l.guardian_first_name, '') || ' ' || coalesce(l.guardian_last_name, '')
    as guardian,
  c.sent_to                                                      as goes_to,
  to_char(c.created_at, 'YYYY-MM-DD HH24:MI')                    as first_attempted,
  c.subject,
  c.body,
  'https://theacademyway.thejag.org/dashboard/admissions/leads/' || l.id::text
    as lead_page
from public.admissions_communications c
join public.admissions_leads l on l.id = c.lead_id
where c.trigger_event = 'application_invited'
  and c.delivery_status = 'failed'
order by student;
