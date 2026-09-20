-- 297_reminder_copy_2026_09_07.sql
--
-- Jimmy's wording for the enrollment reminder. One sentence changed:
--
--   was: Your enrollment paperwork is not finished yet, and the place is not
--        final until it is: {{enrollment_link}}
--
--   now: Your enrollment paperwork is not finished yet, and we need you to
--        click the following link to finalize please - {{enrollment_link}}
--
-- Everything else in the email is unchanged. Applies to all four schools --
-- the body is identical across them, only school_id differs.
--
-- The templates are still DISABLED. This only changes what they will say when
-- they are turned on.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

update public.admissions_communication_templates
   set body = E'Hi {{guardian_first_name}},\n\nCongratulations again on {{student_first_name}}''s place at {{school_name}}.\n\nYour enrollment paperwork is not finished yet, and we need you to click the following link to finalize please - {{enrollment_link}}\n\nIf anything is unclear, reply to this email and we will walk you through it.\n\n{{school_name}}',
       updated_at = now()
 where template_key = 'parent_reminder_enrollment_not_completed';

-- ---------------------------------------------------------------------------
-- Report. Re-runs the same placeholder audit as 296 against the new text, so a
-- typo in a token name cannot slip through on a copy edit -- which is exactly
-- how the original nine got in.
-- ---------------------------------------------------------------------------

drop table if exists _report;
create temp table _report (seq integer, item text, value text);

do $$
declare
  v_rows      integer;
  v_newcopy   integer;
  v_oldcopy   integer;
  v_badtokens integer;
  v_disabled  integer;
begin
  select count(*),
         count(*) filter (where position('click the following link to finalize' in body) > 0),
         count(*) filter (where position('the place is not final until it is' in body) > 0),
         count(*) filter (where not is_active)
    into v_rows, v_newcopy, v_oldcopy, v_disabled
    from public.admissions_communication_templates
   where template_key = 'parent_reminder_enrollment_not_completed';

  -- Every {{token}} in the new body checked against the real field list.
  select count(*)
    into v_badtokens
    from (
      select (regexp_matches(body, '\{\{(\w+)\}\}', 'g'))[1] as token
        from public.admissions_communication_templates
       where template_key = 'parent_reminder_enrollment_not_completed'
    ) t
   where t.token not in (
     'student_name','parent_name','parent_email','parent_phone',
     'guardian_first_name','student_first_name','guardian_name',
     'guardian_email','guardian_phone','school_name','program_name',
     'campus_name','campus_address','parking_info','funding_program',
     'funding_source','portal_link','application_link','upload_link',
     'enrollment_link','scheduling_link','shadow_days_link','decisions_link',
     'admissions_contact_name','admissions_contact_email','lead_link',
     'tour_datetime','interview_datetime','missing_items','missing_documents',
     'uploaded_documents','award_amount','award_id','state_student_id',
     'rejection_reason','next_steps','requested_items','deadline',
     'decision_timeframe','tuition_info','orientation_info','technology_info',
     'waitlist_timeline','student_schedule','teacher_assignment',
     'first_day_info','handbook_link'
   );

  insert into _report values
    (1, 'Templates updated (expect 4 - one per school)', v_rows::text),
    (2, 'Carrying the NEW wording (expect 4)',           v_newcopy::text),
    (3, 'Still carrying the OLD wording (expect 0)',     v_oldcopy::text),
    (4, 'Unknown placeholders in the new body (expect 0)', v_badtokens::text),
    (5, 'Still disabled (expect 4)',                     v_disabled::text),
    (9, 'Next', 'Re-enable when ready - see the note at the bottom of this file.');
end $$;

commit;

select item, value from _report order by seq;

select s.name as school, t.body
  from public.admissions_communication_templates t
  join public.schools s on s.id = t.school_id
 where t.template_key = 'parent_reminder_enrollment_not_completed'
 order by s.name;

-- ---------------------------------------------------------------------------
-- TO GO LIVE, once the three waiting families have been eyeballed:
--
--   update public.admissions_communication_templates
--      set is_active = true
--    where template_key like 'parent_reminder_%'
--       or template_key = 'staff_parent_unresponsive';
--
-- Twenty rows. The reminder rows keep the clocks they started on Sunday, so
-- nothing was lost by the pause.
-- ---------------------------------------------------------------------------
