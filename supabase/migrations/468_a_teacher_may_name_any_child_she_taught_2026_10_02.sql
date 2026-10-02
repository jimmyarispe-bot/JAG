-- 468_a_teacher_may_name_any_child_she_taught_2026_10_02.sql
--
-- Peter Alouise, 2 October 2026: "Most of my kids are not on the list to be
-- assigned into my classes."
--
-- WHAT HE WAS SEEING. Nine names, all AV. No HS, FL or GA group at all. Nine
-- is exactly The Academy Virtual's active roll. He should have seen 77.
--
-- WHERE THE OTHER SIXTY-EIGHT WENT. Not into an error. listStudentOptions()
-- in week-store.ts has no school filter in it whatsoever - it asks for every
-- student and keeps the active ones. The cut happens underneath, in row-level
-- security, and it returns fewer rows and no message. The same shape as every
-- other fault this fortnight: the system knows, and no person is told.
--
--   students_select_school_scoped (079)
--     -> can_access_student_record(id)        (090)
--       -> can_access_school(s.school_id)     (076)
--         -> for a TEACHER: true only at a school she is assigned to.
--
-- THAT POLICY IS NOT WRONG AND IS NOT BEING CHANGED. It was written in 2025
-- for the student records system, where a campus seeing only its own children
-- is correct and careful, and it still governs every other screen that reads
-- a child's record. Nothing below touches it.
--
-- WHAT IS NEW IS THE QUESTION BEING ASKED. The teacher's week screen, specced
-- 2 October: "Every child in the network appears, grouped by their school -
-- AV, HS, FL, GA." Virtual teachers teach children enrolled at FL, GA and HS.
-- A teacher who cannot name the child she taught logs a class with nobody on
-- it, and a class with nobody on it pays nothing. The fault costs her money.
--
-- SO THIS OPENS A DOOR THE EXACT WIDTH OF THE QUESTION, and no wider.
--
--   It returns FOUR COLUMNS: id, first name, last name, school name. Not date
--   of birth, not an address, not a guardian, not a note, not a grade, not a
--   programme, not a status history. A teacher gets the names she needs to
--   say who was in her class and learns nothing else about any child.
--
--   It returns ACTIVE CHILDREN ONLY. The 43 inactive are not somebody a class
--   can be logged against.
--
--   IT CHECKS WHO IS ASKING. Security definer means it runs past RLS, so the
--   check has to be inside it rather than around it. A caller holding none of
--   the named roles gets zero rows - the same answer they get today.
--
-- WHY A FUNCTION RATHER THAN A POLICY. A policy saying "a teacher may select
-- any active student" would open the whole students table - every column, to
-- every query, for ever. This opens four columns to one question. If somebody
-- later needs a fifth, they have to come back here and say why.

begin;

create or replace function public.students_a_teacher_may_log()
returns table (
  student_id  uuid,
  first_name  text,
  last_name   text,
  school_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id,
         coalesce(to_jsonb(s) ->> 'first_name', '')::text,
         coalesce(to_jsonb(s) ->> 'last_name',  '')::text,
         coalesce(sc.name, '')::text
    from public.students s
    left join public.schools sc on sc.id = s.school_id
   where coalesce(s.status, '') = 'active'
     and (
       /* The thirteen who file a week. */
       coalesce(has_role('TEACHER'), false)
       /* The people who read and correct a week: Heather, Nina, Danni, Jimmy. */
       or coalesce(has_role('SCHOOL_LEADER'), false)
       or coalesce(has_role('EXECUTIVE_DIRECTOR'), false)
       or coalesce(has_role('FOUNDER'), false)
     )
   order by coalesce(to_jsonb(s) ->> 'last_name', ''),
            coalesce(to_jsonb(s) ->> 'first_name', '');
$$;

comment on function public.students_a_teacher_may_log() is
  'The student grid on the teacher week screen, and nothing else. Four '
  'columns - id, first name, last name, school - for active children only. '
  'Security definer because students_select_school_scoped limits a teacher '
  'to her own campus, which is right for student records and wrong for this '
  'one question: Virtual teachers teach children enrolled at FL, GA and HS. '
  'Peter Alouise, 2 October 2026: "Most of my kids are not on the list to be '
  'assigned into my classes." Do not widen the column list without saying '
  'here why.';

revoke all on function public.students_a_teacher_may_log() from public;
grant execute on function public.students_a_teacher_may_log() to authenticated;

commit;

notify pgrst, 'reload schema';

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT 77 rows: FL 35, GA 22, HS 11, AV 9.
--
-- Run as Jimmy this returns everything because FOUNDER is in the list. The
-- check that actually matters is Peter signing in and seeing four groups
-- rather than one - this only proves the function exists and counts right.

select school_name, count(*) as children
  from public.students_a_teacher_may_log()
 group by 1
 order by 1;
