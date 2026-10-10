-- 531_scheduled_not_booked_2026_10_09.sql
--
-- Jimmy, 9 October: "anywhere booked exists, replace with scheduled"
--
-- Six templates across eleven rows. The word "booked" never came from him -
-- it arrived with the seeded templates, the same way "interview" did, and it
-- has been sitting in subject lines a school leader reads every time a
-- family picks a time.
--
-- THE TEMPLATE KEYS DO NOT CHANGE. staff_shadow_day_booked stays
-- staff_shadow_day_booked. A key is an address, not a word anybody reads,
-- and renaming it breaks every trigger, queue row and code path that names
-- it - the same reason interview_scheduled still sits behind the label
-- "Interest Meeting Scheduled". Only the words change.
--
-- "handbook" IS NOT "booked". enrollment_completed_email contains
-- {{handbook_link}} and the line "Parent handbook:", and a careless
-- find-and-replace turns it into "Parent handschedule". That letter is not
-- touched here, and the one replacement that could reach it is written to
-- match whole words only.

begin;

-- ============================================================================
-- LIVE LETTERS
-- ============================================================================

/* shadow_day_booked_email - to the family, when a shadow day is picked. */
update public.admissions_communication_templates
   set body = replace(body,
         's shadow day at {{school_name}} is booked for',
         's shadow day at {{school_name}} is scheduled for'),
       updated_at = now()
 where template_key = 'shadow_day_booked_email';

/* staff_interest_meeting_booked - to the school leader. */
update public.admissions_communication_templates
   set subject = 'Interest meeting scheduled: {{student_name}} — {{school_name}}',
       body    = replace(body,
                   's interest meeting is booked.',
                   's interest meeting is scheduled.'),
       updated_at = now()
 where template_key = 'staff_interest_meeting_booked';

/* staff_shadow_day_booked - to the school leader. */
update public.admissions_communication_templates
   set subject = 'Shadow day scheduled: {{student_name}} — {{school_name}}',
       body    = replace(body,
                   's shadow day is booked.',
                   's shadow day is scheduled.'),
       updated_at = now()
 where template_key = 'staff_shadow_day_booked';

/* staff_interest_meeting_no_response - the 7am call-them letter, 4 campus
   rows live plus a network row. Three separate words in one letter. */
update public.admissions_communication_templates
   set subject = 'Three attempts, nothing scheduled — time to call {{student_first_name}}''s family',
       body    = replace(
                   replace(body,
                     'This family has been sent the booking link three times and has not booked.',
                     'This family has been sent the scheduling link three times and has not scheduled.'),
                   'no booking', 'nothing scheduled'),
       updated_at = now()
 where template_key = 'staff_interest_meeting_no_response';

-- ============================================================================
-- SWITCHED OFF, BUT CORRECTED NOW RATHER THAN THE DAY THEY GO LIVE
-- ============================================================================
--
-- These two are off. Fixing them here is the cheap moment: the alternative
-- is somebody switching them on in a month and the old word going out in
-- the first letter, which is exactly how "interview" kept reappearing.

/* parent_reminder_shadow_days_not_scheduled - 4 campus rows. */
update public.admissions_communication_templates
   set subject = 'Scheduling {{student_first_name}}''s shadow days at {{school_name}}',
       body    = replace(body, 'You can book here:', 'You can schedule here:'),
       updated_at = now()
 where template_key = 'parent_reminder_shadow_days_not_scheduled';

/* parent_reminder_interest_meeting_not_booked_2 - the network row only; the
   four live campus rows do not contain the word. */
update public.admissions_communication_templates
   set body = replace(body,
         'if you would rather talk than book online',
         'if you would rather talk than schedule online'),
       updated_at = now()
 where template_key = 'parent_reminder_interest_meeting_not_booked_2';

commit;

-- ============================================================================
-- CHECK IT LANDED
-- ============================================================================
--
--   select coalesce(s.name,'(network)') as campus, t.template_key, t.subject
--     from public.admissions_communication_templates t
--     left join public.schools s on s.id = t.school_id
--    where t.subject ~* 'book' or t.body ~* '\mbook'
--    order by t.template_key;
--
-- The only row that should come back is enrollment_completed_email, on
-- "Parent handbook:" and {{handbook_link}}. Anything else is a miss.
