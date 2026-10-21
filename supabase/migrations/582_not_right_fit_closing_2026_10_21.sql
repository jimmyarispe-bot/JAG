-- 582 - Jimmy, 21 Oct 2026 6:34 PM ET: the not-right-fit letter's closing becomes his words. GA + FL.
-- RUN 21 Oct ~6:35 PM ET.
update public.admissions_communication_templates t
   set body = E'Dear {{guardian_first_name}},\r\n\r\nThank you for touring {{school_name}} with us and for completing {{student_first_name}}’s application. We have reviewed it carefully.\r\n\r\nWe do not believe we have the best environment and/or support systems in place at {{school_name}} for {{student_first_name}}, so we will not be scheduling {{student_first_name}}’s shadow days.\r\n\r\nWe want to be clear about what this decision means. It is not a negative reflection on {{student_first_name}}. It reflects our school’s inability to provide the support {{student_first_name}} needs to be successful here.\r\n\r\nWe wish you the very best in identifying a school where {{student_first_name}} can thrive.\r\n\r\nWarm regards,\r\n{{admissions_contact_name}}\r\n{{school_name}} Admissions',
       updated_at = now()
  from public.schools s
 where s.id = t.school_id
   and t.template_key = 'not_right_fit_email'
   and s.name in ('The Academy GA', 'The Academy FL');
