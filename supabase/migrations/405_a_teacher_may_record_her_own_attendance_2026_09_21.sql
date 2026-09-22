-- ===========================================================================
-- A TEACHER MAY RECORD HER OWN ATTENDANCE  -  405  -  2026-09-21
--
-- THE SAME FAULT, A THIRD TIME. session_attendance_records_all, written in
-- migration 083, permits a row when:
--
--     can_access_student_record(student_id)
--     and (has_permission('scheduling.attendance')
--          or has_permission('students.attendance'))
--
-- The permission half is fine - TEACHER holds both keys. The other half is
-- school-scoped, exactly like student_enrollments_all (fixed in 402/403) and
-- exactly like the students table itself (worked around in 404).
--
-- So a teacher taking attendance would have written rows for the children at
-- her own school and silently written nothing for the campus children from FL
-- and GA. No error. A register that is quietly missing a third of the class.
--
-- attendance has been empty since migration 082 shipped in the summer, against
-- 1,025 classes already taught, so this has never bitten anybody yet. It would
-- have bitten on the first day of use.
--
-- THE FIX, SAME SHAPE AS THE OTHER TWO. A teacher may record attendance for a
-- session SHE TEACHES. Additive - Postgres ORs permissive policies, so the 083
-- policy keeps serving school leaders and anyone else it already served.
--
-- teaches_instructional_session() rather than teaches_course_section(),
-- because attendance hangs off the SESSION. It accepts either the instructor
-- recorded on the session itself, or the section's usual instructor - so a
-- guest covering a class can take its register, which is the whole point of
-- the work coming next.
--
-- STABLE and SECURITY DEFINER for the reason 403 taught us: an EXISTS clause
-- reading other tables from inside a policy makes Postgres evaluate THEIR row
-- level security too, per row, and that timed out a teacher's timesheet.
--
-- THIS FILE CHANGES NO MONEY. Recording who was in the room is separate from
-- pricing the class, and stays separate tonight. The rule Jimmy set - pay the
-- enrolled roster unless nobody came at all - lands in its own migration once
-- real attendance has been seen to write correctly. A new write path and a new
-- pay rule in one change is how you end up unable to tell which one is wrong.
-- ===========================================================================

begin;

create or replace function public.teaches_instructional_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.instructional_sessions i
    left join public.course_sections cs on cs.id = i.course_section_id
    left join public.employees e_session on e_session.id = i.instructor_employee_id
    left join public.employees e_section on e_section.id = cs.instructor_employee_id
    where i.id = p_session_id
      and (e_session.user_id = auth.uid() or e_section.user_id = auth.uid())
  );
$$;

comment on function public.teaches_instructional_session(uuid) is
  'Does the caller teach this class - as the instructor recorded on the session, '
  'or as the section''s usual instructor. STABLE and SECURITY DEFINER so a policy '
  'can call it without re-entering RLS on instructional_sessions and '
  'course_sections once per row. Added 21 September 2026.';

revoke all on function public.teaches_instructional_session(uuid) from public;
grant execute on function public.teaches_instructional_session(uuid) to authenticated;

drop policy if exists session_attendance_teacher_own_session on public.session_attendance_records;

create policy session_attendance_teacher_own_session
on public.session_attendance_records
for all
to authenticated
using (public.teaches_instructional_session(instructional_session_id))
with check (public.teaches_instructional_session(instructional_session_id));

comment on policy session_attendance_teacher_own_session on public.session_attendance_records is
  'A teacher may record attendance for a class she teaches. The 083 policy is '
  'school-scoped through can_access_student_record(), so without this she would '
  'have silently written no row at all for a campus child from FL or GA - a '
  'register quietly missing part of the class.';

commit;

-- ===========================================================================
-- VERIFY.
-- ===========================================================================

-- 1. Both policies present. EXPECT TWO ROWS.
select
  '1. policies on session_attendance_records' as check,
  policyname                                   as detail,
  cmd                                          as extra
from pg_policies
where schemaname = 'public'
  and tablename = 'session_attendance_records'

union all

-- 2. The function, stable and security definer. EXPECT ONE ROW.
select
  '2. the function',
  p.proname,
  'volatility=' || p.provolatile::text
    || '  security_definer=' || p.prosecdef::text
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'teaches_instructional_session'

union all

-- 3. Attendance rows recorded so far. Expected to still be ZERO - nothing in
--    this file writes attendance. It only makes it possible.
select
  '3. attendance rows',
  'session_attendance_records',
  count(*)::text
from public.session_attendance_records

order by 1, 2;

-- 4. CANNOT BE RUN HERE. The function answers for auth.uid(); the SQL editor
--    is the service role and has none. The test is the screen, once the code
--    that writes attendance ships.
