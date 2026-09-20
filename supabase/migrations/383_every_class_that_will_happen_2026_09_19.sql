-- The Fall term becomes 3,157 instructional sessions.
--
-- A section is a class that EXISTS. A session is a class that HAPPENS, on a
-- date. Pay is computed per session, so every row this creates is a payment.
--
-- TERM: Monday 10 August 2026 to Thursday 17 December 2026, confirmed by Jimmy
-- on 19 September 2026, read from The Academy HS and Virtual 2026-2027 school
-- calendars (revised 2.15.2026).
--
-- 77 instructional days. NOT 90 weekdays - thirteen are excluded:
--
--   Aug 3-7        week before term
--   Sept 7-11      whole week
--   Oct 12-16      whole week
--   Nov 23-27      Thanksgiving week
--   Dec 4, 11, 18  Conference Days - EVERY FRIDAY IN DECEMBER
--   Dec 21-31      winter break
--
-- The December Fridays matter twice over: no class runs, and the pay schedule's
-- Parent/Student Conference line at 15.00 per student is "December and May
-- only" - it pays for those very days.
--
-- WHY A DATE SERIES AND NOT 3,157 WRITTEN-OUT ROWS. A generated series can be
-- read and checked: the term bounds and the excluded days are visible in one
-- screen, and a wrong date is a wrong line rather than a needle in a list
-- nobody will audit. It also regenerates identically, which matters because
-- this will be re-run when the schedule changes.
--
-- THE UNIQUE INDEX IS NOT OPTIONAL. instructional_sessions has never had one.
-- Without it a second run inserts 3,157 duplicate classes and every teacher is
-- paid twice - silently, because nothing would error. Same protection migration
-- 376 gave contractor_pay_ledger, for the same reason.
--
-- TIMES ARE EASTERN. course_sections.start_time_et is a bare time; scheduled_start
-- is timestamptz. Converting through America/New_York rather than assuming UTC
-- keeps a 9:00 class at 9:00 across the November clock change - 2 November is a
-- school day, and without the zone every class after it would sit an hour out.

begin;

-- =========================================================================
-- 1. A CLASS CANNOT HAPPEN TWICE AT THE SAME MOMENT
-- =========================================================================

create unique index if not exists idx_instructional_sessions_one_per_slot
  on public.instructional_sessions (course_section_id, scheduled_start);

-- =========================================================================
-- 2. THE DAYS
-- =========================================================================

create temporary table fall_days on commit drop as
select d::date as class_date
from generate_series(date '2026-08-10', date '2026-12-17', interval '1 day') as d
where extract(isodow from d) <= 5
  and d::date not in (
    date '2026-08-03', date '2026-08-04', date '2026-08-05', date '2026-08-06', date '2026-08-07',
    date '2026-09-07', date '2026-09-08', date '2026-09-09', date '2026-09-10', date '2026-09-11',
    date '2026-10-12', date '2026-10-13', date '2026-10-14', date '2026-10-15', date '2026-10-16',
    date '2026-11-23', date '2026-11-24', date '2026-11-25', date '2026-11-26', date '2026-11-27',
    date '2026-12-04', date '2026-12-11', date '2026-12-18',
    date '2026-12-21', date '2026-12-22', date '2026-12-23', date '2026-12-24', date '2026-12-25',
    date '2026-12-28', date '2026-12-29', date '2026-12-30', date '2026-12-31'
  );

-- =========================================================================
-- 3. THE SESSIONS
-- =========================================================================

insert into public.instructional_sessions
  (course_section_id, instructor_employee_id, scheduled_start, scheduled_end,
   session_status, session_type, student_count)
select sec.id,
       sec.instructor_employee_id,
       (fd.class_date + sec.start_time_et) at time zone 'America/New_York',
       (fd.class_date + sec.end_time_et)   at time zone 'America/New_York',
       'scheduled',
       case when c.code = 'TUTORING' then 'tutoring' else 'instruction' end,
       0
from public.course_sections sec
join public.courses c on c.id = sec.course_id
cross join fall_days fd
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
  and sec.instructor_employee_id is not null
on conflict (course_section_id, scheduled_start) do nothing;

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- EXPECT 41 sections x 77 days = 3,157 sessions.
--
-- A section showing fewer than 77 means some of its days collided with rows
-- that already existed. A section missing entirely means it has no instructor.
-- The Fridays column is the one to sanity-check: 13 of the 77 days are Fridays,
-- and on those days every campus-tagged child is absent - so a class with
-- campus students is smaller, and pays less, thirteen times this term.

select c.name as course,
       sec.meeting_pattern->>'printed_as' as printed_on_the_grid,
       p.display_name as teacher,
       to_char(sec.start_time_et, 'HH24:MI') as starts,
       count(s.id) as sessions,
       count(s.id) filter (
         where extract(isodow from s.scheduled_start at time zone 'America/New_York') = 5
       ) as fridays,
       min(s.scheduled_start at time zone 'America/New_York')::date as first_class,
       max(s.scheduled_start at time zone 'America/New_York')::date as last_class
from public.course_sections sec
join public.courses c on c.id = sec.course_id
join public.employees e on e.id = sec.instructor_employee_id
join public.employee_profiles p on p.employee_id = e.id
left join public.instructional_sessions s on s.course_section_id = sec.id
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
group by c.name, sec.meeting_pattern->>'printed_as', p.display_name, sec.start_time_et
order by sec.start_time_et, c.name;
