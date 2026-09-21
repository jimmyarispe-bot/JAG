-- ===========================================================================
-- A GUEST IS PAID LIKE ANYONE ELSE  -  401  -  2026-09-21
--
-- Jimmy, 21 September:
--   "guest teacher scale should also start at $20 for the 1st student + $5"
--
-- The 18 September schedule paid a guest less - $15 where the usual base is
-- $20, $30 where it is $35. That made sense when a guest might be an outsider.
-- It is not: every guest is one of the same thirteen teachers, covering for a
-- colleague. Paying her less to help out is a penalty for helping.
--
-- From today, guest_base_first_student equals base_first_student for every
-- rate in force. Nothing else about the schedule changes.
--
-- NEW ROWS, NOT AN EDIT. class_pay_rates is versioned by effective_from
-- precisely so "a period recalculated in December prices at what it priced at
-- in August". The rows dated 2026-09-01 are left exactly as they are; these
-- are dated 2026-09-21 and rateOn() picks whichever was in force on the day of
-- the class. No class already taught changes price.
--
-- DERIVED FROM WHAT IS THERE, NOT FROM A LIST. The 18 September migration
-- named its seven courses literally. This one copies whatever rate is in force
-- today, so a rate added since - including a personal rate belonging to one
-- teacher, which migration 379 made possible - carries forward without being
-- named here and without being lost.
--
-- Two statements because class_pay_rates has TWO partial unique indexes:
-- (course_id, effective_from) where employee_id is null, and
-- (course_id, employee_id, effective_from) where it is not. A single insert
-- cannot name both.
-- ===========================================================================

begin;

-- 1. Network rates - the ones that apply to anybody teaching the course.
with in_force as (
  select distinct on (course_id)
    course_id,
    base_first_student,
    per_additional_student
  from public.class_pay_rates
  where employee_id is null
    and effective_from <= date '2026-09-21'
  order by course_id, effective_from desc
)
insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select
  course_id, null, base_first_student, per_additional_student,
  base_first_student, date '2026-09-21'
from in_force
on conflict (course_id, effective_from) where employee_id is null
do update set
  base_first_student       = excluded.base_first_student,
  per_additional_student   = excluded.per_additional_student,
  guest_base_first_student = excluded.guest_base_first_student,
  updated_at               = now();

-- 2. Personal rates - a rate that belongs to one teacher and beats the course
--    rate for her. Migration 379. Carried forward the same way.
with in_force as (
  select distinct on (course_id, employee_id)
    course_id,
    employee_id,
    base_first_student,
    per_additional_student
  from public.class_pay_rates
  where employee_id is not null
    and effective_from <= date '2026-09-21'
  order by course_id, employee_id, effective_from desc
)
insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select
  course_id, employee_id, base_first_student, per_additional_student,
  base_first_student, date '2026-09-21'
from in_force
on conflict (course_id, employee_id, effective_from) where employee_id is not null
do update set
  base_first_student       = excluded.base_first_student,
  per_additional_student   = excluded.per_additional_student,
  guest_base_first_student = excluded.guest_base_first_student,
  updated_at               = now();

commit;

-- ===========================================================================
-- VERIFY. Read all four.
-- ===========================================================================

-- 1. Every rate in force today. guest should equal base on every line.
--    Empty here would mean no rates exist at all, which would mean the pay
--    screen shows $0.00 for everyone - not a quiet success.
select
  '1. in force today'                                    as check,
  coalesce(c.name, '(no course)')
    || case when r.employee_id is null then '' else '  (personal rate)' end as detail,
  'base ' || r.base_first_student::text
    || ' / additional ' || r.per_additional_student::text
    || ' / guest ' || r.guest_base_first_student::text    as extra
from public.class_pay_rates r
left join public.courses c on c.id = r.course_id
where r.effective_from = date '2026-09-21'

union all

-- 2. Anything in force today where a guest is still paid less.
--    EXPECT NOTHING. A row here is a teacher penalised for covering.
select
  '2. GUEST STILL PAID LESS - LOOK',
  coalesce(c.name, '(no course)'),
  r.guest_base_first_student::text || ' vs base ' || r.base_first_student::text
from public.class_pay_rates r
left join public.courses c on c.id = r.course_id
where r.effective_from = date '2026-09-21'
  and r.guest_base_first_student <> r.base_first_student

union all

-- 3. History is untouched. The 1 September rows should still be here, still
--    carrying the old guest figures, so anything already taught prices at what
--    it priced at then.
select
  '3. history preserved',
  'rates dated before 21 Sep',
  count(*)::text
from public.class_pay_rates
where effective_from < date '2026-09-21'

union all

-- 4. Courses with no rate in force today at all. EXPECT NOTHING. A course
--    here is one whose classes will show "no agreed rate" on a timesheet.
select
  '4. COURSE WITH NO RATE - LOOK',
  c.name,
  ''
from public.courses c
where exists (
    select 1 from public.course_sections cs where cs.course_id = c.id
  )
  and not exists (
    select 1 from public.class_pay_rates r
    where r.course_id = c.id
      and r.employee_id is null
      and r.effective_from <= date '2026-09-21'
  )

order by 1, 2;
