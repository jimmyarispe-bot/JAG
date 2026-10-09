-- 476_every_staff_member_gets_a_number_too_2026_10_02.sql
--
-- Jimmy, 2 October 2026, straight after the student numbers: "and every
-- staff member too".
--
-- STAFF WERE WORSE OFF THAN THE CHILDREN. employees.employee_number has
-- existed since the baseline, nullable, unique within a school - and nothing
-- in the platform has ever generated one. The only place it is written is a
-- text box on the HR form that a person types, or does not. Children at least
-- had generate_student_number(); staff had no generator at all.
--
-- E-000001, DELIBERATELY NOT 000001. Jimmy's call, 2 October. A child is
-- 000024 and a staff member is E-000024, so nobody can confuse the two on a
-- payroll line, in an email, or said out loud across an office. It costs
-- nothing today and cannot be retrofitted once numbers are in use.
--
-- SEQUENTIAL WITHIN A SCHOOL, like the student numbers, because the unique
-- constraint is (school_id, employee_number) and because a number that means
-- something at one campus should not collide with another's.
--
-- SAME SHAPE AS 475, AND FOR THE SAME REASON. A backfill alone is what 363
-- did for students on 14 September, and 464 undid it three weeks later. The
-- guarantee goes on the table, not on whichever code path remembers.
--
--   1. generate_employee_number(school_id) - new, mirrors the student one.
--   2. A BEFORE INSERT trigger on employees.
--   3. A number already typed in is KEPT, untouched. The HR form still works
--      and an existing numbering scheme is never overridden.
--   4. Backfills every ACTIVE employee who has none.
--
-- INACTIVE STAFF ARE LEFT ALONE, as the inactive children were. Somebody who
-- has left does not need a number issued today.
--
-- An employee with no school_id is allowed through unnumbered rather than
-- refused - a staff record with no campus is a problem to see, not one to
-- hide behind a failed insert.
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. The generator
-- ---------------------------------------------------------------------------

create or replace function public.generate_employee_number(p_school_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  /* The digits out of E-000007 are what count, so a number typed by hand
     without the prefix still moves the sequence along rather than being
     silently handed out twice. */
  select coalesce(max(
           nullif(regexp_replace(coalesce(employee_number, ''), '\D', '', 'g'), '')::integer
         ), 0) + 1
    into v_next
    from public.employees
   where school_id = p_school_id
     and employee_number is not null;

  if v_next is null or v_next < 1 then
    v_next := 1;
  end if;

  return 'E-' || lpad(v_next::text, 6, '0');
end;
$$;

comment on function public.generate_employee_number(uuid) is
  'E-000001 upward, sequential within a school. The E prefix is deliberate: '
  'a child is 000024, a staff member is E-000024, and the two must never be '
  'mistaken for each other on a payroll line. Jimmy, 2 October 2026.';

-- ---------------------------------------------------------------------------
-- 2. The trigger
-- ---------------------------------------------------------------------------

create or replace function public.employees_assign_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(btrim(coalesce(new.employee_number, '')), '') is not null then
    return new;   -- typed on the HR form, or carried by an import. Kept.
  end if;

  if new.school_id is null then
    return new;   -- no campus, no sequence. Visible rather than blocked.
  end if;

  new.employee_number := public.generate_employee_number(new.school_id);
  return new;
end;
$$;

drop trigger if exists employees_assign_number_trg on public.employees;

create trigger employees_assign_number_trg
  before insert on public.employees
  for each row
  execute function public.employees_assign_number();

-- ---------------------------------------------------------------------------
-- 3. Everyone on staff today
-- ---------------------------------------------------------------------------

do $$
declare
  r       record;
  v_num   text;
  v_count int := 0;
begin
  for r in
    select e.id, e.school_id,
           coalesce(
             nullif(trim(coalesce(ep.first_name,'') || ' ' || coalesce(ep.last_name,'')), ''),
             nullif(trim(coalesce(to_jsonb(u) ->> 'full_name','')), ''),
             coalesce(to_jsonb(u) ->> 'email',''),
             '(no name)')                                        as person,
           coalesce(sc.name, '(no school)')                       as school
      from public.employees e
      left join public.employee_profiles ep on ep.employee_id = e.id
      left join public.users u              on u.id = e.user_id
      left join public.schools sc           on sc.id = e.school_id
     where e.employment_status = 'active'
       and nullif(btrim(coalesce(e.employee_number, '')), '') is null
       and e.school_id is not null
     order by sc.name, person
  loop
    v_num := public.generate_employee_number(r.school_id);

    update public.employees
       set employee_number = v_num,
           updated_at      = now()
     where id = r.id;

    v_count := v_count + 1;
    raise notice '% (%) -> %', r.person, r.school, v_num;
  end loop;

  if v_count = 0 then
    raise notice 'Every active staff member already had a number. Only the trigger is new.';
  else
    raise notice '% staff member(s) numbered. From here the trigger does it.', v_count;
  end if;
end $$;

commit;

notify pgrst, 'reload schema';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT every school to read 0 in without_a_number.
--
-- no_school is printed separately: those are staff records with no campus,
-- which this cannot number and which are worth looking at on their own.

select coalesce(sc.name, '(no school)')                                     as school,

       count(*) filter (where e.employment_status = 'active')               as active_staff,

       count(*) filter (
         where e.employment_status = 'active'
           and nullif(btrim(coalesce(e.employee_number,'')), '') is null
           and e.school_id is not null)                                     as without_a_number,

       count(*) filter (
         where e.employment_status = 'active'
           and e.school_id is null)                                         as no_school,

       min(e.employee_number) filter (where e.employee_number is not null)  as lowest,
       max(e.employee_number) filter (where e.employee_number is not null)  as highest

  from public.employees e
  left join public.schools sc on sc.id = e.school_id
 group by 1
 order by 1;
