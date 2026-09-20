-- 247_admissions_gate_templates.sql
--
-- The emails each decision gate can send, and the shadow-days booking link.
--
-- The two decline messages are Jimmy's wording, kept close to verbatim. They are
-- careful on purpose: the second says the limitation is the school's, not the
-- child's. Anyone editing these later should preserve that. A family reads this
-- email once and remembers it for years.

-- A school's shadow-days booking link. Separate from bookings_url (tours and
-- interest calls) because they are different appointments with different lengths
-- and different people, and conflating them would send a family to the wrong
-- calendar at the most sensitive point in the process.
alter table public.schools
  add column if not exists shadow_days_url text;

alter table public.schools
  drop constraint if exists schools_shadow_days_url_https;

alter table public.schools
  add constraint schools_shadow_days_url_https
  check (shadow_days_url is null or shadow_days_url ~* '^https://');

comment on column public.schools.shadow_days_url is
  'Public booking link for shadow days. Sent to a family only after the school leader answers the invite_to_shadow_days gate with yes.';

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours)
values

  -- Gate 1, yes: invite the family to apply.
  (null, 'application_invite_email', 'Application Invitation', 'email', 'application_invited',
   'Next step for {{student_name}} — your application to {{school_name}}',
   E'Dear {{parent_name}},\n\nThank you for the time you spent with us talking about {{student_name}}. We would like to invite you to complete an application for admission to {{school_name}}.\n\nYou can begin here: {{application_link}}\n\nYou will not need to repeat anything you already told us on your inquiry — that information is already on the application.\n\nIf you have questions at any point, reply to this email and it will reach {{admissions_contact_name}} directly.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}} Admissions',
   0),

  -- Gate 1, no: a warm close before an application was ever asked for.
  (null, 'inquiry_closed_email', 'Inquiry Closed With Thanks', 'email', 'application_not_invited',
   'Thank you from {{school_name}}',
   E'Dear {{parent_name}},\n\nThank you for sharing information with us about {{student_name}}. We appreciate the time and trust that took.\n\nWe wish you the very best in identifying a school where {{student_name}} can be successful.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}} Admissions',
   0),

  -- Gate 2, yes: invite the family to book shadow days.
  (null, 'shadow_days_invite_email', 'Shadow Days Invitation', 'email', 'shadow_days_invited',
   'Shadow days for {{student_name}} at {{school_name}}',
   E'Dear {{parent_name}},\n\nThank you for completing {{student_name}}''s application. We would like to invite {{student_name}} to spend shadow days with us — time in the school, with the students and teachers {{student_name}} would be learning alongside.\n\nYou can choose your days here: {{shadow_days_link}}\n\nIf none of the times work, reply to this email and we will find something that does.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}} Admissions',
   0),

  -- Gate 2, no: declined after a full application. The hardest email in the set.
  (null, 'application_declined_email', 'Application Declined', 'email', 'shadow_days_not_invited',
   'Regarding {{student_name}}''s application to {{school_name}}',
   E'Dear {{parent_name}},\n\nThank you for submitting {{student_name}}''s application for admission. After thorough review and full, thoughtful consideration, we are not able to move {{student_name}} forward in the admissions process.\n\nWe want to be clear about what this decision means. It is not a negative reflection on {{student_name}}. It reflects our school''s inability to provide the support {{student_name}} needs to be successful here.\n\nWe wish you the very best in identifying a school where {{student_name}} can thrive.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}} Admissions',
   0),

  -- Every gate: tell the school leader a decision is waiting. No decision links
  -- in the mail -- it points into JAG, where the answer carries a name.
  (null, 'decision_gate_staff_email', 'Staff: A Decision Is Waiting', 'staff_email', 'decision_gate_opened',
   'Decision needed: {{student_name}}',
   E'{{student_name}} is waiting on your decision.\n\nOpen JAG to review the family''s information and answer:\n{{decisions_link}}\n\nThe answer is recorded against your name, so please do not forward this email for someone else to action.',
   0)

on conflict (school_id, template_key) do update set
  name = excluded.name,
  subject = excluded.subject,
  body = excluded.body,
  delay_hours = excluded.delay_hours,
  trigger_event = excluded.trigger_event,
  channel = excluded.channel;

notify pgrst, 'reload schema';
