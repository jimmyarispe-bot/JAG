-- 392_the_week_a_teacher_submits_2026_09_21.sql
--
-- Step 3 of claude/attendance-and-teacher-pay-design-2026-09-20.md.
--
-- WHAT THIS IS FOR
--
-- A virtual teacher marks their classes held or not held in a Monday-to-Friday
-- table, sees what the week pays before they send it, verifies it, and submits
-- by 11:59pm Friday Eastern. It then goes to Jimmy to pay.
--
-- Measured 20 September, before any of this: attendance had NEVER been recorded
-- in JAG - both attendance tables held zero rows and always had - and 1,025
-- classes had already been taught this school year with nothing recording which
-- of them happened. Every class is priced; not one was verified.
--
-- START FORWARD. Jimmy's decision, 20 September. Verified attendance and weekly
-- submission begin Monday 21 September 2026; August and early September are
-- settled the way they have been. Eleven people asked to remember which
-- Tuesdays happened six weeks ago would produce confident guesses, and a guess
-- written into a pay record is worse than an acknowledged gap. The gap is
-- recorded as a gap. The check constraint on week_start enforces it, so no week
-- before go-live can be created even by mistake.

begin;

-- =========================================================================
-- 1. THE WEEK
-- =========================================================================
--
-- gross_cents IS FROZEN AT SUBMIT, AND THAT IS THE WHOLE POINT.
--
-- Earth Lab pays $20 plus $5 for each additional student. A class taught on
-- 22 September with four children on the roster is $35. If the figure were
-- recomputed whenever somebody opened the page, then in November - after one of
-- those four withdrew - that same class would look up today's roster, find
-- three children, and show $30. Raise the rate instead and it moves the other
-- way: every already-submitted September week quietly grows.
--
-- Neither is right. The class happened with four children at the rate that
-- applied that day, and that stopped changing on 22 September. A submitted week
-- is a receipt, not a formula: computed once, at the moment the teacher
-- verifies it, and kept.

create table if not exists public.teacher_week_submissions (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null
    references public.employees(id) on delete cascade,

  -- Monday and Friday, America/New_York. The network operates on Eastern and
  -- everyone else adjusts.
  week_start date not null,
  week_end   date not null,

  status text not null default 'open'
    check (status in ('open', 'submitted')),

  submitted_at timestamptz,
  submitted_by uuid references public.users(id) on delete set null,

  -- Frozen at submit. Null while the week is open.
  gross_cents integer check (gross_cents >= 0),
  extras_cents integer not null default 0 check (extras_cents >= 0),

  session_count integer not null default 0 check (session_count >= 0),
  unheld_count  integer not null default 0 check (unheld_count  >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint teacher_week_is_monday_to_friday
    check (week_end = week_start + 4),

  -- No week before go-live can exist. A teacher opening their timesheet must
  -- never be shown six empty August weeks that look like something they failed
  -- to do.
  constraint teacher_week_starts_at_or_after_go_live
    check (week_start >= date '2026-09-21'),

  -- A submitted week has to say what it was submitted for. Half a submission
  -- is the shape of a record that cannot be paid or argued with.
  constraint teacher_week_submitted_is_complete
    check (
      status = 'open'
      or (submitted_at is not null and gross_cents is not null)
    )
);

create unique index if not exists idx_teacher_week_one_per_person_per_week
  on public.teacher_week_submissions (employee_id, week_start);

create index if not exists idx_teacher_week_open
  on public.teacher_week_submissions (status, week_start desc);

drop trigger if exists teacher_week_submissions_set_updated_at
  on public.teacher_week_submissions;
create trigger teacher_week_submissions_set_updated_at
  before update on public.teacher_week_submissions
  for each row execute function public.trigger_set_updated_at();

-- =========================================================================
-- 2. A SUBMITTED WEEK NEVER REOPENS
-- =========================================================================
--
-- Jimmy, 20 September: "if they forgot something they will have to submit it
-- separately and give very specific details about what they forgot or messed
-- up on."
--
-- So there is no unlock. A teacher who realises on Saturday that she forgot
-- Thursday's class files an amendment against that week, and the original stays
-- exactly as she submitted it. You can see what she sent on Friday, what she
-- says went wrong, when she said it, and what was decided. Reopening would have
-- overwritten Friday's figure and left no trace a correction ever happened.
--
-- explanation is NOT NULL with a length floor on purpose. The entire value of
-- an amendment is that it says what happened; a correction with no account of
-- itself is just a second number.

create table if not exists public.teacher_week_amendments (
  id uuid primary key default gen_random_uuid(),

  week_submission_id uuid not null
    references public.teacher_week_submissions(id) on delete cascade,

  employee_id uuid not null
    references public.employees(id) on delete cascade,

  kind text not null
    check (kind in ('missed_class', 'wrong_mark', 'missed_extra', 'other')),

  instructional_session_id uuid
    references public.instructional_sessions(id) on delete set null,

  explanation text not null
    check (length(btrim(explanation)) >= 20),

  claimed_cents integer check (claimed_cents >= 0),

  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'declined')),

  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  decision_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint teacher_week_amendment_decided_is_complete
    check (
      status = 'submitted'
      or (decided_at is not null)
    )
);

