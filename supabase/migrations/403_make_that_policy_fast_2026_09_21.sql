-- ===========================================================================
-- MAKE THAT POLICY FAST  -  403  -  2026-09-21
--
-- Migration 402 was correct and unusably slow. Jessica Vedder's timesheet now
-- says "Could not price your classes: canceling statement due to statement
-- timeout" and prices nothing at all - worse than the undercount it replaced.
--
-- WHY IT WAS SLOW. The policy ran two EXISTS clauses against course_sections
-- and instructional_sessions from inside a row-level policy. Every one of
-- those reads triggers the RLS on THOSE tables in turn - can_access_school(),
-- is_assigned_to_school(), a read of user_org_assignments - and it happens per
-- enrolment row considered, per session scanned. Nested policy evaluation is
-- the expensive thing, not the row count.
--
-- THE FIX. One STABLE SECURITY DEFINER function. SECURITY DEFINER means the
-- lookups inside it do not re-enter RLS; STABLE means Postgres may evaluate it
-- once per distinct argument per statement instead of once per row. This is
-- the ordinary way to write a policy that has to consult another table.
--
-- IT LEAKS NOTHING. The function answers one question - "does the person
-- calling this teach that section?" - and returns a boolean. It takes a
-- section id the caller already has and tells them nothing they could not
-- learn by reading their own timetable. It never returns a row.
--
-- ALSO AN INDEX. instructional_sessions is looked up by course_section_id
-- here and in several hot paths; without an index that is a sequential scan
-- over every session ever scheduled.
--
-- IF THIS STILL TIMES OUT, the safe retreat is to drop the policy entirely:
--     drop policy student_enrollments_teacher_own_class on public.student_enrollments;
-- That returns the screen to yesterday's behaviour - undercounting, but
-- working - rather than leaving a teacher with no timesheet at all. Do not
-- leave it broken overnight on the week pay goes live.
-- ===========================================================================

begin;

-- 1. The lookup, once, outside RLS.
create or replace function public.teaches_course_section(p_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_sections cs
    join public.employees e on e.id = cs.instructor_employee_id
    where cs.id = p_section_id
      and e.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.instructional_sessions i
    join public.employees e on e.id = i.instructor_employee_id
    where i.course_section_id = p_section_id
      and e.user_id = auth.uid()
  );
$$;

comment on function public.teaches_course_section(uuid) is
  'Does the caller teach this section - as its instructor, or as the '
  'instructor on one of its sessions, which covers guest teaching. STABLE and '
  'SECURITY DEFINER so a policy can call it without re-entering RLS on '
  'course_sections and instructional_sessions once per row. Added 21 September '
  '2026 after migration 402 timed out a teacher''s timesheet.';

revoke all on function public.teaches_course_section(uuid) from public;
grant execute on function public.teaches_course_section(uuid) to authenticated;

-- 2. The index the lookup needs.
create index if not exists idx_instructional_sessions_section_instructor
  on public.instructional_sessions (course_section_id, instructor_employee_id);

-- 3. The same policy, now cheap.
drop policy if exists student_enrollments_teacher_own_class on public.student_enrollments;

create policy student_enrollments_teacher_own_class
on public.student_enrollments
for select
using (public.teaches_course_section(course_section_id));

comment on policy student_enrollments_teacher_own_class on public.student_enrollments is
  'A teacher may read the enrolments of a class she teaches. Pay was being '
  'computed from whatever rows the teacher happened to be allowed to read, and '
  'a child at another school was silently worth nothing - 33 of 42 sections '
  'were affected.';

commit;

-- ===========================================================================
-- VERIFY. The first three run here. The fourth is the only one that matters.
-- ===========================================================================

-- 1. Three policies, the old two untouched. EXPECT THREE ROWS.
select
  '1. policies'                        as check,
  policyname                            as detail,
  cmd                                   as extra
from pg_policies
where schemaname = 'public'
  and tablename = 'student_enrollments'

union all

-- 2. The function exists and is the right shape. EXPECT one row reading
--    's' for stable and true for security definer.
select
  '2. the function',
  p.proname,
  'volatility=' || p.provolatile::text || '  security_definer=' || p.prosecdef::text
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'teaches_course_section'

union all

-- 3. The index is there.
select
  '3. the index',
  indexname,
  ''
from pg_indexes
where schemaname = 'public'
  and tablename = 'instructional_sessions'
  and indexname = 'idx_instructional_sessions_section_instructor'

order by 1, 2;

-- 4. CANNOT BE RUN HERE, AND IT IS THE ONLY REAL TEST. Sign in as Jessica
--    Vedder, open /dashboard/teacher/timesheets, hard refresh.
--
--    Monday should read:
--      1:00 PM  DigitLab      4 on roster   $35.00
--      2:00 PM  Earthology    6 on roster   $45.00
--      5:00 PM  Tutoring      1 on roster   $20.00
--      Monday total                        $100.00
--
--    If it still times out, drop the policy - the line is in the header
--    above - and tell me. A teacher with no timesheet is worse than a
--    teacher with a wrong one, four days before she has to submit it.
