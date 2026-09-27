-- Who would move campus under the school-of-record rule.
--
-- Jimmy, 27 September: a student USING STATE FUNDING is registered at the
-- in-person campus of that state, even when every class they take is Virtual
-- or HS.
--
-- This names them before anything moves. One statement, read only.
--
-- WHY THIS RUNS BEFORE THE RULE IS BUILT. Moving a student's school_id is not
-- a records change in isolation - it changes the campus roster counts, the
-- capacity figures, which Square location that family's tuition is taken at
-- (migration 431), which campus's books carry their revenue, and what each
-- state is told. A rule applied to an unknown number of children is a rule
-- nobody can check afterwards.
--
-- THREE SIGNALS OF STATE FUNDING, because no single column carries it:
--   award   : a row in scholarship_awards - the school's own record of it
--   money   : a funder_disbursement matched to the student - the money arrived
--   plan    : a tuition plan whose channel is classwallet or state_direct
--
-- A student may show more than once, once per signal. That is deliberate:
-- disagreement between the three is itself worth seeing before a move.

select 'award'::text as signal,
       sc.name as current_campus,
       s.first_name || ' ' || s.last_name as student,
       s.student_number,
       a.program_name as detail,
       a.award_year as detail_2,
       a.awarded_amount::text as amount
  from public.students s
  join public.schools sc on sc.id = s.school_id
  join public.scholarship_awards a on a.student_id = s.id
 where s.status = 'active'
   and s.enrollment_status = 'enrolled'
   and lower(trim(sc.name)) in ('the academy virtual', 'the academy hs')
   and a.status = 'awarded'

union all

select 'money',
       sc.name,
       s.first_name || ' ' || s.last_name,
       s.student_number,
       fa.name,
       to_char(d.settled_at, 'YYYY-MM-DD'),
       d.net_amount::text
  from public.students s
  join public.schools sc on sc.id = s.school_id
  join public.funder_disbursements d on d.student_id = s.id
  join public.funder_accounts fa on fa.id = d.funder_account_id
 where s.status = 'active'
   and s.enrollment_status = 'enrolled'
   and lower(trim(sc.name)) in ('the academy virtual', 'the academy hs')

union all

select 'plan',
       sc.name,
       s.first_name || ' ' || s.last_name,
       s.student_number,
       p.payment_channel,
       coalesce(p.billing_basis, '-'),
       coalesce(p.annual_tuition::text, p.monthly_amount::text, '-')
  from public.students s
  join public.schools sc on sc.id = s.school_id
  join public.student_tuition_plans p on p.student_id = s.id
 where s.status = 'active'
   and s.enrollment_status = 'enrolled'
   and lower(trim(sc.name)) in ('the academy virtual', 'the academy hs')
   and p.payment_channel in ('classwallet', 'state_direct')

order by 1, 2, 3;
