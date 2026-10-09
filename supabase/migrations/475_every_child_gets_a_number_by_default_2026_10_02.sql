-- 475_every_child_gets_a_number_by_default_2026_10_02.sql
--
-- Jimmy, 2 October 2026: "are we assigning every student who comes into the
-- jag a student id#?"
--
-- NO. AND THIS IS THE SECOND TIME.
--
-- public.generate_student_number(school_id) has existed since migration 078.
-- On 14 September migration 363 found 75 of 78 students with no number and
-- backfilled every one of them. It fixed the symptom and left the cause: the
-- generator is still called from exactly ONE place in the whole codebase,
-- src/lib/sis/conversion.ts, the admissions-to-SIS conversion.
--
-- So a child who arrives through admissions gets a number. A child created
-- any other way - a bulk import, a migration, a hand-written insert - does
-- not, and nothing anywhere notices. Migration 464 created children this
-- morning and not one of them got a number. That is how the ten duplicate
-- records were spotted at all.
--
-- A BACKFILL IS NOT A FIX. 363's work was undone by the next import, as it
-- was always going to be. This closes the hole where it actually is: the
-- table, not the one code path that happens to remember.
--
-- WHAT THIS DOES
--
--   1. A BEFORE INSERT trigger on public.students. A row arriving with no
--      student number, at a known school, is given the next one. Nothing
--      else has to remember, including the next migration written at speed
--      on a Friday.
--
--   2. A row that ARRIVES WITH A NUMBER KEEPS IT, untouched. An import
--      carrying the school's own numbering is not overridden, and re-running
--      an old migration cannot renumber a child.
--
--   3. Backfills every ACTIVE child who has none today.
--
-- INACTIVE CHILDREN ARE DELIBERATELY LEFT WITHOUT ONE. The ten empty records
-- that 473 switched off are not children, they are debris, and giving them
-- numbers would spend numbers on them and make them look like records worth
-- keeping. A child who is reactivated later gets one then - by hand, or by
-- the trigger if the row is recreated.
--
-- A NOTE ON TWO AT ONCE. generate_student_number takes the highest number at
-- that school and adds one. Two children inserted at the same instant at the
-- same school could both be handed the same number, and the unique index
-- would refuse the second - an error, not a duplicate. For a school enrolling
-- one child at a time that is the right trade; a sequence per school would be
-- more machinery than the problem deserves.
--
-- Safe to re-run: the trigger is replaced, and a child who already has a
-- number is skipped.

begin;

-- ---------------------------------------------------------------------------
-- 1. The trigger
-- ---------------------------------------------------------------------------

create or replace function public.students_assign_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /* Already numbered, by an import or by the conversion. Left alone. */
  if nullif(btrim(coalesce(new.student_number, '')), '') is not null then
    return new;
  end if;

  /* No school means no sequence to draw from. The row is allowed through
     rather than refused - a child with no campus is somebody else's problem
     to fix, and blocking the insert here would hide it. */
  if new.school_id is null then
    return new;
  end if;

  new.student_number := public.generate_student_number(new.school_id);
  return new;
end;
$$;

comment on function public.students_assign_number() is
  'Every child gets a number, whatever created the row. Migration 363 '
  'backfilled 75 children on 14 September and left the cause alone; 464 '
  'recreated the problem on 2 October. The generator is called from one '
  'place in the application, so the guarantee belongs on the table.';

drop trigger if exists students_assign_number_trg on public.students;

create trigger students_assign_number_trg
  before insert on public.students
  for each row
  execute function public.students_assign_number();

-- ---------------------------------------------------------------------------
-- 2. Everyone currently without one
-- ---------------------------------------------------------------------------

do $$
declare
  r       record;
  v_num   text;
  v_count int := 0;
begin
  for r in
    select s.id, s.school_id,
           trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')) as child,
           coalesce(sc.name, '(no school)') as school
      from public.students s
      left join public.schools sc on sc.id = s.school_id
     where coalesce(s.status,'') = 'active'
       and nullif(btrim(coalesce(s.student_number, '')), '') is null
       and s.school_id is not null
     order by sc.name, s.last_name, s.first_name
  loop
    v_num := public.generate_student_number(r.school_id);

    update public.students
       set student_number = v_num,
           updated_at     = now()
     where id = r.id;

    v_count := v_count + 1;
    raise notice '% (%) -> %', r.child, r.school, v_num;
  end loop;

  if v_count = 0 then
    raise notice 'Every active child already had a number. Only the trigger is new.';
  else
    raise notice '% active child(ren) numbered. From here the trigger does it.', v_count;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT every school to read 0 in without_a_number.
--
-- inactive_without_a_number is printed but is NOT a fault - those are the
-- empty records 473 switched off, and they are meant to stay unnumbered.

select coalesce(sc.name, '(no school)')                                  as school,

       count(*) filter (where coalesce(s.status,'') = 'active')           as active_children,

       count(*) filter (
         where coalesce(s.status,'') = 'active'
           and nullif(btrim(coalesce(s.student_number,'')), '') is null)  as without_a_number,

       count(*) filter (
         where coalesce(s.status,'') <> 'active'
           and nullif(btrim(coalesce(s.student_number,'')), '') is null)  as inactive_without_a_number

  from public.students s
  left join public.schools sc on sc.id = s.school_id
 group by 1
 order by 1;
