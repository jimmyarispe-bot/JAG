-- Two faults reported on the evening of 25 September 2026.
--
--   Craig Mann : "Your employee record has no campus on it, so this cannot be
--                 saved" when saving GREATNESS Reports.
--   Renee Tracewell : no GREATNESS dropdown on her sheet at all.
--
-- READ ONLY. Nothing here changes anything.

-- ── 1. WHO HAS NO CAMPUS ON THEIR EMPLOYEE ROW ───────────────────────────────
-- The claim table requires a school (migration 377). Anyone listed here would
-- have been refused by the OLD code. The new code files the claim against the
-- school of the classes they actually taught instead, so this is now a label
-- question and not a blocker - but it says who was hit tonight.

select 'employees with no campus' as finding,
       coalesce(p.display_name, e.employee_number) as person,
       e.employee_number,
       e.school_id
  from public.employees e
  left join public.employee_profiles p on p.employee_id = e.id
 where e.school_id is null
   and e.employment_status = 'active'
 order by 2;

-- ── 2. RENEE'S WEEK ──────────────────────────────────────────────────────────
-- The dropdown is hidden when the week is NOT 'open'. submitted, approved and
-- not_approved are all frozen, and a frozen week shows no picker at all.
--
-- Expect: either no row (never touched - then the dropdown SHOULD be showing
-- and the cause is elsewhere), or one row with a status. Anything other than
-- 'open' is the answer.

select 'renee week rows' as finding,
       w.week_start,
       w.status,
       w.gross_cents,
       w.submitted_at
  from public.teacher_week_submissions w
  join public.employees e on e.id = w.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where coalesce(p.display_name, e.employee_number) ilike '%tracewell%'
 order by w.week_start desc;

-- ── 3. EVERY TEACHER'S WEEK OF 21 SEPTEMBER ──────────────────────────────────
-- The same question for all thirteen, because a frozen week hides the dropdown
-- for anybody, and an incomplete week frozen early is the fault Holly and Kim
-- already reported.

select 'week of 2026-09-21' as finding,
       coalesce(p.display_name, e.employee_number) as person,
       w.status,
       w.gross_cents / 100.0 as gross,
       w.submitted_at
  from public.teacher_week_submissions w
  join public.employees e on e.id = w.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where w.week_start = date '2026-09-21'
 order by 2;

-- ── 4. CAN THE GREATNESS RATE BE FOUND AT ALL ────────────────────────────────
-- If this returns nothing, no teacher sees a price and every save is refused.

select 'greatness rate' as finding,
       r.code, r.label, r.unit, r.amount, r.employee_id, r.effective_from
  from public.work_pay_rates r
 where r.code = 'greatness_report';

-- ── 5. WHAT HAS ACTUALLY BEEN CLAIMED THIS WEEK ──────────────────────────────

select 'claims filed' as finding,
       coalesce(p.display_name, e.employee_number) as person,
       c.work_code,
       c.work_date,
       c.quantity,
       s.name as filed_against
  from public.contractor_work_claims c
  join public.employees e on e.id = c.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
  left join public.schools s on s.id = c.school_id
 where c.work_date >= date '2026-09-21'
 order by 2, 3;
