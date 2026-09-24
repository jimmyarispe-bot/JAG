/*
  EVERY LETTER THAT SAYS INTERVIEW — 2026-09-24
  Read-only. Nothing here writes.

  WHY. Jimmy, today: "there shouldn't be anything that says interview. we don't
  do interviews." The code has been changed to say "interest meeting"
  everywhere a person reads it; the letters live in the database and are next.

  I am not rewriting text I have not read. Section 2 catches any template that
  mentions an interview even if its trigger does not - a reminder, a thank-you,
  anything - so the rewrite covers all of them rather than the three I happen
  to know about.

  WHAT EMPTY MEANS, decided before running it:

  1. zero rows means the three interview templates do not exist, which would
     mean the email Amy D'Amico received came from somewhere else and this
     whole line of enquiry is wrong.
  2. ZERO ROWS IS THE GOOD ANSWER. It would mean no other template anywhere
     mentions an interview and section 1 is the complete list. Any row here is
     a letter nobody has looked at yet.
*/

select
  '1. the interview templates' as check,
  t.template_key as detail,
  'trigger=' || t.trigger_event
    || ' | channel=' || t.channel
    || ' | active=' || coalesce(t.is_active::text, 'NULL')
    || ' | subject=' || coalesce(t.subject, 'NO SUBJECT')
    || ' | body=' || coalesce(t.body, 'NO BODY') as extra
from public.admissions_communication_templates t
where t.trigger_event in (
  'interview_scheduled', 'interview_reminder_24h',
  'interview_reminder_2h', 'staff_interview_scheduled'
)

union all

select
  '2. anything else that says interview',
  t.template_key,
  'trigger=' || t.trigger_event
    || ' | channel=' || t.channel
    || ' | subject=' || coalesce(t.subject, 'NO SUBJECT')
from public.admissions_communication_templates t
where (t.subject ilike '%interview%' or t.body ilike '%interview%')
  and t.trigger_event not in (
    'interview_scheduled', 'interview_reminder_24h',
    'interview_reminder_2h', 'staff_interview_scheduled'
  )

order by 1, 2;
