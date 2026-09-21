-- ===========================================================================
-- A TEACHER MAY SEE THE CHILDREN IN HER OWN CLASS  -  402  -  2026-09-21
--
-- THE FAULT. The pay calculator has been running inside the teacher's own
-- permissions, and silently counting only the children she is allowed to read.
--
-- computeClassPay() reads student_enrollments through the signed-in teacher's
-- client. The only policy on that table, student_enrollments_all from
-- migration 049, permits a row when can_access_school(school_id_for_student())
-- is true - the school the CHILD belongs to, not the school the CLASS belongs
-- to. For a TEACHER that resolves to the schools she is assigned to.
--
-- Jessica Vedder is assigned to The Academy Virtual. Her 1pm DigitLab class
-- has four CAMPUS children - enrolled at FL or GA, by the rule recorded in
-- migration 385. She cannot read their enrolment rows. Postgres returns four
-- fewer rows, no error is raised, and grossForClass() prices a class of zero.
--
-- MEASURED 21 September, against the database read as service role:
--     VEDDER-1300  DigitLab     4 children in the database   screen showed 0
--     VEDDER-1400  Earthology   6 children in the database   screen showed 4
--     VEDDER-1700  Tutoring     1 child  in the database     screen showed 1
--
-- Jessica alone, this week: DigitLab $35/day priced at $0, Earthology $45
-- priced at $35. About $180. Friday 23:59 is when that becomes real money,
-- and every one of the thirteen teaches at least one class with a child from
-- another school.
--
-- It never surfaced because the only week ever submitted was the synthetic
-- $125 one, where the test teacher and her two invented children shared a
-- school.
--
-- This is the house pattern exactly: zero rows with no error is a policy
-- refusal wearing a success costume.
--
-- THE FIX. A teacher may read the enrolments of a class she teaches. She
-- plainly needs to - she teaches those children, takes their attendance, and
-- is paid for them. Nothing else is opened: she still cannot read the
-- enrolments of a class that is not hers.
--
-- ADDITIVE, NOT A REPLACEMENT. Postgres ORs permissive policies for the same
-- command, so student_enrollments_all keeps working exactly as it does now for
-- everyone it already serves. Nobody loses access.
--
-- TWO WAYS TO BE THE TEACHER. The section's usual instructor, and the
-- instructor recorded on a session of that section - which is how a guest
-- covering somebody else's class can see who she is teaching.
--
-- THIS CANNOT BE TESTED FROM THE SQL EDITOR. The editor runs as the service
-- role and bypasses RLS, so it will report success whether or not the policy
-- works. The only honest test is signing in as a teacher and reading the
-- screen - the same lesson as 20 September, when class_pay_rates was
-- unreadable and every class priced at $0.00.
-- ===========================================================================

begin;

/*
 * GUARDED, 21 September 2026, because this file undid its own successor.
 *
 * The policy below is the ORIGINAL version, and it is too slow to use - it
 * timed out Jessica Vedder's timesheet outright. Migration 403 replaced it
 * with one built on teaches_course_section(). But this file was re-run
 * afterwards, its unconditional drop-and-create put the slow version back, and
 * the timesheet broke again.
 *
 * So: if 403 has been applied, leave its policy alone. A migration that
 * silently reverses a later one is a trap, and nobody should have to remember
 * the running order to avoid it.
 */
do $$
begin
  if to_regprocedure('public.teaches_course_section(uuid)') is not null then
    raise notice
      'Migration 403 is already applied - keeping its fast policy. Nothing changed here.';
  else
    drop policy if exists student_enrollments_teacher_own_class on public.student_enrollments;

    create policy student_enrollments_teacher_own_class
    on public.student_enrollments
    for select
    using (
      exists (
        select 1
        from public.course_sections cs
        where cs.id = student_enrollments.course_section_id
          and public.is_self_employee(cs.instructor_employee_id)
      )
      or exists (
        select 1
        from public.instructional_sessions i
        where i.course_section_id = student_enrollments.course_section_id
          and public.is_self_employee(i.instructor_employee_id)
      )
    );
  end if;
end $$;

comment on policy student_enrollments_teacher_own_class on public.student_enrollments is
  'A teacher may read the enrolments of a class she teaches - as the section '
  'instructor, or as the instructor on one of its sessions, which covers guest '
  'teaching. Added 21 September 2026 because pay was being computed from the '
  'rows the teacher happened to be allowed to read, and a child at another '
  'school was silently worth nothing.';

commit;

-- ===========================================================================
-- VERIFY. The first three run here. The fourth cannot.
-- ===========================================================================

-- 1. The policy exists, and the old one is still there beside it.
--    EXPECT TWO ROWS. One missing means the fix did not land, or landed by
--    replacing something that other people depend on.
select
  '1. policies on student_enrollments' as check,
  policyname                            as detail,
  cmd                                   as extra
from pg_policies
where schemaname = 'public'
  and tablename = 'student_enrollments'

union all

-- 2. What the database actually holds for Jessica's three sections, read as
--    service role. These are the numbers the screen should now match.
select
  '2. children in the database',
  cs.section_code,
  count(*)::text
from public.student_enrollments se
join public.course_sections cs on cs.id = se.course_section_id
where cs.section_code like 'VEDDER%'
  and se.enrollment_status in ('enrolled', 'completed')
group by cs.section_code

union all

-- 3. How wide this reaches. Every section where at least one enrolled child
--    belongs to a school other than the section's own - each is a class that
--    has been underpaying its teacher.
select
  '3. sections with a child from another school',
  count(*)::text,
  'each one was underpaying'
from (
  select cs.id
  from public.course_sections cs
  join public.student_enrollments se on se.course_section_id = cs.id
  join public.students st on st.id = se.student_id
  join public.courses c on c.id = cs.course_id
  where se.enrollment_status in ('enrolled', 'completed')
    and st.school_id is distinct from c.school_id
  group by cs.id
) as affected

order by 1, 2;

-- 4. CANNOT BE RUN HERE. Sign in as Jessica Vedder, open
--    /dashboard/teacher/timesheets, and read Monday. DigitLab should show
--    4 on roster and $35.00 where it showed "no students" and a dash;
--    Earthology should show 6 and $45.00 where it showed 4 and $35.00.
--    If they do not, the policy is not reaching her and nothing else here
--    proves anything.
