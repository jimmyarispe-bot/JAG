-- 581 - The GA and FL "Decision needed" letter gets its "No" and Jimmy's order.
--
-- Approved by Jimmy, 19 October 2026 11:41 AM ET:
--   [ See entire application ]
--   [ Yes — schedule shadow days ]
--   [ No — not the right fit ]
--   The answer is recorded against your name, ...
--   [ Skip next stage ]
--
-- RUN ONLY AFTER the code with {{not_right_fit_link}} is live. Before that,
-- leaders would receive literal braces.
--
-- GA and FL rows only. HS, Virtual and the network row are untouched.

update public.admissions_communication_templates t
   set body = E'{{student_full_name}} is waiting for you to send {{student_first_name}}\'s Shadow Day invitation.\r\nClick the Yes button below to send the email to {{student_first_name}}\'s parent to schedule {{student_first_name}}\'s Shadow Days.\r\n{{application_view_link}}\r\n\r\n{{invite_shadow_days_link}}\r\n\r\n{{not_right_fit_link}}\r\n\r\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n{{skip_stage_link}}',
       updated_at = now()
  from public.schools s
 where s.id = t.school_id
   and t.template_key = 'staff_shadow_days_decision_email'
   and t.trigger_event = 'staff_shadow_days_decision'
   and s.name in ('The Academy GA', 'The Academy FL');

do $$
begin
  if (select count(*)
        from public.admissions_communication_templates t
        join public.schools s on s.id = t.school_id
       where t.template_key = 'staff_shadow_days_decision_email'
         and s.name in ('The Academy GA', 'The Academy FL')
         and t.body like '%{{not_right_fit_link}}%') <> 2 then
    raise exception '581: expected the GA and FL letters to carry the No button';
  end if;
end $$;
