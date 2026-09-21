-- ===========================================================================
-- IS THE ROSTER TRUNCATED  -  2026-09-21
--
-- READ ONLY. Three selects. Nothing is written.
--
-- WHY. Jessica Vedder's timesheet shows DigitLab / VEDDER-1300 with "no
-- students" Monday to Thursday, while its four children are enrolled, not
-- dropped, and marked M-F. Earthology / VEDDER-1400 shows "4 on roster" while
-- SIX children are enrolled on exactly the same terms.
--
-- onRosterOn() cannot produce either number. On a Monday it refuses a child
-- only for status, dates, weekday pattern, or the campus rule - and the campus
-- rule fires on FRIDAY alone. Every visible field is identical between the
-- section that counts and the one that does not.
--
-- So this is not a rule firing. It is rows going missing.
--
-- class-pay.ts reads every roster in one query:
--     .from("student_enrollments").select(...).in("course_section_id", ids)
-- with NO .limit() and NO .range(). PostgREST caps an uncapped select at its
-- max-rows setting - 1,000 by default in Supabase - and returns the first
-- thousand with NO error and no indication that anything was left behind.
--
-- If student_enrollments has more than a thousand rows, the pay calculator has
-- been counting a partial roster since the day it was written, and every
-- teacher's pay is wrong by an amount nobody can see.
--
-- WHAT THE ANSWER MEANS, before it runs.
--   Section 1 over 1000 -> that is the bug. The fix is pagination or a
--                          per-section aggregate, not a bigger limit.
--   Section 1 under 1000 -> the cap is not being hit and I am wrong again;
--                          the cause is elsewhere and section 3 is the next
--                          place to look.
--   Section 2 shows how many rows belong to the sections actually in play for
--           one week, which is what the .in() clause asks for.
--   Section 3 counts, per Vedder section, the children onRosterOn SHOULD
--           accept on Monday 21 September - status enrolled or completed,
--           started, not dropped. Compare to the screen: DigitLab 0,
--           Earthology 4, Tutoring 1.
-- ===========================================================================

-- 1. How many enrolment rows exist at all. The number that matters.
select
  '1. student_enrollments rows'        as check,
  count(*)::text                        as howmany,
  case when count(*) > 1000
       then 'OVER THE DEFAULT CAP - this is the bug'
       else 'under 1000 - cap not reached' end as verdict
from public.student_enrollments

union all

-- 2. Rows belonging to sections that have a session this week - what the
--    .in("course_section_id", sectionIds) clause actually asks for.
select
  '2. rows for sections in play this week',
  count(*)::text,
  ''
from public.student_enrollments se
where se.course_section_id in (
  select distinct i.course_section_id
  from public.instructional_sessions i
  where (i.scheduled_start at time zone 'America/New_York')::date
        between date '2026-09-21' and date '2026-09-25'
)

union all

-- 3. What onRosterOn SHOULD count on Monday 21 September for Jessica's three
--    sections. Monday is weekday 1, so the campus rule does not apply.
select
  '3. should count Monday - ' || cs.section_code,
  count(*)::text,
  'screen shows: '
    || case cs.section_code
         when 'VEDDER-1300' then '0'
         when 'VEDDER-1400' then '4'
         when 'VEDDER-1700' then '1'
         else '?' end
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
where cs.section_code in ('VEDDER-1300', 'VEDDER-1400', 'VEDDER-1700')
  and se.enrollment_status in ('enrolled', 'completed')
  and (se.enrolled_at is null or se.enrolled_at::date <= date '2026-09-21')
  and (se.dropped_at is null or se.dropped_at::date >= date '2026-09-21')
group by cs.section_code

order by 1, 2;
