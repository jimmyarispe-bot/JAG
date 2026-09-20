-- Campus children leave at one o'clock on Fridays.
--
-- Jimmy, 20 September 2026: "scratch fridays rule. campus kids do have class on
-- fridays. but not after 1pm."
--
-- This REPLACES what this file said yesterday. The earlier version deleted every
-- Friday session for five sections on the understanding that campus children
-- were absent all day. They are not - they are in the morning classes and gone
-- by the afternoon. That version was never run; had it been, it would have
-- destroyed 65 classes that do happen.
--
-- WHY THE MODEL HAD TO CHANGE SHAPE, NOT JUST ITS VALUES.
--
-- attends_days can say WHICH DAYS a child comes. It cannot say "every day, but
-- only the morning on Fridays" - that is a rule about the CLASS's start time,
-- and a day never had one. So the child carries a flag, the class carries its
-- hour, and the rule lives where the two meet: onRosterOn now takes the class
-- start time, which it never needed before.
--
-- attends_days survives for what it was always right for: Isla Fitzgerald's
-- 12:00 Structured Literacy is M/T/Th, a genuine three-day pattern that has
-- nothing to do with campuses.
--
-- 13 of the 41 sections start at or after 13:00 - nine at 13:00, three at 14:00
-- and one at 17:00. Across thirteen Fridays that is 169 classes where a campus
-- child must not be counted.
--
-- THE BOUNDARY IS DELIBERATE AND WORTH CHECKING. A class starting AT 13:00 is
-- treated as after the cutoff, because "no class after 1pm" reads as the school
-- day ending at one. If a one-o'clock class should still count them, change
-- CAMPUS_FRIDAY_CUTOFF_ET in src/lib/finance/class-pay.ts - it is one constant,
-- and it is the only place the hour appears.

begin;

alter table public.student_enrollments
  add column if not exists campus_student boolean not null default false;

comment on column public.student_enrollments.campus_student is
  'Tagged (FL) or (GA) on the schedule: attends a physical campus. Such a child '
  'is in every class Monday to Thursday and in Friday MORNING classes, but not '
  'in a Friday class starting at or after 13:00 ET.';

-- Yesterday's import wrote 'M-Th' for exactly these children. That was the
-- wrong shape for the right set of people, so the set is kept and the shape
-- corrected: they attend all five days, with an afternoon rule.
update public.student_enrollments
   set campus_student = true,
       attends_days   = 'M-F',
       updated_at     = now()
 where upper(replace(attends_days, ' ', '')) = 'M-TH';

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Expect 43 campus enrolments and NO remaining 'M-Th' rows - that pattern
-- should no longer exist anywhere.
--
-- The afternoon sections are the ones to read. A 13:00 or later class whose
-- roster is entirely campus children has nobody on a Friday and is worth
-- nothing that day; a mixed one simply pays less. Both are correct, and both
-- are invisible until somebody looks.

select to_char(sec.start_time_et,'HH24:MI') as starts,
       c.name as course,
       p.display_name as teacher,
       count(*) as on_roll,
       count(*) filter (where e.campus_student) as campus_children,
       count(*) filter (
         where not e.campus_student
           and upper(replace(e.attends_days,' ','')) = 'M-F'
       ) as in_class_friday_afternoon,
       case when sec.start_time_et < time '13:00' then 'morning - everyone'
            when count(*) filter (where not e.campus_student) = 0
                 then 'FRIDAY: nobody - class is worth nothing'
            else 'FRIDAY: smaller roster' end as friday
from public.student_enrollments e
join public.course_sections sec on sec.id = e.course_section_id
join public.courses c on c.id = sec.course_id
join public.employees emp on emp.id = sec.instructor_employee_id
join public.employee_profiles p on p.employee_id = emp.id
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
group by sec.start_time_et, c.name, p.display_name, sec.id
order by (sec.start_time_et >= time '13:00') desc, sec.start_time_et, c.name;
