-- ===========================================================================
-- TWO SECTIONS, ONE CODE  -  2026-09-21
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. Every enrolment on Jessica Vedder's three sections is enrolled, M-F,
-- not dropped, student active. onRosterOn() accepts all eleven on a Monday.
-- The screen shows 0, 4 and 1.
--
--     VEDDER-1300  4 children, all campus=true   screen shows 0
--     VEDDER-1400  6 children, all campus=false  screen shows 4
--     VEDDER-1700  1 child                       screen shows 1  (agrees)
--
-- No rule in that function can produce those numbers from this data. Something
-- structural can: MORE THAN ONE SECTION ROW SHARING A SECTION CODE. Every
-- query so far joined on section_code, so it would have gathered children from
-- both rows, while a session only ever sees the one row it points at.
--
-- That would explain all three numbers at once - 4 children split across two
-- VEDDER-1300 rows with the session on the empty one, 6 split 4-and-2 with the
-- session on the four.
--
-- It would also mean the pay screen is not wrong about its own section. It is
-- right about a section that is missing children, which is worse, because
-- nothing on screen says so.
--
-- WHAT EMPTY MEANS, before it runs.
--   1 empty -> no code is duplicated and this theory is dead too. Section 3
--              then matters most: it shows which section id each session
--              actually points at, and whether that id has any enrolments.
--   2 empty -> no Vedder section has a session this week, which would
--              contradict the screen showing three classes a day.
--   3 is the ground truth: section id, its code, how many children are on THAT
--     id, and how many sessions this week hang off it. Compare the enrolment
--     count on the id that owns the sessions with what the screen showed.
-- ===========================================================================

-- 1. Any section code used by more than one section row, anywhere.
select
  '1. DUPLICATED CODE'                                  as check,
  cs.section_code                                       as detail,
  count(*)::text || ' section rows share this code'     as extra
from public.course_sections cs
group by cs.section_code
having count(*) > 1

union all

-- 2. Every section whose code starts VEDDER, with its own id.
select
  '2. Vedder section',
  cs.section_code || '  ' || left(cs.id::text, 8),
  coalesce(c.name, '(no course)')
    || '  starts=' || coalesce(cs.start_time_et::text, 'NULL')
from public.course_sections cs
left join public.courses c on c.id = cs.course_id
where cs.section_code like 'VEDDER%'

union all

-- 3. THE GROUND TRUTH. For each Vedder section id: children on THAT id, and
--    sessions this week on THAT id. The row with sessions is the one the
--    screen is reading.
select
  '3. ' || cs.section_code || '  ' || left(cs.id::text, 8),
  (select count(*) from public.student_enrollments se
    where se.course_section_id = cs.id
      and se.enrollment_status in ('enrolled', 'completed'))::text || ' children',
  (select count(*) from public.instructional_sessions i
    where i.course_section_id = cs.id
      and (i.scheduled_start at time zone 'America/New_York')::date
          between date '2026-09-21' and date '2026-09-25')::text || ' sessions this week'
from public.course_sections cs
where cs.section_code like 'VEDDER%'

order by 1, 2;
