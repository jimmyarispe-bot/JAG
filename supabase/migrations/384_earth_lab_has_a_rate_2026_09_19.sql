-- Earth Lab gets a rate.
--
-- Jimmy, 19 September 2026: "earth lab is $20 plus $5" - the standard shape,
-- 20.00 for the first enrolled student and 5.00 for every student beyond.
--
-- WHY THIS MATTERS MORE THAN IT LOOKS. Marnie Witters teaches three sections on
-- the Fall schedule and ALL THREE are Earth Lab. Until this runs she earns
-- nothing for the entire term - correctly and loudly, because migration 376's
-- design names an unpriced class as skipped rather than paying it zero, but
-- unpaid all the same.
--
-- THE GUEST RATE IS INFERRED, NOT GIVEN. Every 20.00 course on the pay schedule
-- of 18 September sets its guest base 5.00 lower, so this uses 15.00. That is a
-- pattern, not an instruction from Jimmy - if a guest covering Earth Lab should
-- earn something else, this is the line to change, and it is worth changing
-- before anybody covers a class rather than after.
--
-- STILL UNRATED AFTER THIS: Life Lab (Craig Mann, 3 sections) and Real World
-- Math (Peter Alouise 2, Raven Rogers 1). Six sections that will still be named
-- as skipped in a pay run.

begin;

insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select c.id, null, 20.00, 5.00, 15.00, date '2026-09-01'
from public.courses c
join public.schools s on s.id = c.school_id
where c.code = 'EARTHLAB'
  and lower(trim(s.name)) = 'the academy virtual'
on conflict (course_id, effective_from) where employee_id is null do update
  set base_first_student       = excluded.base_first_student,
      per_additional_student   = excluded.per_additional_student,
      guest_base_first_student = excluded.guest_base_first_student,
      updated_at               = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Every section on the Fall schedule and whether it can be paid. Earth Lab must
-- now read 'rate set' on all three of Marnie's. Expect exactly SIX remaining
-- 'NO RATE' rows: three Life Lab, three Real World Math.

select c.name as course,
       p.display_name as teacher,
       to_char(sec.start_time_et, 'HH24:MI') as starts,
       case when r.id is null then 'NO RATE' else 'rate set' end as rate,
       r.base_first_student,
       r.per_additional_student,
       r.guest_base_first_student
from public.course_sections sec
join public.courses c on c.id = sec.course_id
join public.employees e on e.id = sec.instructor_employee_id
join public.employee_profiles p on p.employee_id = e.id
left join public.class_pay_rates r on r.course_id = c.id and r.employee_id is null
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
order by (r.id is not null), c.name, p.display_name, sec.start_time_et;
