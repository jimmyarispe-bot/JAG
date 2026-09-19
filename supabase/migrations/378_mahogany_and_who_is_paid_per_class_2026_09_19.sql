-- Mahogany Murphy, and the difference between salaried and paid-per-class.
--
-- Jimmy, 19 September 2026: "mahogany.murphy@theacademyway.org; she is w2 so we
-- don't have to worry about her."
--
-- She teaches five slots on the Fall 2026-2027 Virtual schedule - Earthology at
-- 9:00 and Structured Literacy at 10:00, 12:00 and 1:00 - and held no record in
-- the JAG at all. A course_section needs an instructor, so she has to exist.
--
-- WHY A COLUMN AND NOT JUST LEAVING HER OUT.
--
-- src/lib/finance/class-pay.ts names any teacher it cannot price as "skipped
-- for no rate", deliberately, because a zero-pound row in a pay run is
-- indistinguishable from a teacher who taught nothing. But Mahogany has no
-- per-class rate BY DESIGN - she is salaried - so every pay run would report
-- her as a problem, every time, forever. A report that always contains a false
-- alarm is a report people stop reading, and that is exactly how the three
-- scholarship award letters sat unnoticed for three days last week.
--
-- So the pay run needs to tell "no rate agreed yet" (a real problem) apart from
-- "not paid this way" (a fact). That is pay_basis.
--
-- SALARIED IS THE SAFE DIRECTION OF ERROR. A salaried person wrongly marked
-- per_class gets paid twice - once by payroll, once by the ledger - and nobody
-- notices until the money is gone. Per_class wrongly marked salaried produces a
-- named, visible absence in the pay run. The default below is per_class because
-- eleven of the twelve are contractors, but see the report: if any of the other
-- eleven are W2, they must be corrected BEFORE a period is ever committed.
--
-- HER SCHOOL. Her address is on the network domain, @theacademyway.org, which
-- names no campus - the same situation as Marnie Witters, who Jimmy placed at
-- The Academy HS. Mahogany is placed at The Academy Virtual because all five of
-- her slots are Virtual courses. Pay follows the COURSE's school rather than
-- the teacher's, so this does not affect what anyone is paid; it decides which
-- campus she is listed under. Say if it is wrong.

begin;

-- =========================================================================
-- 1. HOW A PERSON IS PAID
-- =========================================================================

alter table public.employees
  add column if not exists pay_basis text not null default 'per_class';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employees_pay_basis_check'
  ) then
    alter table public.employees
      add constraint employees_pay_basis_check
      check (pay_basis in ('per_class', 'salaried'));
  end if;
end $$;

comment on column public.employees.pay_basis is
  'per_class: paid from contractor_pay_ledger per session taught. salaried: W2, '
  'paid by payroll - the class pay run must exclude them as a fact, not report '
  'them as an unpriced teacher.';

-- =========================================================================
-- 2. MAHOGANY MURPHY
-- =========================================================================
--
-- employee_number keeps the First.Last convention the other twelve use, so the
-- key is uniform; contact_email is the address exactly as Jimmy wrote it.

with resolved as (
  select s.id as school_id
  from public.schools s
  where lower(trim(s.name)) = 'the academy virtual'
),
upserted as (
  insert into public.employees
    (school_id, employee_number, employee_type, employment_status, pay_basis)
  select school_id, 'Mahogany.Murphy', 'teacher', 'active', 'salaried'
  from resolved
  on conflict (school_id, employee_number) do update
    set employment_status = 'active',
        pay_basis         = 'salaried',
        updated_at        = now()
  returning id
)
insert into public.employee_profiles
  (employee_id, first_name, last_name, display_name, contact_email, job_title)
select id, 'Mahogany', 'Murphy', 'Mahogany Murphy',
       'mahogany.murphy@theacademyway.org', 'Teacher'
from upserted
on conflict (employee_id) do update
  set first_name    = excluded.first_name,
      last_name     = excluded.last_name,
      display_name  = excluded.display_name,
      contact_email = excluded.contact_email,
      job_title     = excluded.job_title,
      updated_at    = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Every teacher and how they are paid. Mahogany must read 'salaried'. READ THE
-- REST OF THE LIST: anyone else who is W2 is sitting at 'per_class' and would
-- be paid a second time by the class pay run. Correcting one is a single
-- update; discovering it after a payment is not.

select p.display_name,
       p.contact_email,
       s.name as school,
       e.pay_basis,
       case when e.pay_basis = 'salaried'
            then 'W2 - class pay run skips, deliberately'
            else 'contractor - paid per session taught' end as meaning
from public.employees e
join public.employee_profiles p on p.employee_id = e.id
join public.schools s on s.id = e.school_id
where p.job_title = 'Teacher'
order by e.pay_basis desc, p.display_name;
