-- 233_school_admissions_contact.sql
--
-- An admissions contact and a booking link, per school.
--
-- The point: a family who enquires hears from a named person at the school they
-- chose, with that person's own Google appointment schedule attached, and the
-- school leader hears that the enquiry arrived. Today the family gets a generic
-- "Admissions" signature pointing at a parent portal they have no account for,
-- and nobody at the school is told anything.
--
-- No Google API and no OAuth. A Google appointment schedule publishes a booking
-- URL; that URL is a string. The leader keeps their own availability in their
-- own calendar, Google sends both parties the invite, and this system only has
-- to know where to point.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Where the contact lives
-- ---------------------------------------------------------------------------

alter table public.schools
  add column if not exists admissions_contact_name  text,
  add column if not exists admissions_contact_email text,
  add column if not exists admissions_booking_url   text;

comment on column public.schools.admissions_contact_name is
  'The person a prospective family hears from. Shown as the From name and in '
  'the signature. Null means fall back to the generic school signature.';

comment on column public.schools.admissions_contact_email is
  'Reply-to on the family''s confirmation, and the recipient of the new-inquiry '
  'alert. NOT the From address -- mail is sent from the verified domain, '
  'because sending as an address we do not own is how a school ends up in spam.';

comment on column public.schools.admissions_booking_url is
  'Public Google appointment-schedule URL for this school''s admissions '
  'contact. Null is a supported state: the confirmation then promises a human '
  'follow-up instead of a link, rather than emailing a broken one.';

-- A booking URL that is not a URL would be mailed to a parent verbatim.
alter table public.schools
  drop constraint if exists schools_admissions_booking_url_is_url;
alter table public.schools
  add constraint schools_admissions_booking_url_is_url
  check (
    admissions_booking_url is null
    or admissions_booking_url ~ '^https://'
  );

-- ---------------------------------------------------------------------------
-- 2) A channel for mail addressed to staff
-- ---------------------------------------------------------------------------
--
-- `internal_note` already exists but is a record, not a message -- it never
-- sends. The delivery path addresses every `email` to the guardian, so a staff
-- alert needs a channel of its own rather than a template that would be
-- cheerfully mailed to the parent.

alter table public.admissions_communication_templates
  drop constraint if exists admissions_communication_templates_channel_check;
alter table public.admissions_communication_templates
  add constraint admissions_communication_templates_channel_check
  check (channel in ('email', 'sms', 'portal_notification', 'internal_note', 'staff_email'));

-- ---------------------------------------------------------------------------
-- 3) The family's confirmation, rewritten
-- ---------------------------------------------------------------------------
--
-- Was: "Next steps: 1. Sign in to the Parent Portal 2. Begin your application"
-- — a software tour, offered to somebody who has not yet decided whether they
-- want to talk to us, and gated behind an account they do not have.

update public.admissions_communication_templates
set
  subject = 'Thank you for your interest in {{school_name}} — {{student_name}}',
  body = E'Dear {{parent_name}},\n\n'
      || E'Thank you for your interest in {{school_name}}. We received your inquiry for {{student_name}}.\n\n'
      || E'The next step is a conversation. Please pick a time that suits you:\n\n'
      || E'{{scheduling_link}}\n\n'
      || E'We will use it to hear about {{student_name}} in your own words, answer your questions, and explain how we support students with learning differences.\n\n'
      || E'If none of those times work, simply reply to this email.\n\n'
      || E'Warm regards,\n'
      || E'{{admissions_contact_name}}\n'
      || E'{{school_name}}',
  updated_at = now()
where template_key = 'inquiry_thank_you_email';

-- The same message for a school with no booking link yet. The application code
-- picks this one when `admissions_booking_url` is null, because the renderer
-- leaves an unknown token in place -- a family would otherwise be emailed the
-- literal characters {{scheduling_link}}.
insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours)
select
  null,
  'inquiry_thank_you_email_no_link',
  'Inquiry Thank You (no booking link)',
  'email',
  'inquiry_submitted',
  'Thank you for your interest in {{school_name}} — {{student_name}}',
  E'Dear {{parent_name}},\n\n'
    || E'Thank you for your interest in {{school_name}}. We received your inquiry for {{student_name}}.\n\n'
    || E'{{admissions_contact_name}} will be in touch shortly to arrange a time to talk — in person or online, whichever suits you.\n\n'
    || E'If it is easier, simply reply to this email.\n\n'
    || E'Warm regards,\n'
    || E'{{admissions_contact_name}}\n'
    || E'{{school_name}}',
  0
where not exists (
  select 1 from public.admissions_communication_templates
  where template_key = 'inquiry_thank_you_email_no_link'
);

-- ---------------------------------------------------------------------------
-- 4) The school leader's alert
-- ---------------------------------------------------------------------------
--
-- Deliberately plain and short. It is read on a phone, and the only question it
-- has to answer is "is this worth opening the laptop for".

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours)
select
  null,
  'inquiry_staff_alert',
  'New Inquiry — School Leader Alert',
  'staff_email',
  'inquiry_submitted',
  'New inquiry: {{student_name}} — {{school_name}}',
  E'{{student_name}} — new inquiry at {{school_name}}.\n\n'
    || E'Parent: {{parent_name}}\n'
    || E'Email: {{parent_email}}\n'
    || E'Phone: {{parent_phone}}\n'
    || E'Grade: {{program_name}}\n\n'
    || E'They have been sent your booking link. Reply to this email to reach them directly.\n\n'
    || E'Full record: {{lead_link}}',
  0
where not exists (
  select 1 from public.admissions_communication_templates
  where template_key = 'inquiry_staff_alert'
);

-- ---------------------------------------------------------------------------
-- 5) What is set, and what is still missing
-- ---------------------------------------------------------------------------
--
-- Fill these in with the UPDATE statements in
-- `234-set-school-admissions-contacts.sql`, then re-run this query. Any school
-- with a null booking URL will send the no-link version, which is correct
-- behaviour rather than a failure -- but it is also not what you want long-term.

select
  s.name as school,
  coalesce(s.admissions_contact_name,  '— not set —') as contact_name,
  coalesce(s.admissions_contact_email, '— not set —') as contact_email,
  case
    when s.admissions_booking_url is null then '— not set, will send the no-link email —'
    else s.admissions_booking_url
  end as booking_url
from public.schools s
order by s.name;
