-- 398_a_week_is_born_submitted_2026_09_21.sql
--
-- A POLICY WRITTEN FOR A LIFECYCLE THE CODE DOES NOT HAVE.
--
-- Migration 392 gave teacher_week_submissions this insert policy:
--
--     for insert with check (is_self_employee(employee_id) and status = 'open')
--
-- imagining a week that is created open, edited, and later submitted. That is
-- not what happens. getTeacherWeek is deliberately READ ONLY - opening the
-- screen never writes a row - so no row exists until the moment a teacher
-- presses Submit, and that insert arrives with status = 'submitted'.
--
-- So the only insert that ever actually occurs was the one the policy refused.
-- Caught on 21 September by a synthetic teacher pressing the button: "new row
-- violates row-level security policy for table teacher_week_submissions".
--
-- It failed LOUDLY, which is the one good thing about it. Every other fault
-- this week returned zero rows and no error.
--
-- WHAT CHANGES, AND WHAT DOES NOT
--
-- A teacher may now insert their own week in either state. Everything that
-- makes the week a receipt is untouched:
--
--   * still their OWN week only - is_self_employee(employee_id)
--   * the UPDATE policy still requires status = 'open', so a submitted week
--     cannot be edited by the teacher who submitted it. The freeze holds.
--   * gross_cents is still computed server-side in submitWeekAction from
--     class_pay_rates and the roster. The teacher never supplies it.
--
-- ONE THING THIS DOES NOT SOLVE, WRITTEN DOWN RATHER THAN LEFT IMPLIED:
-- RLS cannot check that gross_cents matches the classes. A determined person
-- calling the API directly could insert their own week with a figure they
-- chose. That was equally true of the 'open' version of this policy, so
-- nothing is made worse today - but the real protection is a trigger that
-- recomputes the total, or making the write service-role only, and neither
-- exists yet. It belongs on the list before this is trusted with real money.

begin;

drop policy if exists teacher_week_submissions_self_insert on public.teacher_week_submissions;

create policy teacher_week_submissions_self_insert on public.teacher_week_submissions
  for insert with check (
    public.is_self_employee(employee_id)
    and status in ('open', 'submitted')
  );

commit;

-- =========================================================================
-- THE REPORT
--
-- This editor runs as the service role and bypasses RLS, so it cannot prove
-- the policy works - only that it exists and that the freeze is still in
-- place. THE REAL TEST IS PRESSING SUBMIT AGAIN AS THE TEACHER.
-- =========================================================================

select
  'insert policy exists'                                  as fact,
  case when exists (select 1 from pg_policies
                     where tablename = 'teacher_week_submissions'
                       and policyname = 'teacher_week_submissions_self_insert')
       then 'yes' else 'MISSING' end                      as value
union all
select
  'update still refuses a submitted week (the freeze)',
  case when exists (select 1 from pg_policies
                     where tablename = 'teacher_week_submissions'
                       and policyname = 'teacher_week_submissions_self_update'
                       and qual like '%open%')
       then 'yes' else '>>> THE FREEZE IS GONE <<<' end
union all
select
  'weeks submitted so far',
  (select count(*)::text from public.teacher_week_submissions where status = 'submitted');
