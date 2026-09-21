-- ===========================================================================
-- WHY IS DIGITLAB EMPTY  -  2026-09-21
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. Jessica Vedder's timesheet shows DigitLab / VEDDER-1300 at 1:00 PM with
-- "no students" on Monday, Tuesday, Wednesday AND Thursday. Her other two
-- sections on the same screen count correctly - Earthology 4 on roster at
-- $35.00, Tutoring 1 on roster at $20.00 - so the mechanism works.
--
-- The empty-classes query on 21 September said VEDDER-1300 has FOUR enrolled,
-- all four campus children. The campus rule in class-pay.ts
-- (CAMPUS_FRIDAY_CUTOFF_ET) only empties a roster on FRIDAY at or after 1pm.
-- Monday to Thursday those four should count: $20 + 3x$5 = $35 a day.
--
-- If they should be counting and are not, that is $35 x 4 days = $140 a week
-- Jessica is not being paid, on the first week real money moves.
--
-- onRosterOn() refuses a child for exactly five reasons. This shows the value
-- behind each one so the answer is read, not guessed:
--   enrollment_status not in ('enrolled','completed')
--   enrolled_at AFTER the class date
--   dropped_at BEFORE the class date
--   attends_days does not include that weekday
--   campus child, Friday, class at or after 13:00
--
-- WHAT EMPTY MEANS, before it runs.
--   1 empty -> the section code is not VEDDER-1300 and I have the wrong
--              section. Read section 3 to find the right one.
--   2 empty -> DigitLab has no rate in force, which would show as "no agreed
--              rate" on the timesheet rather than "no students" - so this
--              being empty would mean the screen is lying in a new way.
--   3 is the comparison: the same columns for the two sections that DO count.
--      Whatever differs between 1 and 3 is the answer.
-- ===========================================================================

-- 1. Every enrolment on the section that shows empty.
select
  '1. VEDDER-1300 enrolments'                              as check,
  coalesce(st.first_name || ' ' || st.last_name, '(no name)') as child,
  'status=' || coalesce(se.enrollment_status, 'NULL')
    || '  enrolled=' || coalesce(se.enrolled_at::text, 'NULL')
    || '  dropped=' || coalesce(se.dropped_at::text, 'NULL')
    || '  days=' || coalesce(se.attends_days, 'NULL')
    || '  campus=' || coalesce(se.campus_student::text, 'NULL')   as detail
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
left join public.students st on st.id = se.student_id
where cs.section_code = 'VEDDER-1300'

union all

-- 2. The section itself, and whether DigitLab has a rate in force.
select
  '2. the section',
  cs.section_code,
  'starts=' || coalesce(cs.start_time_et::text, 'NULL')
    || '  course=' || coalesce(c.name, 'NULL')
    || '  rate in force=' || coalesce((
         select r.base_first_student::text
         from public.class_pay_rates r
         where r.course_id = c.id
           and r.employee_id is null
           and r.effective_from <= date '2026-09-21'
         order by r.effective_from desc
         limit 1
       ), 'NONE')
from public.course_sections cs
left join public.courses c on c.id = cs.course_id
where cs.section_code = 'VEDDER-1300'

union all

-- 3. The same columns for the two sections that DO count, so the difference
--    is visible side by side rather than inferred.
select
  '3. ' || cs.section_code || ' (counts fine)',
  coalesce(st.first_name || ' ' || st.last_name, '(no name)'),
  'status=' || coalesce(se.enrollment_status, 'NULL')
    || '  enrolled=' || coalesce(se.enrolled_at::text, 'NULL')
    || '  dropped=' || coalesce(se.dropped_at::text, 'NULL')
    || '  days=' || coalesce(se.attends_days, 'NULL')
    || '  campus=' || coalesce(se.campus_student::text, 'NULL')
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
left join public.students st on st.id = se.student_id
where cs.section_code in ('VEDDER-1400', 'VEDDER-1700')

order by 1, 2;
