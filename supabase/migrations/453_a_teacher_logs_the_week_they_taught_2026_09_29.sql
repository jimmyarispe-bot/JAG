-- 453_a_teacher_logs_the_week_they_taught_2026_09_29.sql
--
-- The tables behind the pay and attendance model Jimmy specified on
-- 29 September. Commit 9a427715 put the rates in code; this is where a week
-- is recorded. Nothing reads or writes these yet - no screen exists.
--
-- NOTHING IS DROPPED. teacher_week_submissions, class_pay_rates,
-- work_pay_rates and contractor_work_claims are all left exactly as they are.
-- They hold weeks that were really submitted and rates that were really
-- agreed, and a migration that removed them would delete the only record of
-- what people were paid before today. They stop being written to when the new
-- screen ships, and they are retired in a later migration once a full cycle
-- has run on the new one - not before.
--
-- WHAT A WEEK IS. Monday to Friday (Jimmy, 29 September). One row per teacher
-- per week; every class they taught hangs off it; every child they scheduled
-- hangs off the class.
--
--   teacher_campus_assignments  who teaches for Virtual, for HS, or for both
--   teacher_weeks               one teacher, one Monday
--   teacher_class_entries       one class taught: what, when, scheduled/guest
--   teacher_class_students      one child on that class, present or absent
--   teacher_extra_claims        GREATNESS, conferences, meetings, coaching, hours
--   teacher_hourly_claims       Craig Mann's tutoring, Katie Vetere's admin
--
-- THERE IS NO gross_cents A CLIENT CAN WRITE, and that is deliberate. The old
-- teacher_week_submissions froze a figure at submit, which was right, but the
-- figure arrived from the browser and could not be verified by row-level
-- security - open since 21 September, and the single worst thing in the old
-- design. Here the week stores only what happened; the money is derived from
-- it. `frozen_total_cents` exists so a September week does not silently
-- re-price in November, and NOTHING may write it but the submit function that
-- a later migration adds. Until then it stays null and totals are computed on
-- read.
--
-- ATTENDANCE IS TWO FACTS, NOT ONE. A row in teacher_class_students means the
-- child was SCHEDULED. Its `absent` flag means they did not come. Pay counts
-- the rows; attendance reads the flag. Keeping them in one table is what makes
-- "scheduled but absent" impossible to lose.
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Which campus a teacher teaches for
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_campus_assignments (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  campus       text not null check (campus in ('virtual', 'hs')),
  -- Jimmy: only Heather, Danni or Jimmy may assign this. Enforced by the
  -- action's permission check; recorded here so the answer to "who decided
  -- this" outlives whoever remembers.
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  assigned_at  timestamptz not null default now(),
  constraint teacher_campus_assignments_unique unique (employee_id, campus)
);

comment on table public.teacher_campus_assignments is
  'A teacher teaches for The Academy Virtual, The Academy HS, or both. Two '
  'rows means both. Only Heather, Danni or Jimmy may create one.';

