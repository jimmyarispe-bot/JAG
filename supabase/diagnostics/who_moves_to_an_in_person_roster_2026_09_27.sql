-- Who would move campus under the school-of-record rule.
--
-- Jimmy, 27 September: a student USING STATE FUNDING is registered at the
-- in-person campus of that state, even when every class they take is Virtual
-- or HS.
--
-- This names them before anything moves. One statement, read only.
--
-- (Third version. The first named funder_accounts.name and
-- funder_disbursements.settled_at, neither of which exists - they are
-- account_label and settled_on. The second fell over on
-- coalesce(billing_basis, '-'), because billing_basis is numeric and '-' is
-- not: in a coalesce, the fallback has to be the same type as the column,
-- and a dash is only a sensible placeholder for text. Cast first, then
-- default.)
--
-- WHY THIS RUNS BEFORE THE RULE IS BUILT. Moving a student's school_id is
-- not only a records change. Student numbers are per-campus sequences with a
-- unique index on (school_id, student_number), so a moved student either
-- collides with a number already used at their new campus or keeps one that
-- implies a campus history they do not have. The size of this list decides
-- how disruptive renumbering is.
--
-- THREE SIGNALS, because no single column carries "state funded":
--   award : a row in scholarship_awards - the school's own record
--   money : a settled funder disbursement matched to the student
--   plan  : a tuition plan billed to classwallet or state_direct
--
-- A student may appear more than once. Disagreement between the three is
-- itself worth seeing before anybody is moved.

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
       fa.account_label,
       coalesce(to_char(d.settled_on, 'YYYY-MM-DD'), d.award_period),
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
       coalesce(p.billing_basis::text, '-'),
       coalesce(p.annual_tuition::text, p.monthly_amount::text, '-')
  from public.students s
  join public.schools sc on sc.id = s.school_id
  join public.student_tuition_plans p on p.student_id = s.id
 where s.status = 'active'
   and s.enrollment_status = 'enrolled'
   and lower(trim(sc.name)) in ('the academy virtual', 'the academy hs')
   and p.payment_channel in ('classwallet', 'state_direct')

order by 1, 2, 3;
