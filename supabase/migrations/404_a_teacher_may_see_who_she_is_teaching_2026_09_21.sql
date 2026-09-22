-- ===========================================================================
-- A TEACHER MAY SEE WHO SHE IS TEACHING  -  404  -  2026-09-21
--
-- WHY. The timesheet says "4 on roster" and nothing else. A teacher cannot
-- check a number she cannot see behind. If she could have seen "DigitLab:
-- nobody" beside a class she knows has four children in it, the fault found
-- today - 33 of 42 sections underpaying - would have been reported in its
-- first week instead of waiting for somebody to notice a zero.
--
-- WHY NOT JUST WIDEN can_access_student_record(). That function guards the
-- whole students row, which carries date of birth, address, family links and
-- everything classified under FERPA. A teacher needs her pupils' NAMES on a
-- pay screen. She does not need their records, and certainly not the records
-- of children at another school.
--
-- So: names only, for children she actually teaches, and nothing else. No
-- table policy is widened by this file.
--
-- SECURITY DEFINER because the whole point is to answer for children the
-- caller cannot read directly. It is safe because the function decides for
-- itself who the caller is - auth.uid() - and returns rows only where that
-- person teaches a section the child is enrolled in. A caller cannot ask
-- about a child they do not teach; passing somebody else's id returns
-- nothing.
--
-- IT RETURNS A NAME AND AN ID. Not a row, not a record, not an address.
-- ===========================================================================

begin;

create or replace function public.student_names_for_my_classes(p_student_ids uuid[])
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    s.id,
    coalesce(
      nullif(trim(coalesce(s.first_name, '') || ' ' || coalesce(s.last_name, '')), ''),
      'Unnamed student'
    ) as display_name
  from public.students s
  join public.student_enrollments se on se.student_id = s.id
  where s.id = any(p_student_ids)
    and se.enrollment_status in ('enrolled', 'completed')
    and (
      exists (
        select 1
        from public.course_sections cs
        join public.employees e on e.id = cs.instructor_employee_id
        where cs.id = se.course_section_id
          and e.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.instructional_sessions i
        join public.employees e on e.id = i.instructor_employee_id
        where i.course_section_id = se.course_section_id
          and e.user_id = auth.uid()
      )
    );
$$;

comment on function public.student_names_for_my_classes(uuid[]) is
  'Names, and nothing else, for children the caller teaches - as the section '
  'instructor or as the instructor on one of its sessions, which covers guest '
  'teaching. SECURITY DEFINER so it can answer for a child at another school, '
  'whose full record the teacher still cannot read. Added 21 September 2026 so '
  'a teacher can check the roster count on her own timesheet instead of being '
  'asked to trust it.';

revoke all on function public.student_names_for_my_classes(uuid[]) from public;
grant execute on function public.student_names_for_my_classes(uuid[]) to authenticated;

commit;

-- ===========================================================================
-- VERIFY.
-- ===========================================================================

-- 1. The function exists, stable, security definer. EXPECT ONE ROW.
select
  '1. the function'                     as check,
  p.proname                             as detail,
  'volatility=' || p.provolatile::text
    || '  security_definer=' || p.prosecdef::text  as extra
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'student_names_for_my_classes'

union all

-- 2. Who it should return for Jessica's three sections, as service role.
--    These are the names her screen should show behind 4, 6 and 1.
select
  '2. should appear behind ' || cs.section_code,
  coalesce(st.first_name || ' ' || st.last_name, '(no name)'),
  ''
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
join public.students st on st.id = se.student_id
where cs.section_code like 'VEDDER%'
  and se.enrollment_status in ('enrolled', 'completed')

order by 1, 2;

-- 3. CANNOT BE RUN HERE. The function answers for auth.uid(), and the SQL
--    editor has no auth.uid() - it is the service role. Running
--    student_names_for_my_classes() here returns NOTHING, and that is correct
--    behaviour, not a failure. The only test is the screen.