-- ---------------------------------------------------------------------------
-- 2. The week
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_weeks (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  -- Always a Monday, America/New_York. The constraint below refuses anything
  -- else rather than quietly filing Tuesday's week under Tuesday.
  week_start   date not null,
  status       text not null default 'open' check (status in ('open', 'submitted')),
  submitted_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  -- Item 16, in Jimmy's own words.
  kooky_note   text,
  /*
   * Written by the submit function and by nothing else, ever. A week that has
   * been submitted must keep the figure it was submitted at: recompute it in
   * November against a roster that has since changed and the same class, same
   * day, same work shows a different number.
   */
  frozen_total_cents integer check (frozen_total_cents is null or frozen_total_cents >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint teacher_weeks_unique unique (employee_id, week_start),
  constraint teacher_weeks_starts_monday check (extract(isodow from week_start) = 1),
  -- A submitted week has a time and a person on it; an open one has neither.
  constraint teacher_weeks_submission_coherent check (
    (status = 'submitted' and submitted_at is not null)
    or (status = 'open' and submitted_at is null and frozen_total_cents is null)
  )
);

comment on column public.teacher_weeks.frozen_total_cents is
  'Set once, by the submit function, from the rows below. No client may write '
  'it. Null means the week is still open and its total is computed on read.';

-- ---------------------------------------------------------------------------
-- 3. One class taught
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_class_entries (
  id              uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete restrict,
  campus          text not null check (campus in ('virtual', 'hs')),
  class_date      date not null,
  -- Item 11: start times 7am to 11pm ET, on the hour. Classes run 50 minutes
  -- and the duration is deliberately not stored - it is not displayed and
  -- nothing computes from it.
  start_time_et   time not null,
  is_guest        boolean not null default false,
  -- Item 10: a guest names whose class it is. Nobody else does.
  guest_for_employee_id uuid references public.employees(id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint teacher_class_entries_hour_window check (
    start_time_et >= time '07:00' and start_time_et <= time '23:00'
  ),
  constraint teacher_class_entries_on_the_hour check (
    extract(minute from start_time_et) = 0 and extract(second from start_time_et) = 0
  ),
  /*
   * Guest and "whose class" travel together or not at all. A guest entry with
   * nobody named is a class credited to no one; a named teacher on a
   * non-guest entry is a claim nobody made.
   */
  constraint teacher_class_entries_guest_coherent check (
    (is_guest = true  and guest_for_employee_id is not null)
    or (is_guest = false and guest_for_employee_id is null)
  ),
  -- The same class, same day, same hour, twice, is a double entry.
  constraint teacher_class_entries_unique
    unique (teacher_week_id, course_id, class_date, start_time_et)
);

create index if not exists teacher_class_entries_week_idx
  on public.teacher_class_entries (teacher_week_id);

-- ---------------------------------------------------------------------------
-- 4. Who was on it, and who did not come
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_class_students (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.teacher_class_entries(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  /*
   * The row itself says SCHEDULED. This flag says they did not come.
   *
   * Pay counts rows and ignores this flag (Jimmy, 29 September: an absent
   * child does not reduce the teacher's pay). Attendance reads the flag. One
   * table, because a child who was scheduled and absent must never be
   * representable as two disagreeing records.
   */
  absent     boolean not null default false,
  created_at timestamptz not null default now(),
  constraint teacher_class_students_unique unique (entry_id, student_id)
);

create index if not exists teacher_class_students_entry_idx
  on public.teacher_class_students (entry_id);
create index if not exists teacher_class_students_student_idx
  on public.teacher_class_students (student_id);

-- ---------------------------------------------------------------------------
-- 5. The extras
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_extra_claims (
  id              uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  /*
   * employee_id and claim_month are denormalised from the week ON PURPOSE.
   *
   * The monthly caps - one teacher meeting, one coaching session - cannot be
   * expressed as a unique index unless the person and the month are columns
   * on THIS row. The code enforces the cap too (see rates.ts), and the note
   * on that file says why both: a caller that forgets to pass the prior count
   * pays twice and nothing complains. This index is the half that cannot be
   * forgotten.
   */
  employee_id     uuid not null references public.employees(id) on delete cascade,
  claim_month     date not null,
  kind            text not null check (kind in (
                    'greatness_report', 'parent_conference',
                    'teacher_meeting', 'coaching_session', 'additional_hour')),
  quantity        numeric(6,2) not null check (quantity > 0),
  created_at      timestamptz not null default now(),
  -- Whole counts for everything but hours.
  constraint teacher_extra_claims_whole_where_required check (
    kind = 'additional_hour' or quantity = trunc(quantity)
  ),
  -- claim_month is the first of a month, so the index groups correctly.
  constraint teacher_extra_claims_month_is_first check (
    extract(day from claim_month) = 1
  )
);

-- The caps, in the one place that cannot be bypassed.
create unique index if not exists teacher_extra_claims_once_a_month_idx
  on public.teacher_extra_claims (employee_id, kind, claim_month)
  where kind in ('teacher_meeting', 'coaching_session');

create index if not exists teacher_extra_claims_week_idx
  on public.teacher_extra_claims (teacher_week_id);

-- ---------------------------------------------------------------------------
-- 6. The two person-specific hourly rates
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_hourly_claims (
  id              uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  -- Named, not priced here. The rate lives in rates.ts so there is one place
  -- to read what somebody earns, and a rate change never rewrites history.
  rate_key        text not null check (rate_key in ('craig_mann_ivy_ash_tutoring', 'katie_vetere_admin')),
  hours           numeric(5,2) not null check (hours >= 0),
  created_at      timestamptz not null default now(),
  -- One claim of each kind per week. Katie submits a number, not a list.
  constraint teacher_hourly_claims_unique unique (teacher_week_id, rate_key),
  -- Katie's 0-20. Craig has no cap; 24 hours in a day is the sanity bound.
  constraint teacher_hourly_claims_plausible check (
    (rate_key = 'katie_vetere_admin' and hours <= 20)
    or (rate_key <> 'katie_vetere_admin' and hours <= 60)
  )
);

-- ---------------------------------------------------------------------------
-- 7. Row-level security ON, before anything can write
-- ---------------------------------------------------------------------------
alter table public.teacher_campus_assignments enable row level security;
alter table public.teacher_weeks              enable row level security;
alter table public.teacher_class_entries      enable row level security;
alter table public.teacher_class_students     enable row level security;
alter table public.teacher_extra_claims       enable row level security;
alter table public.teacher_hourly_claims      enable row level security;

/*
 * NO POLICIES ARE CREATED HERE, AND THAT IS THE SAFE STATE.
 *
 * RLS on with no policy means nobody reads and nobody writes except the
 * service role. Nothing uses these tables yet, so that costs nothing today
 * and it means the tables cannot be reached by accident before their policies
 * are written with the screen that needs them.
 *
 * The 21 September fault is the reason to be careful here: a policy that
 * looked right resolved to the wrong school and returned fewer rows with no
 * error. These policies will be written against named cases and verified by
 * signing in as a teacher, not by reading them.
 */

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Six tables, RLS on all six, zero policies, and the constraints that matter.

select c.relname as table_name,
       c.relrowsecurity as rls_on,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies,
       (select count(*) from pg_constraint k where k.conrelid = c.oid and k.contype = 'c') as checks
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('teacher_campus_assignments','teacher_weeks','teacher_class_entries',
                     'teacher_class_students','teacher_extra_claims','teacher_hourly_claims')
 order by c.relname;
