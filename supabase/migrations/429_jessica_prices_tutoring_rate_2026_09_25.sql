-- Jessica Price is paid by the session, and only by the session.
--
-- Jimmy, 25 September 2026: "just make jessica's similar to GRs or Admin and
-- call it tutoring. This is all she does. Its paid at $35 per session. just
-- need to know how many she did in 1 week." And: "this is only specific to
-- jessica price. she doesn't need a schedule."
--
-- WHY THE CODE IS 'private_tutoring' AND NOT 'tutoring'.
--
-- A Tutoring COURSE already exists and is already priced in class_pay_rates -
-- $20 for anybody, $30 when Craig Mann takes Ivy. Two different prices under
-- one name on two different tables is how somebody eventually reconciles the
-- wrong one, and the person doing the reconciling would have no way to tell
-- which was meant. The code says which kind of tutoring this is.
--
-- HERS ALONE. employee_id is set, which is the whole permission: the weekly
-- sheet renders the question only for a person who holds the rate, and the
-- save refuses a code the person holds no rate for. No name appears in code.
--
-- 'occurrence', not 'hour': Jimmy asked for a count of sessions, not a length.
-- A session is a session whether it ran fifty minutes or seventy.

begin;

insert into public.work_pay_rates
  (code, label, unit, amount, employee_id, school_id, cadence_note, effective_from)
select 'private_tutoring',
       'Tutoring session',
       'occurrence',
       35.00,
       e.id,
       e.school_id,
       'Jessica Price only. Per session held, counted once a week.',
       date '2026-09-21'
from public.employees e
where e.employee_number = 'Jessica.Price'
on conflict (code, employee_id, effective_from) where employee_id is not null do update
  set amount       = excluded.amount,
      label        = excluded.label,
      unit         = excluded.unit,
      cadence_note = excluded.cadence_note,
      updated_at   = now();

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect ONE row: Jessica Price, 35.00, occurrence, effective 2026-09-21.
--
-- NO ROWS means the insert selected nothing - her employee_number is not
-- 'Jessica.Price' - and inserted nothing, silently, the way a SELECT-driven
-- insert always does. The dropdown will then not appear on her sheet, exactly
-- as the GREATNESS dropdown did not appear for Marnie when its rate could not
-- be read. Nothing is wrong with the screen in that case; the rate is missing.

select p.display_name as whose_rate,
       r.code,
       r.label,
       r.unit,
       r.amount,
       r.effective_from,
       r.cadence_note
  from public.work_pay_rates r
  join public.employees e on e.id = r.employee_id
  left join public.employee_profiles p on p.employee_id = e.id
 where r.code = 'private_tutoring';