create index if not exists idx_teacher_week_amendments_week
  on public.teacher_week_amendments (week_submission_id);

create index if not exists idx_teacher_week_amendments_waiting
  on public.teacher_week_amendments (status, created_at)
  where status = 'submitted';

drop trigger if exists teacher_week_amendments_set_updated_at
  on public.teacher_week_amendments;
create trigger teacher_week_amendments_set_updated_at
  before update on public.teacher_week_amendments
  for each row execute function public.trigger_set_updated_at();

-- =========================================================================
-- 3. EXTRAS RIDE THE SAME WEEK
-- =========================================================================
--
-- A work claim now belongs to a week, so an extra is verified and submitted in
-- the same action as the classes rather than in a flow of its own. Once the
-- week is submitted the claim is as frozen as everything else in it, and a
-- forgotten extra becomes an amendment.

alter table public.contractor_work_claims
  add column if not exists week_submission_id uuid
    references public.teacher_week_submissions(id) on delete set null;

create index if not exists idx_contractor_work_claims_week
  on public.contractor_work_claims (week_submission_id);

-- =========================================================================
-- 4. WHERE MEET WILL EVENTUALLY MATCH A CHILD
-- =========================================================================
--
-- Every student has a school Google account on one of four campus domains -
-- theacademyvirtual.org, theacademyhs.org, theacademyfl.org, theacademyga.org -
-- all secondary domains on a single Workspace tenant. When Meet attendance is
-- wired up, a signed-in participant comes back with a real identity and email,
-- and this is the column that ties ivy.ash@theacademyvirtual.org to student
-- 000012. JAG has never recorded a student's school address.
--
-- Populated from the Admin Directory, not typed. The connector already requests
-- admin.directory.user.readonly, so no new consent is needed to read it.
--
-- session_join_events is deliberately NOT created here. Meet attendance data
-- only exists on certain Workspace editions and that has not been confirmed
-- yet. An empty table for a feature that cannot run is how
-- session_attendance_records came to sit unused since migration 082.

alter table public.students
  add column if not exists school_email text;

create unique index if not exists idx_students_school_email
  on public.students (lower(school_email))
  where school_email is not null;

comment on column public.students.school_email is
  'The student''s school Google account. Read from the Admin Directory, not '
  'typed. Used to match a signed-in Meet participant to this child.';

commit;

-- =========================================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================================
--
-- ONLY DANNI AND JIMMY SEE MONEY. That rule is unchanged: gross_cents and the
-- ledger stay behind finance.view / FOUNDER. What a teacher gains is sight of
-- THEIR OWN week and their own pay, which is not the network's money - it is
-- the number they are being asked to verify, and they cannot verify a number
-- they are not allowed to see.

