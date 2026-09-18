-- The staff inquiry notice now says what the family attached.
--
-- Maddox Mixon, Ziare Moore and Alana Swan each sent a scholarship award letter
-- through the inquiry form on 14-15 September 2026. Each notification read:
--
--   New inquiry submitted for Maddox (-). Guardian: amyldamico@gmail.com
--
-- Identical to a notice from a family who attached nothing. All three sat
-- unread for three days while funding deadlines ran.
--
-- {{attachment_note}} is empty when nothing was attached and otherwise carries
-- its own label and full stop, because templates have no conditionals.
--
-- The parenthesised {{program_name}} is dropped. It rendered "(-)" on every one
-- of the ten unread notices - an em-dash in brackets, which reads as a fault
-- rather than as an unanswered question.

update public.admissions_communication_templates
set body = 'New inquiry submitted for {{student_name}}. Guardian: {{parent_email}} {{parent_phone}}. {{attachment_note}}'
where trigger_event = 'staff_new_inquiry'
  and body like 'New inquiry submitted for%';
