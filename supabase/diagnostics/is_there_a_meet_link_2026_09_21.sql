-- ===========================================================================
-- IS THERE A MEET LINK  -  2026-09-21
--
-- READ ONLY. Five selects. Nothing is written.
--
-- WHY. Attendance for virtual students is the student's actual login to the
-- class - decided 20 September, no IP, the real join, teacher verifies. That
-- design rests entirely on being able to say WHICH class a join belongs to,
-- which means every session needs a known Meet link or conference code.
--
-- The columns exist: course_sections.meet_link and
-- instructional_sessions.meet_link, both added by migration 082. A column
-- existing has meant nothing this week - class_pay_rates was unreadable,
-- attendance has been empty since 082 shipped, and several screens were built,
-- correct and unreachable. So this asks whether anything is in them.
--
-- FIXED 21 September: the sample section had LIMIT inside a UNION branch,
-- which Postgres rejects (42601, "syntax error at or near union"). It is a CTE
-- now, which is the correct way to bound one arm of a union.
--
-- WHAT EMPTY MEANS, before it runs.
--   1 shows only 'NO link' -> no session has a Meet link. Attendance by login
--                  cannot start: there is nothing to attribute a join to. The
--                  first job becomes getting links onto sessions.
--   2 shows only 'NO link' -> same for sections, so links are not inherited.
--   3 empty     -> no sample to learn the format from. If sections have links
--                  and sessions do not, sessions can inherit from sections.
--   4 zero      -> attendance is still zero rows, as measured on 20 September
--                  against 1,025 classes already taught. Expected, and it is
--                  the hole this design exists to fill.
--   5 shows only 'NO school email' -> a Google join could not be matched to a
--                  child even with links in place.
-- ===========================================================================

with sample_links as (
  select
    coalesce(c.name, '(no course)') || ' / ' || cs.section_code as label,
    left(cs.meet_link, 60)                                     as link
  from public.course_sections cs
  left join public.courses c on c.id = cs.course_id
  where cs.meet_link is not null
    and trim(cs.meet_link) <> ''
  limit 5
)

-- 1. Future sessions, with and without a link.
select
  '1. sessions from 21 Sep'                         as section,
  case when i.meet_link is null or trim(i.meet_link) = ''
       then 'NO link' else 'has link' end           as detail,
  count(*)::text                                    as howmany
from public.instructional_sessions i
where (i.scheduled_start at time zone 'America/New_York')::date >= date '2026-09-21'
group by 2

union all

-- 2. Sections, with and without a link. A session can inherit from its section.
select
  '2. course sections',
  case when cs.meet_link is null or trim(cs.meet_link) = ''
       then 'NO link' else 'has link' end,
  count(*)::text
from public.course_sections cs
group by 2

union all

-- 3. A sample of whatever links exist, so the format is known rather than
--    guessed - a full https URL, a bare meet code, or something else.
select '3. sample link', label, link
from sample_links

union all

-- 4. Attendance recorded so far. Measured at zero on 20 September.
select
  '4. attendance rows',
  'session_attendance_records',
  count(*)::text
from public.session_attendance_records

union all

-- 5. Students with a school email. Without one, a Google join cannot be
--    matched to a child even when the link is known.
select
  '5. student school email',
  case when s.school_email is null or trim(s.school_email) = ''
       then 'NO school email' else 'has school email' end,
  count(*)::text
from public.students s
where coalesce(s.enrollment_status, 'active') not in ('archived', 'withdrawn')
group by 2

order by 1, 2;
