-- 481_the_three_letters_stop_saying_interview_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. Letter 2 uses {{interview_time}},
-- a merge field that does not exist until this ship lands. renderTemplate
-- leaves an unknown token in place as literal text, so run in the wrong order
-- a parent reads "tomorrow at {{interview_time}}".
--
-- Heather Badger-Brown, 24 September 2026: "The Jag is setting up interviews.
-- We haven't interviewed prospective families."
--
-- The labels inside JAG were changed after that. The letters were not. The
-- only migration that had ever written these three is 068, the original seed,
-- so the word has been in front of families since the day the templates were
-- created. The commit that was supposed to carry the fix - 244b2e59, "a
-- shadow day is not an interest meeting, in BOTH doors" - shipped four
-- teacher-pay files and none of this, which is the same index-versus-working-
-- tree fault that shipped a stale call-token.ts on 3 October.
--
-- THE WORDS BELOW ARE JIMMY'S, from a document he wrote on 4 October. Two
-- departures, both typos rather than instructions:
--
--   "by the end our conversation" -> "by the end of our conversation"
--   the embedded question about the date format, which is answered in code:
--   appointmentTextForFamily now renders "Wednesday, October 7, 2026 @
--   3:15 PM" instead of "Wednesday, 7 October 2026 at 3:15 PM". American
--   order, per his standing rule.
--
-- THE 24-HOUR REMINDER HAS NEVER CARRIED A TIME. interview_datetime was set
-- only on the immediate send; a queued letter is rendered from the lead when
-- it goes out, and that path reads the latest TOUR. So the letter said
-- "tomorrow at ." with nothing after it. Fixed in the same ship: the queue
-- row now carries merge_overrides naming the appointment. It had never been
-- seen because until the 11pm scan ran on 3 October, nothing had ever told
-- the platform a family had booked, so these rows were never written.
--
-- Safe to re-run.

begin;

-- ── 1. When the meeting is booked ────────────────────────────────────────────

update public.admissions_communication_templates
   set subject = 'Interest Meeting confirmed — {{student_first_name}}',
       body = $one$Dear {{guardian_first_name}},

Your interest meeting with me to discuss {{student_first_name}} and our school is confirmed for {{interview_datetime}}.

During our conversation, I would like you to share everything you can about {{student_first_name}} with me. Additionally, I will share with you all the awesome things about our school. My hope is that by the end of our conversation both of us will have a pretty good idea of whether our school could be an environment in which {{student_first_name}} could be successful.

I am looking forward to our meeting.

Warm regards,
{{admissions_contact_name}}
{{school_name}}$one$,
       updated_at = now()
 where template_key = 'interview_confirmation_email'
   and school_id is null;

-- ── 2. The day before ────────────────────────────────────────────────────────

update public.admissions_communication_templates
   set subject = 'Tomorrow — Interest Meeting for {{student_first_name}}',
       body = $two$Dear {{guardian_first_name}},

I just wanted to send you a quick reminder about our meeting to discuss {{student_first_name}} tomorrow at {{interview_time}}. We are looking forward to it.

See you tomorrow!
{{admissions_contact_name}}
{{school_name}}$two$,
       updated_at = now()
 where template_key = 'interview_reminder_24h'
   and school_id is null;

-- ── 3. Two hours before, by text ─────────────────────────────────────────────
--
-- No subject: an SMS has none. The channel is 'sms', which engine.ts logs
-- rather than sends - "SMS provider not configured for v1.0" - so this one is
-- written for the day that changes, not for tonight.

update public.admissions_communication_templates
   set body = $three$Reminder: your Interest Meeting for {{student_first_name}} at {{school_name}} is in 2 hours.$three$,
       updated_at = now()
 where template_key = 'interview_reminder_2h'
   and school_id is null;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT three rows, every one of them reading "clean".
--
-- "*** STILL SAYS INTERVIEW ***" means an update missed - most likely because
-- a campus holds its own copy of that letter, which this did not touch. The
-- applies_to column will show it.
--
-- Letter 2 must contain {{interview_time}} and NOT {{interview_datetime}}:
-- the full date after the word "tomorrow" is the thing that reads wrong.

select coalesce(sc.name, 'every campus')                                as applies_to,
       t.template_key,
       t.channel,
       case when t.is_active then 'ON' else 'off' end                   as state,
       case when t.subject ilike '%interview%' or t.body ilike '%interview%'
            then '*** STILL SAYS INTERVIEW ***' else 'clean' end        as wording,
       case when t.template_key = 'interview_reminder_24h'
                 and t.body not like '%{{interview_time}}%'
            then '*** MISSING {{interview_time}} ***' else '' end       as time_token,
       t.subject,
       t.body

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'interview_confirmation_email',
         'interview_reminder_24h',
         'interview_reminder_2h'
       )
 order by t.template_key, applies_to;
