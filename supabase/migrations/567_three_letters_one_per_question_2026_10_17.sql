-- ============================================================================
-- 567  THREE LETTERS, ONE PER QUESTION
--      17 October 2026
-- ============================================================================
--
-- RUN THIS AFTER THE CODE DEPLOYS (and after 566). These bodies carry
-- {{send_application_link}}, {{invite_shadow_days_link}}, {{accept_link}},
-- {{deny_link}}, {{application_view_link}} and {{record_link}}. Code that
-- does not know them mails them to a school leader as literal braces.
--
-- Until today one letter - decision_gate_staff_email, "Decision needed" -
-- went out for all three decision gates, with one button: "Open the
-- decision". Athena Betras's letter that morning was the after-the-tour
-- question and read as the shadow-days one, because nothing said which.
--
-- Jimmy, 17 October, in Command Center then here:
--
--   "Step 4e 'Decision needed' email to the school leader: delete the 'Open
--    the decision' button. Add a 'Yes - schedule shadow days' button and a
--    'See entire application' button. Keep 'Skip next stage.'"
--
--   His words for it: "Athena is waiting for you to send her Shadow Day
--   invitation. Click the Yes button below to send the email to her parent
--   to schedule her Shadow Days."
--
--   On the other two: "this is how it should be but not with an open
--   decision button". The two below were written to match and he approved
--   them as written.
--
-- "her" -> the child's name, his ruling ("Use the child's name"). The first
-- mention is {{student_full_name}} because this is a staff letter a leader
-- scans for a record (565); the rest are {{student_first_name}}.
--
--   decision_gate_staff_email          decision_gate_opened        after the tour
--   staff_shadow_days_decision_email   staff_shadow_days_decision  after the application
--   staff_admission_decision_email     staff_admission_decision    after shadow days
--
-- Subject unchanged on all three: "Decision needed: {{student_full_name}}".
-- No Skip on the third: there is no stage after the decision. Jimmy, on the
-- Accept/Deny letter: "no skip button here".
-- ============================================================================

begin;

do $$
begin
  if (select count(*) from public.admissions_communication_templates
      where template_key = 'decision_gate_staff_email') <> 1 then
    raise exception 'Refusing: expected exactly 1 decision_gate_staff_email row.';
  end if;
  if not exists (select 1 from public.admissions_communication_templates
      where template_key = 'decision_gate_staff_email'
        and body like '%{{decisions_link}}%'
        and body like '{{student_full_name}} is waiting on your decision.%') then
    raise exception 'Refusing: decision_gate_staff_email does not read as 565 left it. Somebody has edited it.';
  end if;
  if exists (select 1 from public.admissions_communication_templates
      where trigger_event in ('staff_shadow_days_decision', 'staff_admission_decision')) then
    raise exception 'Refusing: a letter already sits on one of the new events.';
  end if;
end $$;

-- (1) After the tour - send the application?
update public.admissions_communication_templates
   set body = E'{{student_full_name}} is waiting for you to send {{student_first_name}}\'s Application for Admissions.\r\nClick the Yes button below to send the email to {{student_first_name}}\'s parent with the application.\r\n{{send_application_link}}\r\n\r\n{{record_link}}\r\n\r\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n{{skip_stage_link}}',
       name = 'Staff: Decision Needed - Send the Application',
       updated_at = now()
 where template_key = 'decision_gate_staff_email';

-- (2) After the application, step 4e - the shadow days. Jimmy's words.
--
-- GA AND FL ONLY. Jimmy, 17 October: "GA + FL only". So the new letter is
-- two campus rows, and the network row on this event - which HS and Virtual
-- fall through to - carries the letter those campuses received until today,
-- exactly as 565 left it. A campus override wins over the network row (see
-- queueLetter / getTemplatesForTrigger), so GA and FL get the new one.
insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number)
values
  ('a1000000-0000-4000-8000-000000000002', 'staff_shadow_days_decision_email',
   'Staff: Decision Needed - Shadow Days (GA)', 'staff_email',
   'staff_shadow_days_decision', 'Decision needed: {{student_full_name}}',
   E'{{student_full_name}} is waiting for you to send {{student_first_name}}\'s Shadow Day invitation.\r\nClick the Yes button below to send the email to {{student_first_name}}\'s parent to schedule {{student_first_name}}\'s Shadow Days.\r\n{{invite_shadow_days_link}}\r\n\r\n{{application_view_link}}\r\n\r\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n{{skip_stage_link}}', 0, true, 'general', 1),
  ('a1000000-0000-4000-8000-000000000001', 'staff_shadow_days_decision_email',
   'Staff: Decision Needed - Shadow Days (FL)', 'staff_email',
   'staff_shadow_days_decision', 'Decision needed: {{student_full_name}}',
   E'{{student_full_name}} is waiting for you to send {{student_first_name}}\'s Shadow Day invitation.\r\nClick the Yes button below to send the email to {{student_first_name}}\'s parent to schedule {{student_first_name}}\'s Shadow Days.\r\n{{invite_shadow_days_link}}\r\n\r\n{{application_view_link}}\r\n\r\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n{{skip_stage_link}}', 0, true, 'general', 1),
  (null, 'staff_shadow_days_decision_email',
   'Staff: Decision Needed - Shadow Days (HS, Virtual)', 'staff_email',
   'staff_shadow_days_decision', 'Decision needed: {{student_full_name}}',
   E'{{student_full_name}} is waiting on your decision.\n\nOpen JAG to review the family\'s information and answer:\n{{decisions_link}}\n\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n{{skip_stage_link}}', 0, true, 'general', 1);

-- (3) After shadow days - accept or deny.
insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number)
values
  (null, 'staff_admission_decision_email',
   'Staff: Decision Needed - Accept or Deny', 'staff_email',
   'staff_admission_decision', 'Decision needed: {{student_full_name}}',
   E'{{student_full_name}} is waiting for your admissions decision.\r\nClick Accept or Deny below to send the email to {{student_first_name}}\'s parent.\r\n{{accept_link}}\r\n\r\n{{deny_link}}\r\n\r\n{{application_view_link}}\r\n\r\nThe answer is recorded against your name, so please do not forward this email for someone else to answer.', 0, true, 'general', 1);

do $$
begin
  if exists (select 1 from public.admissions_communication_templates
      where template_key in ('decision_gate_staff_email',
                             'staff_shadow_days_decision_email',
                             'staff_admission_decision_email')
        and not (template_key = 'staff_shadow_days_decision_email' and school_id is null)
        and (body like '%{{decisions_link}}%' or body like '%Open the decision%')) then
    raise exception 'Refusing: Open the decision is still on a GA/FL or network letter.';
  end if;
  if (select count(*) from public.admissions_communication_templates
      where template_key in ('decision_gate_staff_email',
                             'staff_shadow_days_decision_email',
                             'staff_admission_decision_email')
        and is_active) <> 5 then
    raise exception 'Refusing: expected five active rows (3 network, GA and FL shadow days).';
  end if;
  if not exists (select 1 from public.admissions_communication_templates
      where template_key = 'staff_admission_decision_email'
        and body not like '%{{skip_stage_link}}%') then
    raise exception 'Refusing: the accept-or-deny letter must carry no skip button.';
  end if;
end $$;

commit;

select template_key, trigger_event, subject, body
from public.admissions_communication_templates
where template_key in ('decision_gate_staff_email',
                       'staff_shadow_days_decision_email',
                       'staff_admission_decision_email')
order by template_key;
