-- ===========================================================================
-- 75 OF 78 STUDENTS HAVE NO STUDENT NUMBER
-- 14 September 2026
-- ===========================================================================
--
-- "Records incomplete: 76" on the Student Success dashboard, against 78 active
-- students. 97% of the roster, each with a work item telling somebody to open a
-- profile and fill in missing fields.
--
-- It is not 76 messy records. It is one missing field, three times over:
--
--     no student number   75
--     no date of birth    11
--     no grade level       2
--     missing all three     1
--     complete              2
--
-- THE GENERATOR EXISTS AND HAS ALWAYS EXISTED
--
-- public.generate_student_number(school_id), from migration 078. Six digits,
-- zero-padded, sequential within a school: lpad(v_next::text, 6, '0').
--
-- It is called from exactly ONE place in the codebase — src/lib/sis/conversion.ts,
-- the admissions -> SIS conversion. Every student created any other way (the bulk
-- import, hand-written SQL like 313) never passes through it and never gets a
-- number.
--
-- This is the same shape as the admissions tasks fixed earlier today: a function
-- that works perfectly and is only reachable through one door, while most of the
-- traffic comes through another. That is now twice in one day, in two unrelated
-- modules, which suggests it is a habit of this codebase rather than a
-- coincidence.
--
-- WHAT THIS DOES
--
-- Assigns a number to every active student without one, per school, continuing
-- from the highest number that school already uses. Ordered by created_at then
-- id, so the earliest student gets the lowest number and a re-run produces
-- exactly the same assignment.
--
-- AND FIXES THE GENERATOR ITSELF
--
-- generate_student_number is SECURITY INVOKER. It computes the next number by
-- reading max(student_number) from public.students under the caller's RLS. A
-- caller who cannot see every student at that school sees a lower maximum and is
-- handed a number that is already taken — silently, with no error, producing two
-- students sharing an identifier.
--
-- Nobody has hit this yet because almost nothing has a number to collide with.
-- After this migration every school has 20-30 of them, so the window opens
-- exactly as the risk becomes real. SECURITY DEFINER, same reasoning as 350.
--
-- WHAT THIS DOES NOT DO
--
-- The 11 missing dates of birth and 2 missing grade levels are real gaps, not a
-- mechanism failure, and some of those dates may be recoverable from the
-- admissions lead the student came from. Counted in the verification below;
-- fixing them is a separate piece of work with a separate judgement about where
-- the data comes from.
--
-- Idempotent: only touches rows where student_number is null.
-- ===========================================================================

begin;

with numbered as (
  select
    s.id,
    s.school_id,
    row_number() over (
      partition by s.school_id
      order by s.created_at, s.id
    ) as seq
  from public.students s
  where s.student_number is null
),
starting_point as (
  -- The highest purely-numeric number each school already uses. Schools with
  -- none start from zero, so their first student becomes 000001.
  select
    s.school_id,
    coalesce(max(nullif(regexp_replace(s.student_number, '\D', '', 'g'), '')::integer), 0) as high_water
  from public.students s
  where s.student_number ~ '^\d+$'
  group by s.school_id
)
update public.students t
set student_number = lpad((coalesce(sp.high_water, 0) + n.seq)::text, 6, '0'),
    updated_at = now()
from numbered n
left join starting_point sp on sp.school_id = n.school_id
where t.id = n.id;

commit;

-- ---------------------------------------------------------------------------
-- The generator, so the next one cannot collide.
-- ---------------------------------------------------------------------------
create or replace function public.generate_student_number(p_school_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_next integer;
begin
  select coalesce(max(
    nullif(regexp_replace(student_number, '\D', '', 'g'), '')::integer
  ), 0) + 1
  into v_next
  from public.students
  where school_id = p_school_id
    and student_number ~ '^\d+$';

  if v_next is null or v_next < 1 then
    select count(*) + 1 into v_next from public.students where school_id = p_school_id;
  end if;

  return lpad(v_next::text, 6, '0');
end;
$$;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. Per campus: how many active students, and how many still lack a number.
--    EXPECT still_without to be 0 everywhere.
select
  '1. numbers by campus' as check,
  sc.name as detail,
  count(*) filter (where s.student_number is not null)::text || ' numbered, '
    || count(*) filter (where s.student_number is null)::text || ' still without' as extra
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active'
group by sc.name

union all

-- 2. Duplicates within a school. EXPECT NOTHING. A row here means two students
--    share an identifier, which is worse than none having one.
select '2. DUPLICATE NUMBER', sc.name || ' / ' || s.student_number, count(*)::text
from public.students s
join public.schools sc on sc.id = s.school_id
where s.student_number is not null
group by sc.name, s.student_number
having count(*) > 1

union all

-- 3. What remains of "records incomplete" after this. The dashboard counted 76;
--    it should now count roughly the date-of-birth and grade-level gaps only.
select
  '3. still incomplete',
  case
    when date_of_birth is null and grade_level is null then 'no date of birth AND no grade level'
    when date_of_birth is null then 'no date of birth'
    else 'no grade level'
  end,
  count(*)::text
from public.students
where status = 'active'
  and (date_of_birth is null or grade_level is null)
group by 2

union all

-- 4. The generator is now definer, so it can see every student at a school when
--    working out the next number.
select '4. generator', p.proname, case when p.prosecdef then 'security definer' else 'SECURITY INVOKER — did not take' end
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'generate_student_number'

order by 1, 2;
