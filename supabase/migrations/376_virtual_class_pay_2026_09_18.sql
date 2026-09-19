-- Teacher pay for classes taught in the virtual schools.
--
-- RUNS AFTER 375. The rate seed at the bottom joins public.courses by name, and
-- 375 is what creates those courses. Numbered 376 on 19 September after it was
-- written on the 18th, because in the original order this file's seed would
-- have joined an empty table, inserted nothing, and reported "Success" - the
-- exact failure shape that cost three families three days last week. The report
-- at the bottom would have said so, in a result set nobody had a reason to read.
--
-- contractor_pay_ledger has existed since migration 048 with the right shape -
-- school, employee, instructional session, pay period, student count, gross,
-- approval, payment status - and NOTHING in the codebase has ever read or
-- written it. This migration gives it rates to work from and closes a hole in
-- who may read it.
--
-- =========================================================================
-- 1. RATES BELONG TO THE COURSE, NOT THE TEACHER
-- =========================================================================
--
-- From the pay schedule of 18 September 2026. A class pays a base for the
-- FIRST student plus a smaller amount for every student beyond, and the base
-- depends on which course it is: Structured Literacy is 35.00 where DigitLab is
-- 20.00. The same teacher on both is paid two different rates, so the rate
-- cannot hang off the teacher.
--
-- A guest covering somebody else's class earns a lower base and the same
-- per-student amount.
--
-- EFFECTIVE_FROM, because rates change and pay runs get recalculated. A period
-- in August must price at August's rate no matter when it is asked about -
-- the same reason the student count is the roster as it stood on the day.

begin;

create table if not exists public.class_pay_rates (
  id uuid primary key default gen_random_uuid(),

  course_id uuid not null
    references public.courses(id) on delete cascade,

  base_first_student numeric(10,2) not null
    check (base_first_student >= 0),

  per_additional_student numeric(10,2) not null
    check (per_additional_student >= 0),

  guest_base_first_student numeric(10,2) not null
    check (guest_base_first_student >= 0),

  effective_from date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One rate per course per start date. Changing a rate means a new row with a
-- later effective_from, never an edit - an edited rate rewrites history that
-- somebody has already been paid against.
create unique index if not exists idx_class_pay_rates_course_effective
  on public.class_pay_rates (course_id, effective_from);

comment on table public.class_pay_rates is
  'What a class pays: a base for the first enrolled student plus a per-student '
  'amount beyond, with a lower base for a guest teacher. Rates are versioned by '
  'effective_from so a recalculated pay period returns what it originally paid.';

alter table public.class_pay_rates enable row level security;

drop policy if exists class_pay_rates_read on public.class_pay_rates;
create policy class_pay_rates_read on public.class_pay_rates
  for select using (has_permission('finance.view') or has_role('FOUNDER'));

drop policy if exists class_pay_rates_write on public.class_pay_rates;
create policy class_pay_rates_write on public.class_pay_rates
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

-- =========================================================================
-- 2. RECALCULATION MUST NOT DOUBLE-PAY
-- =========================================================================
--
-- A period gets recalculated: a roster is corrected, a session added late.
-- Without a unique key the second run writes a second row for the same class
-- and the teacher is paid twice. Partial, because the ledger also allows rows
-- with no session (an adjustment), and those must stay repeatable.

create unique index if not exists idx_contractor_pay_ledger_one_row_per_session
  on public.contractor_pay_ledger (employee_id, instructional_session_id)
  where instructional_session_id is not null;

-- =========================================================================
-- 3. WHO MAY SEE TEACHER PAY
-- =========================================================================
--
-- The policy from migration 049 reads:
--
--   using (can_access_school(school_id) or is_self_employee(employee_id))
--
-- can_access_school is campus access. Heather Badger-Brown is School Leader for
-- The Academy Virtual and The Academy HS, so every teacher's earnings at both
-- campuses were readable by her, and by any future school leader, on a table
-- nobody had noticed because nothing queried it.
--
-- Money in this network is Jimmy and Danni. Campus access is not a reason to
-- see what a colleague earns. is_self_employee stays so a contractor can see
-- their own pay; drop that clause if even that is unwanted.

drop policy if exists contractor_pay_ledger_all on public.contractor_pay_ledger;

drop policy if exists contractor_pay_ledger_read on public.contractor_pay_ledger;
create policy contractor_pay_ledger_read on public.contractor_pay_ledger
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    or is_self_employee(employee_id)
  );

drop policy if exists contractor_pay_ledger_write on public.contractor_pay_ledger;
create policy contractor_pay_ledger_write on public.contractor_pay_ledger
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

-- =========================================================================
-- 4. THE RATES THEMSELVES
-- =========================================================================
--
-- Matched to courses BY NAME, which is how the pay schedule names them. A
-- course that does not exist under this name gets no rate and therefore no pay
-- rows - loudly, in the report below, rather than quietly at zero.

insert into public.class_pay_rates
  (course_id, base_first_student, per_additional_student, guest_base_first_student, effective_from)
select c.id, r.base, r.additional, r.guest, date '2026-09-01'
from (values
  ('DigitLab',            20.00, 5.00, 15.00),
  ('Earthology',          20.00, 5.00, 15.00),
  ('LitLab',              20.00, 5.00, 15.00),
  ('Structured Literacy', 35.00, 5.00, 30.00),
  ('Entrepreneurship',    20.00, 5.00, 15.00),
  ('WorldOlogy',          20.00, 5.00, 15.00),
  ('DataOlogy',           20.00, 5.00, 15.00)
) as r(course_name, base, additional, guest)
join public.courses c on lower(trim(c.name)) = lower(r.course_name)
on conflict (course_id, effective_from) where employee_id is null do update
  set base_first_student       = excluded.base_first_student,
      per_additional_student   = excluded.per_additional_student,
      guest_base_first_student = excluded.guest_base_first_student,
      updated_at               = now();

commit;

-- THE REPORT. Every course on the pay schedule, and whether a rate landed on it.
-- A name with no course is a course that will pay nothing until it is created
-- or renamed, and that has to be visible now rather than at the end of a period.
select r.course_name,
       c.id is not null as course_exists,
       p.base_first_student,
       p.per_additional_student,
       p.guest_base_first_student
from (values
  ('DigitLab'), ('Earthology'), ('LitLab'), ('Structured Literacy'),
  ('Entrepreneurship'), ('WorldOlogy'), ('DataOlogy')
) as r(course_name)
left join public.courses c on lower(trim(c.name)) = lower(r.course_name)
left join public.class_pay_rates p on p.course_id = c.id
order by r.course_name;
