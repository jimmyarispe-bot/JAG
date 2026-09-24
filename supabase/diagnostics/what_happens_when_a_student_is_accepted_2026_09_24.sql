/*
  WHAT HAPPENS WHEN A STUDENT IS ACCEPTED — 2026-09-24
  Read-only. Nothing here writes.

  WHY. The acceptance letter is a template row, not code. Before rewriting it
  to say what Jimmy asked for - from the school leader, business office follows
  up on the tuition schedule, contract, payment processing and first month's
  deposit - I have to see what it says today, per campus, and whether anybody
  on staff is told at all.

  WHAT EMPTY MEANS, decided before running it:

  1. the family letter — zero rows means NO acceptance letter exists for that
       campus and accepting a student sends the family nothing. That is a
       finding, not a blank. One row per campus is what I expect; a single row
       with school_id null is a network-wide default.
  2. the staff letter  — zero rows means nobody on staff is emailed when a
       student is accepted. Expected to be empty; if it is, piece 4 is new
       work rather than an edit.
  3. who would be told — zero rows means no campus has a notification contact
       recorded, so even a staff template would reach nobody.
  4. the trigger names — proves which trigger_event strings actually exist on
       templates, so the migration writes to the row the engine reads rather
       than to one I assumed the name of.
*/

select
  '1. the family letter' as check,
  coalesce(s.name, 'ALL CAMPUSES (school_id is null)') as detail,
  'key=' || t.template_key
    || ' | channel=' || t.channel
    || ' | active=' || coalesce(t.is_active::text, 'NULL')
    || ' | subject=' || coalesce(t.subject, 'NO SUBJECT')
    || ' | body=' || left(coalesce(t.body, 'NO BODY'), 400) as extra
from public.admissions_communication_templates t
left join public.schools s on s.id = t.school_id
where t.trigger_event = 'student_accepted'

union all

select
  '2. the staff letter',
  coalesce(s.name, 'ALL CAMPUSES (school_id is null)'),
  'key=' || t.template_key
    || ' | channel=' || t.channel
    || ' | active=' || coalesce(t.is_active::text, 'NULL')
    || ' | subject=' || coalesce(t.subject, 'NO SUBJECT')
from public.admissions_communication_templates t
left join public.schools s on s.id = t.school_id
where t.trigger_event = 'staff_application_accepted'

union all

select
  '3. who would be told',
  coalesce(s.name, 'unknown campus'),
  coalesce(c.name, 'no name') || ' <' || coalesce(c.email, 'no email') || '>'
    || ' | notifications=' || coalesce(c.receives_notifications::text, 'NULL')
from public.school_admissions_contacts c
left join public.schools s on s.id = c.school_id
where coalesce(c.is_active, true)

union all

select
  '4. the trigger names in use',
  t.trigger_event,
  count(*)::text || ' templates'
from public.admissions_communication_templates t
group by t.trigger_event

order by 1, 2;
