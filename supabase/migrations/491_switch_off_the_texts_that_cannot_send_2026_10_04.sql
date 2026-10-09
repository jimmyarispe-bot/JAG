-- 491_switch_off_the_texts_that_cannot_be_sent_2026_10_04.sql
--
-- Switches interview_reminder_2h and tour_reminder_2h OFF. Nothing else.
--
-- Jimmy, 4 October 2026: "moving forward every single itty bitty piece of
-- this build needs to be tested, confirmed and working without fail."
--
-- These two cannot be tested, because there is nothing behind them to test.
--
-- THERE IS NO SMS PROVIDER. deliverCommunication never calls one. The branch
-- is three lines, verbatim:
--
--     } else if (channel === "sms") {
--       deliveryStatus = "logged";
--       deliveryError = "SMS provider not configured for v1.0";
--     }
--
-- and behind it src/lib/communications/providers/stubs.ts holds a Twilio
-- adapter whose isConfigured() returns false and whose send() returns a
-- deferred result. Both layers are placeholders.
--
-- WHY OFF RATHER THAN LEFT ALONE. A row IS written to
-- admissions_communications every time one of these fires - carrying the
-- parent's telephone number in recipient_phone, and delivery_status
-- 'logged'. Anything reading that table without checking delivery_status
-- counts it as a message sent to that family. It is the same shape as the
-- failure this platform keeps producing: a thing that looks handled and is
-- not.
--
-- Switched off, nothing fires, no row is written, and the gap is visible as
-- a gap. That is worth more than a record of messages nobody received.
--
-- THE WORDS ARE KEPT. Off is reversible by one person in the template screen
-- the day a provider exists; deleted is another migration. Both bodies are
-- short and correct and there is no reason to lose them.
--
--     interview_reminder_2h
--     "Reminder: your Interest Meeting for {{student_first_name}} at
--      {{school_name}} is in 2 hours."
--
--     tour_reminder_2h
--     "Reminder: {{school_name}} tour for {{student_name}} in 2 hours at
--      {{campus_name}}. See you soon!"
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set is_active = false,
       updated_at = now()
 where channel = 'sms'
   and is_active;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT three rows: the two text messages, both reading 'off', and a COUNT
-- row reading 0.
--
-- If the count is above zero a third SMS template exists somewhere - most
-- likely a campus override - and it is still armed. The first rows will name
-- it.
--
-- The count row is there on purpose. A verify that proves success by
-- returning no rows cannot tell "it worked" from "the query was wrong".

select 'text message'                                          as what,
       coalesce(sc.name, 'every campus')                       as applies_to,
       t.template_key                                          as detail,
       case when t.is_active then '*** STILL ON ***' else 'off' end as state,
       t.body                                                  as extra

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.channel = 'sms'

union all

select 'COUNT still armed',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'no text can fire — the gap is now visible as a gap'
            else '*** AN SMS TEMPLATE IS STILL ON ***' end,
       ''
  from public.admissions_communication_templates t
 where t.channel = 'sms'
   and t.is_active

 order by what, applies_to, detail;
