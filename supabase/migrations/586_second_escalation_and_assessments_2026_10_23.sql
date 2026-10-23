-- 586 — THE SECOND ESCALATION, AND THE ASSESSMENT LETTER (23 October 2026)
--
-- 1. staff_interest_meeting_no_response_2
--    Chase Laverde: escalated 13 October, never called, never booked, and the
--    JAG said nothing more for ten days. Approved by Jimmy 23 October: tell the
--    school leader again three days later, once. One row per campus that has
--    the first escalation active, so the campus override rule still holds.
--    Wording is a first draft - edit it in the template admin.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours, is_active, category, description)
select
  t.school_id,
  'staff_interest_meeting_no_response_2',
  'Staff: Still No Call, Still No Booking',
  'staff_email',
  'staff_interest_meeting_no_response_2',
  'Still not called: {{student_first_name}}''s parents',
  E'{{student_name}} — {{school_name}}\r\n\r\n'
  || E'Three days ago you were asked to call this family. No call has been recorded and nothing is booked.\r\n\r\n'
  || E'{{guardian_name}}\r\n{{parent_phone}}\r\n{{guardian_email}}\r\n\r\n'
  || E'Record your notes of the conversation here.\r\n{{call_link}}\r\n\r\n'
  || E'This is the last automatic reminder about {{student_first_name}}. The call task stays open on the card until it is done.',
  0,
  true,
  t.category,
  'Second and last escalation, three days after the first, if no call is recorded and nothing is booked.'
from public.admissions_communication_templates t
where t.trigger_event = 'staff_interest_meeting_no_response'
  and t.is_active
  and not exists (
    select 1 from public.admissions_communication_templates x
    where x.trigger_event = 'staff_interest_meeting_no_response_2'
      and x.school_id is not distinct from t.school_id
  );

-- 2. staff_assessment_requested
--    Jimmy, 9 October: "schedule assessment and anything assessments related
--    only relates to hs n virtual. when schedule assessments is selected an
--    email is sent from heather to mahogany.murphy@theacademyway.org to
--    schedule assessment with the specific parent/child selected"
--    HS and Virtual only.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours, is_active, category, description)
select
  s.id,
  'staff_assessment_requested',
  'Staff: Schedule Assessment (to Mahogany)',
  'staff_email',
  'staff_assessment_requested',
  'Schedule assessment: {{student_name}}',
  E'Mahogany,\r\n\r\n'
  || E'Please schedule an assessment for {{student_name}} — {{school_name}}.\r\n\r\n'
  || E'{{guardian_name}}\r\n{{parent_phone}}\r\n{{guardian_email}}\r\n\r\n'
  || E'Heather',
  0,
  true,
  'admissions',
  'Sent from Heather to Mahogany when a child at HS or Virtual is moved to Assessments.'
from public.schools s
where s.id in ('a1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000004')
  and not exists (
    select 1 from public.admissions_communication_templates x
    where x.trigger_event = 'staff_assessment_requested' and x.school_id = s.id
  );
