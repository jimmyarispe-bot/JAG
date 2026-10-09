-- 490_the_24_hour_reminder_drops_see_you_tomorrow_2026_10_04.sql
--
-- Jimmy, 4 October 2026, reading the letter: "delete see you tomorrow".
--
-- One line out of interview_reminder_24h. Nothing else in the letter changes.
--
-- WAS, verbatim:
--
--     Dear {{guardian_first_name}},
--
--     I just wanted to send you a quick reminder about our meeting to discuss
--     {{student_first_name}} tomorrow at {{interview_time}}. We are looking
--     forward to it.
--
--     See you tomorrow!
--     {{admissions_contact_name}}
--     {{school_name}}
--
-- IT NOW ENDS WITH NO SIGN-OFF WORD. "See you tomorrow!" was doing double
-- duty: it was the second "looking forward" in three lines, and it was also
-- the only thing standing between the last sentence and the signature. Taking
-- it out leaves the name directly under the body.
--
-- That is what was asked for and it is what this does. Every other letter in
-- the chain closes on "Warm regards," or "Thank you," - say the word if this
-- one should too, and it is one more line.
--
-- {{interview_time}} IS LEFT ALONE. It renders "3:15 PM" and it is the whole
-- reason this letter is worth anything: until 4 October it resolved to the
-- empty string and the letter read "tomorrow at ." with nothing after it.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set body = $letter$Dear {{guardian_first_name}},

I just wanted to send you a quick reminder about our meeting to discuss {{student_first_name}} tomorrow at {{interview_time}}. We are looking forward to it.

{{admissions_contact_name}}
{{school_name}}$letter$,
       updated_at = now()
 where template_key = 'interview_reminder_24h'
   and body like '%See you tomorrow!%';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT one row, "every campus", ON, and both checks clean.
--
-- A second row means a campus holds its own copy of this letter, which this
-- did not touch, and that campus is still saying it.

select coalesce(sc.name, 'every campus')                               as applies_to,
       case when t.is_active then 'ON' else '*** switched off ***' end as state,
       t.subject,
       t.body,
       case when t.body like '%See you tomorrow!%'
            then '*** STILL SAYS IT ***' else 'gone' end               as line_check,
       case when t.body like '%{{interview_time}}%'
            then 'still carries the time'
            else '*** THE TIME TOKEN IS MISSING ***' end               as time_check,
       t.updated_at

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'interview_reminder_24h'
 order by applies_to;
