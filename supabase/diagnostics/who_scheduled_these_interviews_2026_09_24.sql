/*
  WHO SCHEDULED THESE INTERVIEWS, AND WHO WAS TOLD — 2026-09-24
  Read-only. Nothing here writes.

  WHY. Heather Badger-Brown, today: "The Jag is setting up interviews. We
  haven't interviewed prospective families. It didn't invite me either!" A
  parent, Amy D'Amico, received an email on 17 September saying Maddox had an
  interview today at 1:00 PM at "Main Campus".

  "Main Campus" is the hard-coded fallback in merge-fields.ts for a lead with
  no campus name, so that line was not read off a record - it was a default
  rendering as if it were a fact.

  WHAT EMPTY MEANS, decided before running it:

  1. the interviews   — zero rows means nothing was ever scheduled and the email
      came from somewhere else entirely, which would be a bigger finding than
      this file is looking for. Rows with a host_user_id tell us WHO did it;
      rows with none mean it was created by a path that had no user.
  2. the family mail  — zero rows means the parent's email did not come from
      admissions_communications, so it came from somewhere outside the
      communications engine. Rows show exactly what was sent and to whom.
  3. the staff mail   — ZERO ROWS IS THE FINDING. It would mean that when an
      interview is scheduled the family is emailed and no member of staff ever
      is, which is what Heather is reporting.
  4. every staff template, by channel — THIS IS THE ONE THAT MATTERS.
      `internal_note` RECORDS a message and never SENDS one. A staff template
      sitting on that channel looks configured, reports no error, and reaches
      nobody. staff_application_accepted was found in exactly that state this
      morning. This section asks whether it was alone.
*/

select
  '1. the interviews' as check,
  to_char(i.created_at, 'YYYY-MM-DD HH24:MI') as detail,
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' | for ' || coalesce(to_char(i.scheduled_at, 'YYYY-MM-DD HH24:MI'), 'NO DATE')
    || ' | type=' || coalesce(i.interview_type, 'NULL')
    || ' | host=' || coalesce(i.host_user_id::text, 'NOBODY')
    || ' | school=' || coalesce(s.name, 'NULL') as extra
from public.admissions_interviews i
left join public.admissions_leads l on l.id = i.lead_id
left join public.schools s on s.id = l.school_id

union all

select
  '2. what the family was sent',
  to_char(c.created_at, 'YYYY-MM-DD HH24:MI'),
  coalesce(c.trigger_event, 'no trigger')
    || ' | to=' || coalesce(c.sent_to, 'NULL')
    || ' | status=' || coalesce(c.delivery_status, 'NULL')
    || ' | staff=' || coalesce(c.is_staff_notification::text, 'NULL')
from public.admissions_communications c
where c.trigger_event in ('interview_scheduled', 'staff_interview_scheduled')

union all

select
  '3. staff notifications ever sent',
  'rows where is_staff_notification is true',
  count(*)::text
from public.admissions_communications
where is_staff_notification

union all

/*
  4. Every staff template and the channel it sits on. A row saying
     internal_note is a notification that has never left the building.
*/
select
  '4. staff templates by channel',
  t.trigger_event,
  'channel=' || t.channel
    || ' | active=' || coalesce(t.is_active::text, 'NULL')
    || case when t.channel = 'internal_note'
         then '  <-- RECORDS ONLY, NEVER SENDS' else '' end
from public.admissions_communication_templates t
where t.trigger_event like 'staff\_%'

order by 1, 2;
