/*
  WHAT IS UNDER JESSICA VEDDER'S ACCOUNT — 2026-09-25
  Read-only. Nothing here writes, and nothing here deletes.

  WHY. Jessica was the first real teacher account in the platform's history and
  was used to prove the sign-in loop. Jimmy: "jessica vedder was the test. i'll
  need her to go through the process herself. do we need to delete her first."

  The account should stay - employees.user_id points at it, and migration 396
  died precisely because it hardcoded ids that went stale when a test account
  was torn down. The real question is whether TEST DATA sits under her name.
  teacher_week_submissions is unique on (employee_id, week_start), so a
  leftover practice row for the current week would block or corrupt her first
  real one.

  WHAT EMPTY MEANS, decided before running it:

  1. one row is expected - her employee and account, linked. Zero rows means
     the name is stored differently; widen the search rather than concluding
     she is missing.
  2. ZERO ROWS IS THE GOOD ANSWER. Any week submission is practice data that
     has to go before she submits for real.
  3. ZERO ROWS IS THE GOOD ANSWER. Any amendment is attached to a practice
     week.
  4. ZERO ROWS IS THE GOOD ANSWER. Attendance she marked while testing is
     attendance a parent could later be shown.
  5. ZERO ROWS IS THE GOOD ANSWER. A work claim filed in testing rides the next
     week she submits and would be paid.
*/

select
  '1. her account and employee' as check,
  coalesce(nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
           p.display_name, e.employee_number) as detail,
  'employee=' || e.id::text
    || ' | login=' || case when e.user_id is null then 'NO LOGIN' else e.user_id::text end
    || ' | email=' || coalesce(p.contact_email, 'none')
    || ' | status=' || coalesce(e.employment_status, 'NULL') as extra
from public.employees e
join public.employee_profiles p on p.employee_id = e.id
where lower(coalesce(p.contact_email, '')) like '%vedder%'
   or lower(coalesce(p.last_name, '')) like '%vedder%'

union all

select
  '2. week submissions under her',
  coalesce(w.week_start::text, 'no week'),
  'status=' || coalesce(w.status, 'NULL')
    || ' | gross_cents=' || coalesce(w.gross_cents::text, 'NULL')
    || ' | submitted=' || coalesce(w.submitted_at::text, 'not submitted')
from public.teacher_week_submissions w
join public.employees e on e.id = w.employee_id
join public.employee_profiles p on p.employee_id = e.id
where lower(coalesce(p.last_name, '')) like '%vedder%'

union all

select
  '3. amendments under her',
  coalesce(a.kind, 'no kind'),
  'status=' || coalesce(a.status, 'NULL')
    || ' | claimed_cents=' || coalesce(a.claimed_cents::text, 'NULL')
from public.teacher_week_amendments a
join public.employees e on e.id = a.employee_id
join public.employee_profiles p on p.employee_id = e.id
where lower(coalesce(p.last_name, '')) like '%vedder%'

union all

select
  '4. attendance she marked',
  to_char(s.scheduled_start, 'YYYY-MM-DD HH24:MI'),
  count(*)::text || ' student rows'
from public.session_attendance_records r
join public.instructional_sessions s on s.id = r.instructional_session_id
join public.employees e on e.id = s.instructor_employee_id
join public.employee_profiles p on p.employee_id = e.id
where lower(coalesce(p.last_name, '')) like '%vedder%'
group by s.scheduled_start

union all

select
  '5. work claims under her',
  coalesce(c.work_date::text, 'no date'),
  coalesce(c.work_code, 'no code') || ' | qty=' || coalesce(c.quantity::text, 'NULL')
from public.contractor_work_claims c
join public.employees e on e.id = c.employee_id
join public.employee_profiles p on p.employee_id = e.id
where lower(coalesce(p.last_name, '')) like '%vedder%'

order by 1, 2;
