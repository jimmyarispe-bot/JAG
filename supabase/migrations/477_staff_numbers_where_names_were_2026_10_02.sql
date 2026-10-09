-- 477_staff_numbers_where_names_were_2026_10_02.sql
--
-- THIS WRITES. Thirteen staff records, one column, and it keeps what it
-- replaces.
--
-- WHAT 476 FOUND. The trigger went in and numbered nobody, because every
-- active employee already had something in employee_number - a NAME.
-- Craig.Mann. Peter.Alouise. Casandra.Manghu. ZZZ.Test.Teacher. A column
-- called number, full of names, which is why no staff member has a number
-- and why 476's backfill correctly skipped all thirteen.
--
-- WHY REPLACING THEM IS SAFE, CHECKED RATHER THAN ASSUMED:
--
--   employee_number is NEVER RENDERED on any screen - nothing in
--   src/components or src/app reads it.
--   employee_number is NEVER A LOOKUP - nothing anywhere does
--   .eq("employee_number", ...).
--   It is written in exactly one place, src/lib/hr/actions.ts, from a text
--   box on the HR form.
--
--   The real names live in employee_profiles and users, both verified
--   correct this morning by migration 467. So this column is holding a
--   duplicate of information stored properly elsewhere.
--
-- THE OLD STRING IS KEPT ANYWAY, in a new column. "Nothing reads it" is a
-- statement about today's code, not about a spreadsheet somebody keeps or a
-- system nobody has mentioned. Casandra.Manghu is also a third spelling of
-- Cassandra Manghum, and a record of where that came from is worth four
-- bytes.
--
-- WHY THIS MATTERS AT ALL. Jimmy, 2 October: "why not just give each student
-- a unique number so we can reference the numbers instead". Ten children
-- ended up with two records each today because every lookup went through a
-- name. Staff were one spelling away from the same thing: 467 had to
-- reconcile Manghun against Manghum and Marissa against Marisa.
--
-- E-000001 upward, sequential within a school, distinct from a child's
-- 000024 so the two can never be confused. Jimmy's call.
--
-- Safe to re-run: a row already carrying an E- number is left alone.

begin;

-- ---------------------------------------------------------------------------
-- 1. Somewhere to put what was there
-- ---------------------------------------------------------------------------

alter table public.employees
  add column if not exists legacy_employee_reference text;

comment on column public.employees.legacy_employee_reference is
  'What employee_number held before 477 replaced it with a real number on '
  '2 October 2026 - usually a name such as Craig.Mann. Kept because nothing '
  'in this codebase read it, which is not the same as nothing anywhere '
  'reading it. Not used by the platform.';

-- ---------------------------------------------------------------------------
-- 2. The swap
-- ---------------------------------------------------------------------------

do $$
declare
  r       record;
  v_num   text;
  v_count int := 0;
begin
  for r in
    select e.id, e.school_id,
           coalesce(nullif(btrim(e.employee_number), ''), '(empty)')    as was,
           coalesce(
             nullif(trim(coalesce(ep.first_name,'') || ' ' || coalesce(ep.last_name,'')), ''),
             nullif(trim(coalesce(to_jsonb(u) ->> 'full_name','')), ''),
             '(no name on file)')                                       as person,
           coalesce(sc.name, '(no school)')                             as school
      from public.employees e
      left join public.employee_profiles ep on ep.employee_id = e.id
      left join public.users u              on u.id = e.user_id
      left join public.schools sc           on sc.id = e.school_id
     where e.school_id is not null
       and coalesce(e.employee_number, '') !~ '^E-\d{6}$'    -- not already done
     order by sc.name, person
  loop
    v_num := public.generate_employee_number(r.school_id);

    update public.employees
       set legacy_employee_reference =
             coalesce(legacy_employee_reference, nullif(btrim(employee_number), '')),
           employee_number = v_num,
           updated_at      = now()
     where id = r.id;

    v_count := v_count + 1;
    raise notice '% (%): "%" -> %', r.person, r.school, r.was, v_num;
  end loop;

  if v_count = 0 then
    raise notice 'Everybody already had an E- number. Nothing changed.';
  else
    raise notice '% staff member(s) numbered. The old strings are in legacy_employee_reference.', v_count;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT every active staff member with an E-000001-style number, their old
-- string beside it, and their real name from the profile.
--
-- ZZZ.Test.Teacher will appear. It is a test account Jimmy is keeping; it is
-- numbered like everyone else rather than skipped, so a count of staff is
-- never quietly one short.

select coalesce(sc.name, '(no school)')                                 as school,
       e.employee_number                                                as number,
       coalesce(
         nullif(trim(coalesce(ep.first_name,'') || ' ' || coalesce(ep.last_name,'')), ''),
         nullif(trim(coalesce(to_jsonb(u) ->> 'full_name','')), ''),
         '(no name on file)')                                           as person,
       coalesce(e.legacy_employee_reference, '(was empty)')             as used_to_say,
       e.employment_status                                              as status
  from public.employees e
  left join public.employee_profiles ep on ep.employee_id = e.id
  left join public.users u              on u.id = e.user_id
  left join public.schools sc           on sc.id = e.school_id
 order by school, number;
