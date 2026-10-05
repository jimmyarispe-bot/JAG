-- ============================================================================
-- WHY THE BUTTON DID NOTHING
-- 5 October 2026 — read-only. Nothing in this file writes anything.
--
-- Jimmy completed a fake application to The Academy Virtual, received the
-- staff notice, clicked "Send them the interest meeting link", landed on the
-- real token page, pressed the button, and nothing happened.
--
-- The source code is clean. I have read all three files in that path:
--   the form posts to the action, the hidden token is there, the button is
--   type=submit, the button was not disabled, and the redirect is not inside
--   a try/catch. So the fault is at runtime, not in the source, and only the
--   database can say which of three things happened.
--
-- Section 2 is the one that decides it:
--   rows present  -> the press reached the server and the letter was written
--   no rows       -> the press never reached the server at all
-- ============================================================================


-- ── 1. The lead behind that token ───────────────────────────────────────────
--
-- Confirms the token resolves, which campus it belongs to, and that there is
-- an email address to send to.

select 'the lead'                                   as section,
       l.id                                         as lead_id,
       coalesce(l.preferred_name,
                l.first_name || ' ' || l.last_name) as student,
       sc.name                                      as campus,
       l.guardian_email,
       l.lead_stage,
       l.created_at
  from public.admissions_leads l
  left join public.schools sc on sc.id = l.school_id
 where l.interest_link_token =
       '09b13da902df4b5581fdbb6195f9982d5054a4889d364f54a7560ee16d8112ec';


-- ── 2. Did the press reach the server? ──────────────────────────────────────
--
-- Every letter ever written for that lead, newest first.
--
--   If you see inquiry_thank_you_email (or inquiry_thank_you_email_no_link)
--   with a timestamp around when you pressed, the button worked and the
--   letter went — the problem is only that the page did not tell you.
--
--   If you see nothing from this morning, the press never arrived and the
--   fault is in the browser, not the platform.

select 'what was written'       as section,
       c.template_key,
       c.trigger_event,
       c.communication_type   as channel,
       c.delivery_status,
       c.sent_to,
       c.is_staff_notification,
       c.subject,
       c.created_at
  from public.admissions_communications c
 where c.lead_id = (
         select l.id
           from public.admissions_leads l
          where l.interest_link_token =
                '09b13da902df4b5581fdbb6195f9982d5054a4889d364f54a7560ee16d8112ec'
       )
 order by c.created_at desc;


-- ── 3. Is there a letter to send at all? ────────────────────────────────────
--
-- The family's first letter at all four campuses. If The Academy Virtual's
-- row is off, or sits on an event other than interest_meeting_link_sent, then
-- the button did its job, found nothing to send, and said so — which would be
-- a worse bug than a dead button, and a different fix.
--
-- WHAT GOOD LOOKS LIKE: every row ON, event interest_meeting_link_sent,
-- channel email.

select 'the first letter'                           as section,
       coalesce(sc.name, '*** NETWORK (all campuses) ***') as campus,
       t.template_key,
       t.channel,
       t.trigger_event,
       case when t.is_active then 'ON' else 'off' end      as state,
       t.delay_hours,
       case
         when t.trigger_event <> 'interest_meeting_link_sent'
           then '>>> WRONG EVENT — the button cannot reach this letter'
         when not t.is_active
           then '>>> OFF — the button will find nothing to send'
         when t.channel <> 'email'
           then '>>> WRONG CHANNEL — the engine does not send this'
         else 'ok'
       end                                                 as verdict
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in ('inquiry_thank_you_email',
                          'inquiry_thank_you_email_no_link')
 order by sc.name nulls first, t.template_key;


-- ── 4. Anything still sitting in the queue for that lead ────────────────────
--
-- A letter can be written as pending and never picked up. This shows whether
-- one is waiting.

select 'still waiting'    as section,
       q.template_key,
       q.channel,
       q.status,
       q.scheduled_for,
       q.created_at
  from public.admissions_communication_queue q
 where q.lead_id = (
         select l.id
           from public.admissions_leads l
          where l.interest_link_token =
                '09b13da902df4b5581fdbb6195f9982d5054a4889d364f54a7560ee16d8112ec'
       )
 order by q.created_at desc;
