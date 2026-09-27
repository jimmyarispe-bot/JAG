/*
  418 — THE FIRST ATTENDANCE EVER TAKEN WAS A TEST, AND IT SAYS SOMETHING
        ABOUT TWO REAL CHILDREN

  WHAT THIS DELETES. Two rows in session_attendance_records, against the single
  class Jessica Vedder marked on 21 September 2026 at 17:00 while proving the
  teacher sign-in worked. Jimmy, 25 September: "they were a TEST - clicked to
  see the screen work - they should go, because a parent could be shown that
  attendance later."

  WHY IT MATTERS MORE THAN TWO ROWS. Until 21 September attendance had never
  been recorded in JAG at all - not this year, ever. These are the first two
  rows the table has ever held, and they are a claim about whether two named
  children were in a lesson. Attendance is shown to parents, and it is the
  evidence behind a teacher's pay. A mark nobody meant is worse than no mark,
  because the blank is honest and the mark is not.

  BOUNDED BY THE SESSION, NOT BY THE TEACHER. It deletes rows for that one
  class on that one date. It does not touch anything else Jessica has, any
  other class, or any attendance taken since - and it reports how many rows it
  removed, so a run that hits more than the two known rows is visible rather
  than silent.

  HER ACCOUNT IS UNTOUCHED, deliberately. employees.user_id points at it, and
  migration 396 died precisely because it hardcoded ids that went stale when a
  test account was torn down. She keeps the login and signs in with a password
  reset like any other teacher.

  NOTHING ELSE OF HERS EXISTS TO CLEAN: no week submission, no amendment, no
  work claim
  (supabase/diagnostics/what_is_under_jessicas_account_2026_09_25.sql).
*/

do $$
declare
  v_session uuid;
  v_deleted int;
begin
  /*
    Find the class by its teacher and its instant, rather than by an id typed
    into this file. An id copied from a screenshot is the kind of thing that
    silently points at the wrong row on a different database.
  */
  select s.id into v_session
  from public.instructional_sessions s
  join public.employees e on e.id = s.instructor_employee_id
  join public.employee_profiles p on p.employee_id = e.id
  where lower(coalesce(p.last_name, '')) = 'vedder'
    and s.scheduled_start >= timestamp '2026-09-21 17:00:00'
    and s.scheduled_start <  timestamp '2026-09-21 18:00:00';

  if v_session is null then
    raise exception
      'The 21 September 17:00 class was not found. Nothing deleted - check before rerunning.';
  end if;

  delete from public.session_attendance_records
  where instructional_session_id = v_session;

  get diagnostics v_deleted = row_count;

  if v_deleted <> 2 then
    raise exception
      'Expected exactly 2 test attendance rows, found %. Nothing should be guessed here - rolled back.',
      v_deleted;
  end if;

  raise notice 'Removed % test attendance rows from the 21 September class', v_deleted;
end $$;

/*
  PROVE THE TABLE IS BACK TO EMPTY. It held nothing before 21 September and
  these were the only rows ever written, so anything left is something this
  migration did not know about and somebody should look at it.
*/
do $$
declare
  v_left int;
begin
  select count(*) into v_left from public.session_attendance_records;

  if v_left > 0 then
    raise notice
      'NOTE: % attendance row(s) remain from somewhere else. Not an error - but look.',
      v_left;
  else
    raise notice 'No attendance rows remain. The record starts clean.';
  end if;
end $$;
