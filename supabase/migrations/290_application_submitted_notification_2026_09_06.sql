-- 290: tell the school leader an application arrived — by email, with a link.
--
-- Step 3 of the admissions spec: "Application completed -> school leader
-- notified, with a link that opens THAT STUDENT'S PROFILE, including everything
-- and every document supplied."
--
-- WHY NOTHING REACHES ANYONE TODAY. Not because nothing fires — something does.
-- The portal calls onApplicationSubmitted, which dispatches
-- `application_submitted`, which maps to the legacy pair
-- ["application_submitted", "staff_application_submitted"], which looks up
-- templates by trigger_event and finds one. The wiring is complete.
--
-- The template is the problem, in two ways:
--
--   1. Its channel is `internal_note`. The engine never emails those — it sets
--      sent_to = 'staff', marks the row 'sent', and files it. A leader who does
--      not go looking never learns an application exists.
--
--   2. Its body is one sentence: "Application submitted for {{student_name}} —
--      ready for review." No school, no link, nothing about the child. Even
--      read, it does not tell anyone where to go.
--
-- So the fix is this migration, not code. Channel becomes `staff_email`, which
-- the engine delivers to the school's admissions contact, and the body carries
-- the link.
--
-- WHAT THE EMAIL DELIBERATELY DOES NOT CONTAIN.
--
-- The family's answers. The spec says the leader should see everything the
-- family supplied, and the right place for that is the record — not an inbox.
-- What a parent wrote about their child's challenges is not something to
-- scatter into mailboxes and forwarded threads when a link to the page that
-- already holds it, and the documents, is one click.
--
-- The link is `{{lead_link}}` -> /dashboard/admissions/leads/<id>. At
-- application_submitted THERE IS NO STUDENT RECORD YET — a student is created
-- on acceptance — so a link to a student profile would 404 for exactly the
-- families this email is about.
--
-- IDEMPOTENT.

begin;

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours)
values
  (null, 'staff_application_submitted', 'Staff: Application Submitted', 'staff_email',
   'staff_application_submitted',
   '{{student_name}} has completed an application to {{school_name}}',
   E'{{student_name}} has completed an application to {{school_name}}.\n\nEverything the family told us — and every document they supplied — is on their record:\n{{lead_link}}\n\nRead it before you answer the shadow-days decision waiting for you. What a family says about their child''s greatness and challenges is the reason they chose to tell us.\n\nParent: {{parent_name}}\nEmail: {{parent_email}}\nPhone: {{parent_phone}}',
   0)

on conflict (school_id, template_key) do update set
  name          = excluded.name,
  channel       = excluded.channel,
  trigger_event = excluded.trigger_event,
  subject       = excluded.subject,
  body          = excluded.body,
  delay_hours   = excluded.delay_hours,
  is_active     = true;

commit;

notify pgrst, 'reload schema';

-- 1. The template, as it now stands.
select template_key, channel, trigger_event, subject, is_active
from public.admissions_communication_templates
where template_key = 'staff_application_submitted';

-- 2. THE THING TO CHECK BEFORE TRUSTING THIS.
--
-- `staff_email` is delivered to the school's admissions contact address. A
-- school with none gets an email addressed to nobody, which the engine records
-- as pending and never sends — the same silence, one layer down. Every school
-- below must have a contact email.
select s.name                                        as school,
       coalesce(s.admissions_contact_name, '—')      as contact,
       coalesce(s.admissions_contact_email, '(NONE — this school will get nothing)')
                                                     as contact_email
from public.schools s
order by s.name;
