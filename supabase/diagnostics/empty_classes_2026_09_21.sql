-- ===========================================================================
-- EMPTY CLASSES  -  2026-09-21
--
-- READ ONLY. Four selects. Nothing is written, nothing is cancelled.
--
-- WHY. Jessica Vedder's timesheet shows a 1pm class with nobody on the roster.
-- Three completely different things look identical on that screen, and only
-- ONE of them should be cleaned up.
--
--   A. PHANTOM. A section nobody ever enrolled in. Created, never filled,
--      never cancelled. It will never pay, and every teacher has to look at it
--      and decide about it every week for the rest of the year. Clean these.
--
--   B. FRIDAY AFTERNOON. class-pay.ts CAMPUS_FRIDAY_CUTOFF_ET is 13:00:
--      campus children are in morning classes and gone by the afternoon, so a
--      Friday class at or after 1pm has a smaller roster - sometimes empty.
--      This is CORRECT and is Jimmy's own rule. DO NOT TOUCH THESE. Cancelling
--      one would delete a real class real children attend in the morning.
--
--   C. EMPTIED OUT. A section that had students who have since dropped. Real
--      history, now unattended. A judgement call, not an automatic cleanup.
--
-- Counting rule matches the pay screen exactly: enrollment_status in
-- ('enrolled','completed'). Anything else is not on the roster.
--
-- FORWARD ONLY. Nothing before Monday 21 September is examined. The 1,025
-- classes already taught are history and are not ours to tidy.
--
-- WHAT EMPTY MEANS, before it runs.
--   A empty -> there are no phantom sections. Jessica's 1pm is B or C, and
--              there is nothing to clean.
--   B empty -> no Friday afternoon sections exist, which would contradict the
--              "thirteen sections that start at or after one o'clock" noted in
--              class-pay.ts. Treat that as a broken query.
--   C empty -> nobody has dropped out of a section entirely.
--   D is the scale. Read it before deciding anything.
-- ===========================================================================

with future_sessions as (
  select
    i.id,
    i.course_section_id,
    (i.scheduled_start at time zone 'America/New_York')::date as class_date
  from public.instructional_sessions i
  where (i.scheduled_start at time zone 'America/New_York')::date >= date '2026-09-21'
    and coalesce(i.session_status, 'scheduled') <> 'cancelled'
),
counted as (
  select
    se.course_section_id,
    count(*)                                          as total,
    count(*) filter (where se.campus_student)         as campus,
    count(*) filter (where se.dropped_at is null)     as still_in
  from public.student_enrollments se
  where se.enrollment_status in ('enrolled', 'completed')
  group by se.course_section_id
)

-- A. PHANTOM SECTIONS. Nobody ever enrolled. These are the cleanup.
select
  'A. PHANTOM - clean these'                                   as bucket,
  coalesce(c.name, '(no course)') || '  /  ' || cs.section_code as class,
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, '(no teacher)'
  )                                                             as teacher,
  count(f.id)::text || ' future classes, starts ' || coalesce(cs.start_time_et::text, '?') as detail
from public.course_sections cs
join public.courses c on c.id = cs.course_id
left join public.employee_profiles p on p.employee_id = cs.instructor_employee_id
join future_sessions f on f.course_section_id = cs.id
where not exists (select 1 from counted k where k.course_section_id = cs.id)
group by c.name, cs.section_code, cs.start_time_et,
         p.first_name, p.last_name, p.display_name

union all

-- B. FRIDAY AFTERNOON. Correct behaviour. Listed so it is not mistaken for A.
select
  'B. Friday 1pm+ campus rule - DO NOT TOUCH',
  coalesce(c.name, '(no course)') || '  /  ' || cs.section_code,
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, '(no teacher)'
  ),
  k.total::text || ' enrolled, ' || k.campus::text || ' are campus children, starts '
    || coalesce(cs.start_time_et::text, '?')
from public.course_sections cs
join public.courses c on c.id = cs.course_id
join counted k on k.course_section_id = cs.id
left join public.employee_profiles p on p.employee_id = cs.instructor_employee_id
where cs.start_time_et is not null
  and cs.start_time_et >= time '13:00'
  and k.campus = k.total
  and k.total > 0

union all

-- C. EMPTIED OUT. Had students, all dropped. Your judgement, not a rule.
select
  'C. everyone dropped - your call',
  coalesce(c.name, '(no course)') || '  /  ' || cs.section_code,
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, '(no teacher)'
  ),
  k.total::text || ' ever enrolled, ' || k.still_in::text || ' still in, '
    || count(f.id)::text || ' future classes'
from public.course_sections cs
join public.courses c on c.id = cs.course_id
join counted k on k.course_section_id = cs.id
left join public.employee_profiles p on p.employee_id = cs.instructor_employee_id
join future_sessions f on f.course_section_id = cs.id
where k.still_in = 0
group by c.name, cs.section_code, k.total, k.still_in,
         p.first_name, p.last_name, p.display_name

union all

-- D. THE SCALE. How much of the forward schedule this is.
select
  'D. scale',
  'future classes from 21 Sep',
  '',
  count(*)::text
from future_sessions

union all

select
  'D. scale',
  'of those, on sections nobody ever enrolled in',
  '',
  count(*)::text
from future_sessions f
join public.course_sections cs on cs.id = f.course_section_id
where not exists (select 1 from counted k where k.course_section_id = cs.id)

order by 1, 2;