begin;

alter table public.teacher_week_submissions enable row level security;
alter table public.teacher_week_amendments  enable row level security;

drop policy if exists teacher_week_submissions_read on public.teacher_week_submissions;
create policy teacher_week_submissions_read on public.teacher_week_submissions
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    or is_self_employee(employee_id)
  );

-- A teacher may open and edit their OWN week, and only while it is open.
drop policy if exists teacher_week_submissions_self_insert on public.teacher_week_submissions;
create policy teacher_week_submissions_self_insert on public.teacher_week_submissions
  for insert with check (is_self_employee(employee_id) and status = 'open');

drop policy if exists teacher_week_submissions_self_update on public.teacher_week_submissions;
create policy teacher_week_submissions_self_update on public.teacher_week_submissions
  for update using (is_self_employee(employee_id) and status = 'open')
  with check (is_self_employee(employee_id));

drop policy if exists teacher_week_submissions_finance_write on public.teacher_week_submissions;
create policy teacher_week_submissions_finance_write on public.teacher_week_submissions
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

drop policy if exists teacher_week_amendments_read on public.teacher_week_amendments;
create policy teacher_week_amendments_read on public.teacher_week_amendments
  for select using (
    has_permission('finance.view')
    or has_role('FOUNDER')
    or is_self_employee(employee_id)
  );

-- A teacher files their own amendment and cannot decide it.
drop policy if exists teacher_week_amendments_self_insert on public.teacher_week_amendments;
create policy teacher_week_amendments_self_insert on public.teacher_week_amendments
  for insert with check (is_self_employee(employee_id) and status = 'submitted');

drop policy if exists teacher_week_amendments_finance_write on public.teacher_week_amendments;
create policy teacher_week_amendments_finance_write on public.teacher_week_amendments
  for all using (has_permission('finance.view') or has_role('FOUNDER'))
  with check (has_permission('finance.view') or has_role('FOUNDER'));

-- TEACHERS MAY NOW ENTER THEIR OWN EXTRAS - Jimmy's instruction. Until now
-- contractor_work_claims was writable by finance and FOUNDER only, so the
-- "teachers can add extra pay items" requirement had nowhere to land.
-- Bounded: their own claims, attached to their own week, while it is still open.

drop policy if exists contractor_work_claims_self_insert on public.contractor_work_claims;
create policy contractor_work_claims_self_insert on public.contractor_work_claims
  for insert with check (
    is_self_employee(employee_id)
    and exists (
      select 1 from public.teacher_week_submissions w
       where w.id = week_submission_id
         and w.employee_id = contractor_work_claims.employee_id
         and w.status = 'open'
    )
  );

drop policy if exists contractor_work_claims_self_update on public.contractor_work_claims;
create policy contractor_work_claims_self_update on public.contractor_work_claims
  for update using (
    is_self_employee(employee_id)
    and exists (
      select 1 from public.teacher_week_submissions w
       where w.id = week_submission_id
         and w.employee_id = contractor_work_claims.employee_id
         and w.status = 'open'
    )
  )
  with check (is_self_employee(employee_id));

drop policy if exists contractor_work_claims_self_delete on public.contractor_work_claims;
create policy contractor_work_claims_self_delete on public.contractor_work_claims
  for delete using (
    is_self_employee(employee_id)
    and exists (
      select 1 from public.teacher_week_submissions w
       where w.id = week_submission_id
         and w.employee_id = contractor_work_claims.employee_id
         and w.status = 'open'
    )
  );

commit;

