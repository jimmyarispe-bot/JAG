-- Dual enrolment: separating where the money lands from where the child sits.
--
-- Adapted from Downloads\jag-import\sql\load-13-DUAL-ENROLLMENT.sql, which was
-- written but never applied to The JAG. Brought into migrations so it is
-- version-controlled and runs once, like everything else.
--
-- Three ideas are currently collapsed into one column:
--
--   1. Billing entity   students.school_id
--      The legal and financial home -- the bank account, the entity Step Up
--      remits to. Unchanged by any of this.
--
--   2. Delivery         sis_enrollments.program
--      Where the child actually attends. A child can attend more than one,
--      which is exactly what the old constraint forbade.
--
--   3. Attribution      program on the revenue line
--      Which program earned each dollar, so "how much of our money is virtual"
--      has an answer.
--
-- Josiah Cooks is the case in hand: enrolled at both The Academy HS and The
-- Academy Virtual, and currently recorded as two children because the database
-- allows no other shape.
--
-- Two changes from the original script, both about not lying:
--
--   * `invoices.program` already exists as plain text from migration 088, so
--     the original's `add column if not exists ... references` was a silent
--     no-op there -- the column stayed, the foreign key never appeared. The
--     constraints below are added explicitly and separately.
--
--   * Those foreign keys are added NOT VALID. Existing rows may hold program
--     strings that predate the catalogue, and a migration that fails halfway
--     through on historical data is worse than one that starts enforcing from
--     now. `validate constraint` can be run later once the backfill is
--     verified; the check at the bottom reports what would fail.

begin;

-- 1. A student may hold several program enrolments in one school year.
alter table public.sis_enrollments
  drop constraint if exists sis_enrollments_student_year_unique;

alter table public.sis_enrollments
  drop constraint if exists sis_enrollments_student_year_program_unique;

alter table public.sis_enrollments
  add constraint sis_enrollments_student_year_program_unique
  unique (student_id, school_year_id, program);

-- 2. Exactly one enrolment is the student's home for headcount.
--    Without this a dual-enrolled child is counted twice and every per-student
--    figure -- capacity, revenue per student, teacher load -- is quietly wrong.
alter table public.sis_enrollments
  add column if not exists is_primary boolean not null default true;

create unique index if not exists idx_sis_enrollments_one_primary
  on public.sis_enrollments (student_id, school_year_id)
  where is_primary;

-- 3. How each program is delivered, so reporting never parses a code string.
create table if not exists public.program_catalog (
  program text primary key,
  label text not null,
  delivery_mode text not null
    check (delivery_mode in ('in_person', 'virtual', 'hybrid')),
  billing_school_name text,
  sort_order int not null default 0
);

insert into public.program_catalog (program, label, delivery_mode, billing_school_name, sort_order) values
  ('academy_fl_campus',  'The Academy FL - In-Person', 'in_person', 'The Academy FL',      1),
  ('academy_fl_virtual', 'The Academy FL - Virtual',   'virtual',   'The Academy FL',      2),
  ('academy_ga_campus',  'The Academy GA - In-Person', 'in_person', 'The Academy GA',      3),
  ('academy_ga_hybrid',  'The Academy GA - Hybrid',    'hybrid',    'The Academy GA',      4),
  ('academy_hs',         'The Academy HS',             'virtual',   'The Academy HS',      5),
  ('academy_virtual',    'The Academy Virtual',        'virtual',   'The Academy Virtual', 6)
on conflict (program) do update set
  label = excluded.label,
  delivery_mode = excluded.delivery_mode,
  billing_school_name = excluded.billing_school_name,
  sort_order = excluded.sort_order;

alter table public.program_catalog enable row level security;

drop policy if exists program_catalog_read on public.program_catalog;
create policy program_catalog_read on public.program_catalog
  for select to authenticated using (true);

-- 4. Attribute revenue to the program that earned it, not just the entity that
--    banked it. Null means "same as the student's primary program".
alter table public.ssis_student_funding_records add column if not exists program text;
alter table public.payment_plan_installments   add column if not exists program text;
alter table public.invoices                    add column if not exists program text;

-- Added explicitly, because `add column if not exists` skips the reference
-- clause entirely when the column is already there.
alter table public.ssis_student_funding_records
  drop constraint if exists ssis_student_funding_records_program_fkey;
alter table public.ssis_student_funding_records
  add constraint ssis_student_funding_records_program_fkey
  foreign key (program) references public.program_catalog(program) not valid;

alter table public.payment_plan_installments
  drop constraint if exists payment_plan_installments_program_fkey;
alter table public.payment_plan_installments
  add constraint payment_plan_installments_program_fkey
  foreign key (program) references public.program_catalog(program) not valid;

alter table public.invoices
  drop constraint if exists invoices_program_fkey;
alter table public.invoices
  add constraint invoices_program_fkey
  foreign key (program) references public.program_catalog(program) not valid;

-- 5. Every student's existing program becomes their primary attribution.
update public.ssis_student_funding_records f
set program = st.program
from public.students st
where st.id = f.student_id
  and f.program is null
  and st.program is not null
  and exists (select 1 from public.program_catalog c where c.program = st.program);

commit;

-- ---------------------------------------------------------------------------
-- What would fail if those foreign keys were validated today. Run it; an empty
-- result means you can safely run the three `validate constraint` statements
-- underneath. Anything listed is a program string no catalogue row matches.
-- ---------------------------------------------------------------------------
select 'invoices' as source, program, count(*) as rows
from public.invoices
where program is not null
  and not exists (select 1 from public.program_catalog c where c.program = invoices.program)
group by program
union all
select 'ssis_student_funding_records', program, count(*)
from public.ssis_student_funding_records f
where program is not null
  and not exists (select 1 from public.program_catalog c where c.program = f.program)
group by program
union all
select 'payment_plan_installments', program, count(*)
from public.payment_plan_installments p
where program is not null
  and not exists (select 1 from public.program_catalog c where c.program = p.program)
group by program;

-- alter table public.invoices                    validate constraint invoices_program_fkey;
-- alter table public.ssis_student_funding_records validate constraint ssis_student_funding_records_program_fkey;
-- alter table public.payment_plan_installments    validate constraint payment_plan_installments_program_fkey;
