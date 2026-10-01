-- rls_462_named_cases.sql
--
-- Twenty-five named cases against migration 462, run as five different
-- people. Every line of output is a question with a right answer; the
-- expected answers are in the migration's own checklist.
--
-- A NOTE ON WHY THIS USES set RATHER THAN set local: the first run of
-- this file refused all twenty-five cases, including ones that should
-- have been allowed. SET LOCAL outside a transaction does nothing, so
-- auth.uid() was null throughout and every policy correctly refused a
-- request from nobody. The harness was wrong, not the policies - which
-- is exactly the kind of false negative that makes people stop trusting
-- a test.
--
\set ON_ERROR_STOP 0
set role tester;

create or replace function pg_temp.try(label text, stmt text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise notice 'ALLOWED  %', label;
exception when others then
  raise notice 'REFUSED  %   (%)', label, left(sqlerrm, 48);
end $$;

create or replace function pg_temp.rows(label text, q text) returns void
language plpgsql as $$
declare n integer;
begin
  execute q into n;
  raise notice 'SEES % row(s)  %', n, label;
end $$;

-- ============ TEACHER A ============
set "app.uid" = 'aaaa0000-0000-0000-0000-00000000000a';

select pg_temp.try('A opens her own week',
  $$insert into public.teacher_weeks(id, employee_id, week_start)
    values ('9000000a-0000-0000-0000-00000000000a','1111aaaa-0000-0000-0000-00000000000a','2026-09-28')$$);

select pg_temp.try('A opens a week FOR TEACHER B',
  $$insert into public.teacher_weeks(id, employee_id, week_start)
    values ('9000000b-0000-0000-0000-00000000000b','2222bbbb-0000-0000-0000-00000000000b','2026-09-28')$$);

select pg_temp.try('A opens a week already marked submitted',
  $$insert into public.teacher_weeks(id, employee_id, week_start, status, submitted_at)
    values ('9000000c-0000-0000-0000-00000000000c','1111aaaa-0000-0000-0000-00000000000a','2026-10-05','submitted', now())$$);

select pg_temp.try('A opens a week carrying a money figure',
  $$insert into public.teacher_weeks(id, employee_id, week_start, frozen_total_cents)
    values ('9000000d-0000-0000-0000-00000000000d','1111aaaa-0000-0000-0000-00000000000a','2026-10-12', 99999)$$);

select pg_temp.try('A adds a class to her own open week',
  $$insert into public.teacher_class_entries(id, teacher_week_id, course_id, campus, class_date, start_time_et)
    values ('e000000a-0000-0000-0000-00000000000a','9000000a-0000-0000-0000-00000000000a',
            'cccc0000-0000-0000-0000-00000000000c','virtual','2026-09-28','09:00')$$);

select pg_temp.try('A puts a child on her own class',
  $$insert into public.teacher_class_students(entry_id, student_id)
    values ('e000000a-0000-0000-0000-00000000000a','5555000a-0000-0000-0000-00000000000a')$$);

select pg_temp.try('A files an extra claim under B''s employee id',
  $$insert into public.teacher_extra_claims(teacher_week_id, employee_id, claim_month, kind, quantity)
    values ('9000000a-0000-0000-0000-00000000000a','2222bbbb-0000-0000-0000-00000000000b','2026-09-01','coaching_session',1)$$);

select pg_temp.rows('A reading teacher_weeks', 'select count(*) from public.teacher_weeks');

-- A tries to write a money figure onto her own open week (update returns 0 rows if refused)
do $$
declare n integer;
begin
  update public.teacher_weeks set frozen_total_cents = 50000
   where id = '9000000a-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  raise notice 'A writing frozen_total_cents on her OWN week: % row(s) changed', n;
exception when others then
  raise notice 'A writing frozen_total_cents on her OWN week: REFUSED (%)', left(sqlerrm, 40);
end $$;

-- A submits her week
do $$
declare n integer;
begin
  update public.teacher_weeks set status = 'submitted', submitted_at = now()
   where id = '9000000a-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  raise notice 'A submitting her own week: % row(s) changed', n;
end $$;

select pg_temp.try('A adds a class AFTER submitting',
  $$insert into public.teacher_class_entries(teacher_week_id, course_id, campus, class_date, start_time_et)
    values ('9000000a-0000-0000-0000-00000000000a','cccc0000-0000-0000-0000-00000000000c','virtual','2026-09-29','10:00')$$);

do $$
declare n integer;
begin
  update public.teacher_weeks set kooky_note = 'let me back in'
   where id = '9000000a-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  raise notice 'A editing her week AFTER submitting: % row(s) changed', n;
end $$;

-- ============ TEACHER B ============
reset role; set role tester;
set "app.uid" = 'bbbb0000-0000-0000-0000-00000000000b';
select pg_temp.rows('B reading teacher_weeks (A has one)', 'select count(*) from public.teacher_weeks');
select pg_temp.rows('B reading teacher_class_entries', 'select count(*) from public.teacher_class_entries');
select pg_temp.rows('B reading teacher_class_students', 'select count(*) from public.teacher_class_students');

-- ============ DANNI ============
set "app.uid" = 'dddd0000-0000-0000-0000-00000000000d';
select pg_temp.rows('Danni reading teacher_weeks', 'select count(*) from public.teacher_weeks');
select pg_temp.rows('Danni reading teacher_class_entries', 'select count(*) from public.teacher_class_entries');
select pg_temp.try('Danni assigns a campus',
  $$insert into public.teacher_campus_assignments(employee_id, campus)
    values ('1111aaaa-0000-0000-0000-00000000000a','virtual')$$);

-- ============ HEATHER (SCHOOL_LEADER) ============
set "app.uid" = 'eeee0000-0000-0000-0000-00000000000e';
select pg_temp.rows('Heather reading teacher_weeks', 'select count(*) from public.teacher_weeks');
select pg_temp.rows('Heather reading teacher_class_entries', 'select count(*) from public.teacher_class_entries');
select pg_temp.rows('Heather reading teacher_class_students', 'select count(*) from public.teacher_class_students');
select pg_temp.rows('Heather reading teacher_extra_claims', 'select count(*) from public.teacher_extra_claims');
select pg_temp.try('Heather assigns a campus',
  $$insert into public.teacher_campus_assignments(employee_id, campus)
    values ('2222bbbb-0000-0000-0000-00000000000b','hs')$$);

-- ============ A, reading her own campus assignment ============
set "app.uid" = 'aaaa0000-0000-0000-0000-00000000000a';
select pg_temp.rows('A reading teacher_campus_assignments (hers only)',
  'select count(*) from public.teacher_campus_assignments');

-- ============ NOBODY SIGNED IN ============
set "app.uid" = '';
select pg_temp.rows('a signed-out request reading teacher_weeks',
  'select count(*) from public.teacher_weeks');
reset role;
