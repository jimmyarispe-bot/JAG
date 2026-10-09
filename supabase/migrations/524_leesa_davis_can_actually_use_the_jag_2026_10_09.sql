-- 524_leesa_davis_can_actually_use_the_jag_2026_10_09.sql
--
-- Leesa Davis, Specialized Teacher at The Academy Virtual, 9 October 2026:
--
--     "I tried to reset my JAG password, and it's not working. Would you be
--      able to send me the reset password link?"
--
-- THE PASSWORD WAS NEVER THE PROBLEM. Her auth account exists and her email
-- was confirmed on 8 October at 19:02. The reset letter was being swallowed
-- by EMAIL_DIVERT_TO, which came off production at 11:13 this morning. She
-- can reset it herself now and needs nothing from this file to do so.
--
-- THIS IS THE FAULT WAITING BEHIND IT. She has:
--
--     auth.users            yes, confirmed
--     public.users          yes, 3ae8b583-...
--     employee_profiles     yes, employee 07b66f51-...
--     employees.user_id     NULL
--
-- So the moment she signs in, the JAG will not know she is a teacher.
-- current_employee_id() reads employees.user_id = auth.uid(); with no link it
-- returns nothing, requireTeacherWeekContext refuses, and she is told she has
-- no staff record. She cannot log a class, cannot be paid, and does not
-- appear on a payroll screen - after successfully signing in, which is the
-- worst version of it, because everything looks like it worked.
--
-- This was written as migration 517 on 8 October and never run. It is also
-- not on disk: 517 is inside the 483-520 gap, where nine schema changes exist
-- only in the SQL editor's history. Rewritten here rather than hunted for.
--
-- THE SAME FAULT AS HEATHER BADGER-BROWN, MIRRORED. Heather has a login,
-- SCHOOL_LEADER, two campuses - and no employees row at all, so she can run
-- two schools and cannot be paid by the platform. Leesa has the employee
-- record and no link to her login. Fifteen employees, twenty users, and
-- nothing anywhere reconciles the two. Jimmy, 8 October: "why are there even
-- different places for staff and/or anyone else? this just creates potential
-- for similar issues." This is the third one found since he said it.

begin;

do $$
declare
  v_user_id     uuid;
  v_employee_id uuid;
  v_existing    uuid;
begin
  /* By address, which is the one fact both sides agree on, and lowercased
     because a capital letter in an email is not a different person. */
  select u.id into v_user_id
    from public.users u
   where lower(u.email) = 'leesa.davis@theacademyvirtual.org';

  if v_user_id is null then
    raise exception 'No public.users row for leesa.davis@theacademyvirtual.org. Nothing written.';
  end if;

  select p.employee_id into v_employee_id
    from public.employee_profiles p
   where lower(p.contact_email) = 'leesa.davis@theacademyvirtual.org';

  if v_employee_id is null then
    raise exception 'No employee_profiles row for leesa.davis@theacademyvirtual.org. Nothing written.';
  end if;

  /*
   * NOT IF SOMEBODY ELSE IS ALREADY ON IT. Overwriting a user_id would move
   * a different person's classes and pay onto Leesa's record silently.
   */
  select e.user_id into v_existing from public.employees e where e.id = v_employee_id;

  if v_existing is not null and v_existing <> v_user_id then
    raise exception
      'Employee % is already linked to user %, not to Leesa (%). Stopping rather than overwriting.',
      v_employee_id, v_existing, v_user_id;
  end if;

  if v_existing = v_user_id then
    raise notice 'Already linked. Nothing to do.';
    return;
  end if;

  update public.employees
     set user_id = v_user_id,
         updated_at = now()
   where id = v_employee_id;

  raise notice 'Leesa Davis: employee % now linked to user %.', v_employee_id, v_user_id;
end $$;

commit;

-- ============================================================================
-- AFTERWARDS
-- ============================================================================
--
-- 1. Tell Leesa to reset her password at
--    https://theacademyway.thejag.org/login. It will work now - the divert is
--    off. She does not need to wait for this migration.
--
-- 2. When she signs in she should land straight on My week, with no sidebar
--    and no other page, and be able to add a class. If she instead sees a
--    sentence about having no staff record, this migration did not run or did
--    not take, and the link is still missing.
--
-- 3. THE REAL FIX IS NOT THIS FILE. Three people in two days have been half
--    recorded - Leesa, Heather, and Cassandra Manghum's name spelled two ways
--    across the same two tables. Nothing checks that users and employees
--    agree, and nothing ever will until something does. The morning check
--    already asks question 3 - "the same person, two answers" - and would
--    have found all three. It fires at 6:47 and has not run yet.
