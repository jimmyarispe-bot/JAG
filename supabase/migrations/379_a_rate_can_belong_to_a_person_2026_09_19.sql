-- A class rate can belong to a person.
--
-- Jimmy, 19 September 2026: "when craig mann meets with ivy he is paid $30 per
-- session", and "all tutoring except craig mann and ivy is the same rate", and
-- "the tutoring rate is the 1st student rate for regular classes".
--
-- Tutoring is a CLASS on the Fall 2026-2027 Virtual schedule: it has a slot, a
-- teacher and a roster, exactly like Earthology. So it prices from
-- class_pay_rates. But class_pay_rates hangs off the COURSE, and Craig's 30.00
-- hangs off the PERSON, so there was nowhere to put it.
--
-- work_pay_rates already solved this for non-class work: a nullable employee_id
-- where null means anybody, and a person's own rate beats the network rate for
-- the same thing. This gives class rates the same shape, so every rate in the
-- system now works one way instead of two.
--
-- THE INDEX HAS TO CHANGE WITH IT. The old unique index was (course_id,
-- effective_from), which would reject a person-specific rate for a course that
-- already has a network rate on the same date - the exact row this migration
-- exists to allow. Two partial indexes instead, because a plain unique index
-- treats every NULL employee_id as distinct from every other and would happily
-- accept the same network rate twice.

begin;

-- =========================================================================
-- 1. WHOSE RATE
-- =========================================================================

alter table public.class_pay_rates
  add column if not exists employee_id uuid
    references public.employees(id) on delete cascade;

comment on column public.class_pay_rates.employee_id is
  'NULL means the rate applies to anybody teaching this course. Set means the '
  'rate exists for one person only and beats the course rate for them.';

drop index if exists idx_class_pay_rates_course_effective;

create unique index if not exists idx_class_pay_rates_course_effective
  on public.class_pay_rates (course_id, effective_from)
  where employee_id is null;

create unique index if not exists idx_class_pay_rates_person_effective
  on public.class_pay_rates (course_id, employee_id, effective_from)
  where employee_id is not null;

-- =========================================================================
-- 2. TUTORING IS A COURSE
-- =========================================================================
--
-- One course, not three. Craig's 12:00, Jessica Vedder's 5:00 and Holly
-- Medlong's "SL Tutoring" at 2:00 are three SECTIONS of it - a section is a
-- teacher at a time, which is exactly what distinguishes them. Same rate, which
-- is what Jimmy said, so the same course.
--
-- At The Academy Virtual because all three slots are on the Virtual schedule.
-- Craig is an employee of The Academy HS and teaches here anyway; pay follows
-- the course's school, not the teacher's.

insert into public.courses (school_id, code, name, status)
select s.id, 'TUTORING', 'Tutoring', 'active'
from public.schools s
where lower(trim(s.name)) = 'the academy virtual'
on conflict (school_id, code) do update
  set name = excluded.name, status = 'active', updated_at = now();

-- =========================================================================
-- 3. THE TWO RATES
-- =========================================================================
--
-- FLAT, NOT A FORMULA. "The tutoring rate is the 1st student rate for regular
-- classes" is 20.00 - one number, so per_additional_student is 0.00 and a
-- tutoring session with two students pays 20.00 rather than 25.00. Tutoring is
-- one-to-one everywhere on this schedule, so today the distinction is
-- theoretical; if a second student should add 5.00, this is the line to change.

insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select c.id, null, 20.00, 0.00, 20.00, date '2026-09-01'
from public.courses c
join public.schools s on s.id = c.school_id
where c.code = 'TUTORING' and lower(trim(s.name)) = 'the academy virtual'
on conflict (course_id, effective_from) where employee_id is null do update
  set base_first_student       = excluded.base_first_student,
      per_additional_student   = excluded.per_additional_student,
      guest_base_first_student = excluded.guest_base_first_student,
      updated_at               = now();

-- Craig Mann, 30.00. NOTE: this is a rate for CRAIG'S TUTORING, not for Craig
-- tutoring Ivy specifically - class_pay_rates has no student dimension. Today
-- they are the same thing, because Ivy Ash is the only child in his tutoring
-- slot. If he ever tutors somebody else at 20.00, this needs a third dimension
-- that does not exist yet, and it will quietly pay 30.00 until it is built.

insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select c.id, e.id, 30.00, 0.00, 30.00, date '2026-09-01'
from public.courses c
join public.schools cs on cs.id = c.school_id
cross join public.employees e
where c.code = 'TUTORING'
  and lower(trim(cs.name)) = 'the academy virtual'
  and e.employee_number = 'Craig.Mann'
on conflict (course_id, employee_id, effective_from) where employee_id is not null
do update
  set base_first_student       = excluded.base_first_student,
      per_additional_student   = excluded.per_additional_student,
      guest_base_first_student = excluded.guest_base_first_student,
      updated_at               = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Expect exactly two Tutoring rows: "Anyone" at 20.00 and "Craig Mann" at
-- 30.00. If Craig's row is missing, his employee record was not found and the
-- 30.00 was never inserted - no error, no row, which is the failure shape to
-- watch for.

select c.name as course,
       coalesce(p.display_name, 'Anyone') as whose_rate,
       r.base_first_student,
       r.per_additional_student,
       r.guest_base_first_student,
       r.effective_from
from public.class_pay_rates r
join public.courses c on c.id = r.course_id
left join public.employees e on e.id = r.employee_id
left join public.employee_profiles p on p.employee_id = e.id
order by c.name, (r.employee_id is null) desc;