-- =========================================================================
-- 6. KATIE VETERE'S ADMIN RATE - $25 AN HOUR
-- =========================================================================
--
-- Carried unimplemented since before the schedule work. Migration 377 was
-- written expecting it: the comment on work_pay_rates.employee_id reads
-- "Katie's 25.00 an hour is hers, not a network admin rate." The column was
-- made for this row and the row was never inserted.
--
-- IT DOES NOT INSERT SILENTLY, AND IT DOES NOT ABORT EITHER.
--
-- A seed that matches zero rows and reports success is the failure this project
-- keeps getting caught by - migration 287 did exactly that and nobody noticed
-- for days. But raising here would abort the script AFTER sections 1-5 had
-- already committed, printing an error and never reaching the report, so the
-- one thing that failed would hide the four that worked.
--
-- So it inserts only on an unambiguous match, and the REPORT AT THE END SAYS SO
-- in words. Zero matches or two both leave the rate MISSING and print the match
-- count beside it, which is louder than an exception and does not cost the
-- report.

-- min(uuid) IS NOT A FUNCTION. The first version of this block counted the
-- matches and grabbed the id in one pass with min(p.employee_id), which
-- Postgres refuses: 42883, function min(uuid) does not exist. Count first,
-- then fetch - and only when the count says exactly one, which is the check
-- that mattered anyway.

do $$
declare
  v_employee_id uuid;
  v_matches integer;
begin
  select count(*)
    into v_matches
    from public.employee_profiles p
   where lower(btrim(p.first_name)) = 'katie'
     and lower(btrim(p.last_name))  = 'vetere';

  if v_matches = 1 then
    select p.employee_id
      into v_employee_id
      from public.employee_profiles p
     where lower(btrim(p.first_name)) = 'katie'
       and lower(btrim(p.last_name))  = 'vetere';

    insert into public.work_pay_rates
      (code, label, unit, amount, employee_id, school_id, cadence_note, effective_from)
    values
      ('admin_hour',
       'Administrative work',
       'hour',
       25.00,
       v_employee_id,
       null,
       'Hours actually worked, claimed on the week they fall in.',
       date '2026-09-21')
    on conflict do nothing;
  end if;
end $$;

-- =========================================================================
-- THE REPORT
--
-- Run after. The Supabase editor shows only the LAST result set, so this is it.
-- Every line should read 'yes'. Katie's rate reading 'MISSING' means the DO
-- block above raised and the rest still applied.
-- =========================================================================

select * from (
  select 1 as ord, 'teacher_week_submissions exists' as fact,
         case when to_regclass('public.teacher_week_submissions') is null
              then 'MISSING' else 'yes' end as value
  union all
  select 2, 'teacher_week_amendments exists',
         case when to_regclass('public.teacher_week_amendments') is null
              then 'MISSING' else 'yes' end
  union all
  select 3, 'contractor_work_claims.week_submission_id exists',
         case when exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='contractor_work_claims'
                              and column_name='week_submission_id')
              then 'yes' else 'MISSING' end
  union all
  select 4, 'students.school_email exists',
         case when exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='students'
                              and column_name='school_email')
              then 'yes' else 'MISSING' end
  union all
  select 5, 'no week can start before Monday 21 September 2026',
         case when exists (select 1 from pg_constraint
                            where conname='teacher_week_starts_at_or_after_go_live')
              then 'yes' else 'MISSING' end
  union all
  select 6, 'a teacher may enter their own extras',
         case when exists (select 1 from pg_policies
                            where tablename='contractor_work_claims'
                              and policyname='contractor_work_claims_self_insert')
              then 'yes' else 'MISSING' end
  union all
  select 7, 'Katie Vetere admin rate, per hour',
         coalesce((select to_char(r.amount, 'FM999.00')
                     from public.work_pay_rates r
                     join public.employee_profiles p on p.employee_id = r.employee_id
                    where r.code = 'admin_hour'
                      and lower(btrim(p.last_name)) = 'vetere'
                    limit 1), 'MISSING')
  union all
  select 8, 'employees named Katie Vetere (a rate needs exactly 1)',
         (select count(*)::text from public.employee_profiles p
           where lower(btrim(p.first_name)) = 'katie'
             and lower(btrim(p.last_name))  = 'vetere')
  union all
  select 9, 'weeks submitted so far (expected: 0 until Friday)',
         (select count(*)::text from public.teacher_week_submissions)
) q
order by ord;
