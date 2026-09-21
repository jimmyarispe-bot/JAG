-- ===========================================================================
-- ONE VALUE PER COLUMN  -  2026-09-21
--
-- READ ONLY. One select. Nothing is written.
--
-- WHY THIS EXISTS AT ALL. The previous version of this question concatenated
-- every field into one "detail" string, and the results grid cut it off
-- exactly where campus= began. The one field that could discriminate was the
-- one field I could not read, and I spent two wrong theories on it. Separate
-- columns cannot be truncated into a wrong answer.
--
-- THE GAP. On Monday 21 September:
--     VEDDER-1300 DigitLab      should count 4, screen shows 0
--     VEDDER-1400 Earthology    should count 6, screen shows 4
--     VEDDER-1700 Tutoring      should count 1, screen shows 1  (agrees)
--
-- onRosterOn() refuses a child on a Monday for four reasons only:
--   status not in (enrolled, completed)   - already ruled out, all enrolled
--   enrolled_at after the day             - already ruled out, all 10 August
--   dropped_at before the day             - already ruled out, all NULL
--   attends_days does not include Monday  - NOT YET READ
-- The campus rule fires on FRIDAY alone, so it cannot be the cause on a
-- Monday - unless campus children also carry an attends_days that excludes it.
--
-- DAY_NUMBER is { M:1, T:2, W:3, TH:4, F:5 } and an unrecognised pattern falls
-- back to the whole week. So a pattern only removes Monday if it PARSES and
-- genuinely starts after Monday - something like "T-F", "T/W/TH" or "F".
--
-- WHAT TO LOOK FOR. Sort by section. If the four DigitLab children carry a
-- pattern that excludes Monday and the two extra Earthology children carry the
-- same, the screen is right and the money is right. If they all say M-F, the
-- screen is wrong and a teacher is being underpaid.
-- ===========================================================================

select
  cs.section_code                                            as section,
  coalesce(st.first_name || ' ' || st.last_name, '(no name)') as child,
  se.enrollment_status                                       as status,
  se.attends_days                                            as attends_days,
  se.campus_student                                          as campus,
  se.enrolled_at::date                                       as enrolled,
  se.dropped_at::date                                        as dropped,
  coalesce(st.enrollment_status, '(none)')                   as student_status
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
left join public.students st on st.id = se.student_id
where cs.section_code in ('VEDDER-1300', 'VEDDER-1400', 'VEDDER-1700')
order by cs.section_code, child;
