-- Pay for work that is not a class.
--
-- Jimmy, 19 September 2026: "if katie vetere does admin work it is at $25 per
-- hour". Katie Vetere is already a teacher at The Academy Virtual (migration
-- 375), so this is not instead of class pay - it is a second kind of work the
-- same person does, priced a different way.
--
-- WHY THIS IS NOT A COLUMN ON KATIE'S EMPLOYEE ROW.
--
-- The pay schedule of 18 September 2026 already carries six more lines that are
-- not classes and that migration 376 had nowhere to put:
--
--   Staff Meeting                    15.00  flat, once a month
--   Parent/Student Conference        15.00  per student, December and May only
--   GREATNESS Report                  5.00  per student, monthly except Dec & May
--   Coaching with Heather Badger-Brown 15.00  per session
--   Structured Literacy Assessment   30.00  per student
--   Math Assessment                  15.00  per student
--
-- Katie's 25.00 an hour is the seventh. A column named admin_hourly_rate would
-- pay Katie and would have to be torn out the week the conferences are claimed.
-- So the shape is a rate CATALOGUE: a code, a unit, an amount, and optionally a
-- person it belongs to.
--
-- THREE UNITS, BECAUSE THE SHEET HAS THREE.
--
--   'hour'        amount x hours worked          (Katie's admin work)
--   'occurrence'  amount, once, however long     (a staff meeting, a coaching session)
--   'student'     amount x students              (conferences, GREATNESS reports)
--
-- A flat "amount" with no unit would make 25.00 and 15.00 look like the same
-- kind of number, and the difference between them is the whole calculation.
--
-- VERSIONED BY effective_from, for the same reason class_pay_rates is: a pay
-- period recalculated in December must price at what it priced at in September,
-- or no two runs of the same period agree and neither can be trusted.
--
-- WHAT THIS MIGRATION DOES NOT DO: it does not pay anybody. Recording a rate is
-- not a way to claim work. Nothing writes contractor_work_claims yet - that
-- needs the entry screen, which is not built. The rates are here so that when
-- the screen exists it has something true to read, and so that a number Jimmy
-- said out loud on 19 September is not sitting only in a chat log.

begin;

-- =========================================================================
-- 1. THE RATE CATALOGUE
-- =========================================================================

create table if not exists public.work_pay_rates (
  id uuid primary key default gen_random_uuid(),

  -- Stable machine name. Code keys off this, never off the label.
  code text not null,

  label text not null,

  unit text not null
    check (unit in ('hour', 'occurrence', 'student')),

  amount numeric(10,2) not null
    check (amount >= 0),

  -- NULL means anybody may be paid this rate. Set means this rate exists for
  -- one person only - Katie's 25.00 an hour is hers, not a network admin rate.
  employee_id uuid
    references public.employees(id) on delete cascade,

  -- NULL means the whole network. Set narrows it to one campus.
  school_id uuid
    references public.schools(id) on delete cascade,

  -- How often the sheet says this may be claimed, in words. NOTHING ENFORCES
  -- THIS. It is printed next to the claim so the person approving can see the
  -- rule; the check belongs in the claims screen, which does not exist yet, and
  -- a column that looks like a constraint but is not is worse than a sentence.
  cadence_note text,

  effective_from date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One rate per code per start date. Two indexes rather than one, because a
-- unique index treats every NULL employee_id as distinct from every other, so a
-- single index would happily accept the same network rate twice.
create unique index if not exists idx_work_pay_rates_network_code_effective
  on public.work_pay_rates (code, effective_from)
  where employee_id is null;

create unique index if not exists idx_work_pay_rates_person_code_effective
  on public.work_pay_rates (code, employee_id, effective_from)
  where employee_id is not null;

comment on table public.work_pay_rates is
  'What work that is not a class pays: an amount, a unit (hour, occurrence or '
  'student), and optionally the one person the rate belongs to. Versioned by '
  'effective_from so a recalculated pay period returns what it originally paid.';

alter table public.work_pay_rates enable row level security;

drop policy if exists work_pay_rates_read on public.work_pay_rates;
create policy work_pay_rates_read on public.work_pay_rates
  for select using (has_permission('finance.view') or has_role('FOUNDER'));

drop policy if exists work_pay_rates_write on public.work_pay_rates;
create policy work_pay_rates_write on public.work_pay_rates
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

-- =========================================================================
-- 2. THE CLAIM: THIS WORK HAPPENED
-- =========================================================================
--
-- A class pays because a session exists and a roster exists - the platform
-- already knows it happened. Nothing in the platform knows Katie spent three
-- hours on admin on a Tuesday. Somebody has to say so, and that statement is a
-- row, with a date, a quantity and a name against it.
--
-- quantity carries the unit: hours for 'hour', 1 for 'occurrence', a head count
-- for 'student'.

create table if not exists public.contractor_work_claims (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references public.schools(id) on delete cascade,

  employee_id uuid not null
    references public.employees(id) on delete cascade,

  work_code text not null,

  work_date date not null,

  quantity numeric(10,2) not null
    check (quantity > 0),

  notes text,

  -- Who entered it. A claim with nobody's name on it is an anonymous request
  -- for money.
  created_by uuid
    references public.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contractor_work_claims_employee
  on public.contractor_work_claims (employee_id, work_date);

create index if not exists idx_contractor_work_claims_school
  on public.contractor_work_claims (school_id, work_date);

comment on table public.contractor_work_claims is
  'A statement that a piece of non-class work happened: who, what code, what '
  'day, how much. Priced against work_pay_rates as they stood on work_date.';

alter table public.contractor_work_claims enable row level security;

drop policy if exists contractor_work_claims_read on public.contractor_work_claims;
create policy contractor_work_claims_read on public.contractor_work_claims
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    or is_self_employee(employee_id)
  );

drop policy if exists contractor_work_claims_write on public.contractor_work_claims;
create policy contractor_work_claims_write on public.contractor_work_claims
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

-- =========================================================================
-- 3. ONE LEDGER, TWO KINDS OF WORK
-- =========================================================================
--
-- Non-class work is paid out of contractor_pay_ledger like everything else -
-- one ledger, one approval, one export, one number a teacher is owed. A ledger
-- row therefore points at either a session or a claim.
--
-- The partial unique index is the same protection migration 376 gave sessions:
-- recalculating a period must update the row it already wrote, not add a second
-- one and pay Katie twice for the same Tuesday.

alter table public.contractor_pay_ledger
  add column if not exists work_claim_id uuid
    references public.contractor_work_claims(id) on delete set null;

create unique index if not exists idx_contractor_pay_ledger_one_row_per_claim
  on public.contractor_pay_ledger (employee_id, work_claim_id)
  where work_claim_id is not null;

comment on column public.contractor_pay_ledger.work_claim_id is
  'The non-class work this row pays for. Exactly one of instructional_session_id '
  'and work_claim_id is set on a generated row; both null means a hand-entered '
  'adjustment.';

-- =========================================================================
-- 4. THE RATES THEMSELVES
-- =========================================================================
--
-- Katie first, because she is the one Jimmy named. Her rate is keyed to her
-- employee row, found by the natural key migration 375 established: the email
-- local part as employee_number at The Academy Virtual.

insert into public.work_pay_rates
  (code, label, unit, amount, employee_id, school_id, cadence_note, effective_from)
select 'admin_hourly',
       'Administrative work',
       'hour',
       25.00,
       e.id,
       e.school_id,
       'Katie Vetere only. Hours as worked; no monthly cap agreed.',
       date '2026-09-01'
from public.employees e
join public.schools s on s.id = e.school_id
where e.employee_number = 'Katie.Vetere'
  and lower(trim(s.name)) = 'the academy virtual'
on conflict (code, employee_id, effective_from) where employee_id is not null do update
  set amount       = excluded.amount,
      label        = excluded.label,
      unit         = excluded.unit,
      cadence_note = excluded.cadence_note,
      updated_at   = now();

-- The six from the pay schedule of 18 September 2026. Network-wide: any teacher
-- may claim them, so employee_id stays null.

insert into public.work_pay_rates
  (code, label, unit, amount, employee_id, school_id, cadence_note, effective_from)
values
  ('staff_meeting', 'Staff meeting', 'occurrence', 15.00, null, null,
   'Once a month.', date '2026-09-01'),

  ('parent_conference', 'Parent/student conference', 'student', 15.00, null, null,
   'December and May only.', date '2026-09-01'),

  ('greatness_report', 'GREATNESS report', 'student', 5.00, null, null,
   'Monthly except December and May. One per student.', date '2026-09-01'),

  ('coaching_session', 'Coaching with Heather Badger-Brown', 'occurrence', 15.00, null, null,
   'Per session.', date '2026-09-01'),

  ('structured_literacy_assessment', 'Structured Literacy assessment', 'student', 30.00, null, null,
   'Per student assessed.', date '2026-09-01'),

  ('math_assessment', 'Math assessment', 'student', 15.00, null, null,
   'Per student assessed.', date '2026-09-01')
on conflict (code, effective_from) where employee_id is null do update
  set amount       = excluded.amount,
      label        = excluded.label,
      unit         = excluded.unit,
      cadence_note = excluded.cadence_note,
      updated_at   = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- The first line is the one to read. "Katie Vetere" means her 25.00 an hour is
-- attached to her employee row. "NOT LOADED - run migration 375 first" means it
-- is attached to nobody and nothing above inserted: her INSERT selects FROM
-- public.employees, so with no employee row it inserts no rows and raises no
-- error. An absent line in a report is not a finding anybody notices, so this
-- prints the line either way.

select 1 as sort_order,
       'admin_hourly' as code,
       'Administrative work' as label,
       'hour' as unit,
       25.00 as amount,
       coalesce(
         (select p.display_name
            from public.work_pay_rates r
            join public.employees e on e.id = r.employee_id
            join public.employee_profiles p on p.employee_id = e.id
           where r.code = 'admin_hourly'
           limit 1),
         'NOT LOADED - run migration 375 first'
       ) as whose_rate,
       'The Academy Virtual' as where_it_applies,
       'Katie Vetere only. Hours as worked; no monthly cap agreed.' as cadence_note

union all

select 2,
       r.code,
       r.label,
       r.unit,
       r.amount,
       'Anyone',
       coalesce(s.name, 'Whole network'),
       r.cadence_note
from public.work_pay_rates r
left join public.schools s on s.id = r.school_id
where r.employee_id is null

order by sort_order, label;
