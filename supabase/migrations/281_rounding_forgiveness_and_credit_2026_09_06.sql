-- 281: close the 16 FL plans as forgiveness, and put back what 280 changed.
--
-- Jimmy, 2026-09-06: "do school forgiveness for all of those. do not change
-- them."
--
-- 280 HAS ALREADY RUN. It closed the plans by moving remaining_due to match the
-- instalments — which is precisely the change the instruction above rules out.
-- So this migration restores every balance 280 touched before doing anything
-- else. The restore reads the original figure out of the note 280 wrote, so it
-- recovers the real number rather than recomputing an approximation of it. If
-- 280 was never run, the restore matches nothing and the rest still works.
--
-- FORGIVENESS ONLY FITS FIVE OF THE SIXTEEN. The drift runs both ways:
--
--   5 plans FALL SHORT — the instalments sum to LESS than the balance, so the
--     school gives up the difference. That is forgiveness.
--       Francillon, Hayes, Padilla, Alexandra Rubio  4c each
--       Cade Macklin                                 1c
--
--   11 plans RUN OVER — the instalments sum to MORE than the balance, so the
--     school is scheduled to collect more than is owed. That is the opposite of
--     forgiveness, and forgiveness_amount is checked >= 0 for good reason: a
--     negative forgiveness is a phrase that means nothing.
--       Izrael & Zion Alexander, Harper Bowers, James Dublis, Damari Oliver,
--       Connor Ramos, Drew Ross, Cristian Rubio, William Sifonte, Adaya Ward  4c
--       Ava Perkins                                                          8c
--
-- So the table gains the mirror of forgiveness: overpayment_credit. Both are
-- non-negative, both require a reason, and neither touches an instalment — so
-- every schedule already sent to a family stays accurate to the cent.
--
-- 21 cents forgiven, 48 cents credited. The amounts are trivial; the
-- distinction is not. The same statement that absorbs four cents in the wrong
-- direction would absorb four hundred, which is why the guard below is a hard
-- abort at one dollar rather than a larger tolerance.
--
-- IDEMPOTENT.

begin;

-- ---------------------------------------------------------------------------
-- 1. Undo 280
-- ---------------------------------------------------------------------------
--
-- 280 wrote: "Stated balance 3965.00 did not equal the sum of its instalments;
-- adjusted by 0.04 on 2026-09-06 so the plan closes. ..."
-- The original balance is in that sentence. Take it back out.

do $$
declare v_restored int;
begin
  update public.student_tuition_plans p
     set remaining_due =
           (regexp_match(p.notes, 'Stated balance ([0-9]+\.[0-9]{2}) did not equal'))[1]::numeric,
         notes = nullif(btrim(regexp_replace(
           p.notes,
           'Stated balance [0-9]+\.[0-9]{2} did not equal the sum of its instalments; adjusted by -?[0-9]+\.[0-9]{2} on 2026-09-06 so the plan closes\. The document''s monthly amounts are unchanged\.',
           '', 'g')), ''),
         updated_at = now()
   where p.notes ~ 'Stated balance [0-9]+\.[0-9]{2} did not equal the sum of its instalments';
  get diagnostics v_restored = row_count;
  raise notice '% plan(s) restored to their original stated balance.', v_restored;
end $$;

-- ---------------------------------------------------------------------------
-- 2. The mirror of forgiveness
-- ---------------------------------------------------------------------------

alter table public.student_tuition_plans
  add column if not exists overpayment_credit numeric(12,2) not null default 0,
  add column if not exists overpayment_reason text;

alter table public.student_tuition_plans
  drop constraint if exists plan_overpayment_nonneg;
alter table public.student_tuition_plans
  add constraint plan_overpayment_nonneg
  check (overpayment_credit >= 0);

alter table public.student_tuition_plans
  drop constraint if exists plan_overpayment_has_reason;
alter table public.student_tuition_plans
  add constraint plan_overpayment_has_reason
  check (overpayment_credit = 0 or overpayment_reason is not null);

-- ---------------------------------------------------------------------------
-- 3. The balance view learns about it
-- ---------------------------------------------------------------------------
--
--   remaining_due - forgiveness + overpayment_credit = scheduled_total
--
-- Read left to right: what the family owes, less what the school gave up, plus
-- what they are scheduled to overpay, equals what the schedule asks for. A plan
-- closes when that identity holds.

drop view if exists public.student_tuition_plan_balances;

create view public.student_tuition_plan_balances
with (security_invoker = on) as
select
  p.id                as plan_id,
  p.student_id,
  s.first_name || ' ' || s.last_name as student,
  sc.name             as school,
  sy.name             as school_year,
  p.billing_mode,
  p.payment_channel,
  p.monthly_amount,
  p.billing_basis,
  p.remaining_due,
  p.forgiveness_amount,
  p.overpayment_credit,
  case when p.billing_mode = 'scheduled'
       then coalesce(sum(i.amount), 0) end                 as scheduled_total,
  case when p.billing_mode = 'scheduled'
       then p.remaining_due - p.forgiveness_amount + p.overpayment_credit
            - coalesce(sum(i.amount), 0) end               as unaccounted,
  case
    when p.billing_mode <> 'scheduled' then null
    when abs(p.remaining_due - p.forgiveness_amount + p.overpayment_credit
             - coalesce(sum(i.amount), 0)) < 0.005 then true
    else false
  end                                                      as closes,
  count(i.id)                                              as instalment_count,
  coalesce(sum(i.amount) filter (where i.is_paid), 0)      as paid_to_date
from public.student_tuition_plans p
join public.students s on s.id = p.student_id
left join public.schools sc on sc.id = s.school_id
join public.school_years sy on sy.id = p.school_year_id
left join public.student_tuition_instalments i on i.plan_id = p.id
where p.status = 'active'
group by p.id, s.first_name, s.last_name, sc.name, sy.name;

-- ---------------------------------------------------------------------------
-- 4. Apply it
-- ---------------------------------------------------------------------------

do $$
declare
  r           record;
  v_forgiven  int := 0;
  v_credited  int := 0;
  v_big       text[] := '{}';
begin
  for r in
    select b.plan_id, b.student, b.unaccounted
      from public.student_tuition_plan_balances b
     where b.billing_mode = 'scheduled'
       and b.closes is false
  loop
    if abs(r.unaccounted) >= 1.00 then
      v_big := array_append(v_big,
        r.student || ' (' || to_char(r.unaccounted, 'FM999999990.00') || ')');

    elsif r.unaccounted > 0 then
      -- Falls short. The school gives up the difference.
      update public.student_tuition_plans p
         set forgiveness_amount = p.forgiveness_amount + r.unaccounted,
             forgiveness_reason = coalesce(p.forgiveness_reason,
               'Rounding: the schedule''s equal monthly payments fall ' ||
               to_char(r.unaccounted, 'FM999999990.00') ||
               ' short of the stated balance. School forgiveness 2026-09-06. ' ||
               'No payment and no stated balance was changed.'),
             updated_at = now()
       where p.id = r.plan_id;
      v_forgiven := v_forgiven + 1;
      raise notice 'FORGIVEN  % %', to_char(r.unaccounted, 'FM990.00'), r.student;

    else
      -- Runs over. The family is scheduled to pay more than is owed.
      update public.student_tuition_plans p
         set overpayment_credit = p.overpayment_credit + (-r.unaccounted),
             overpayment_reason = coalesce(p.overpayment_reason,
               'Rounding: the schedule''s equal monthly payments exceed the ' ||
               'stated balance by ' || to_char(-r.unaccounted, 'FM999999990.00') ||
               '. Held as a credit to the family 2026-09-06. No payment and no ' ||
               'stated balance was changed.'),
             updated_at = now()
       where p.id = r.plan_id;
      v_credited := v_credited + 1;
      raise notice 'CREDITED  % %', to_char(-r.unaccounted, 'FM990.00'), r.student;
    end if;
  end loop;

  if array_length(v_big, 1) is not null then
    raise exception 'Aborting: % plan(s) out by a dollar or more. That is an error, not rounding: %',
      array_length(v_big, 1), array_to_string(v_big, ', ');
  end if;

  raise notice '% forgiven, % credited.', v_forgiven, v_credited;
end $$;

commit;

-- Expect: scheduled, 51 plans, 51 closing, 0 not closing,
--         total_forgiven 0.21, total_credited 0.48, worst gap 0.00.
select billing_mode,
       count(*)                                as plans,
       count(*) filter (where closes)          as closing,
       count(*) filter (where closes is false) as not_closing,
       sum(forgiveness_amount)                 as total_forgiven,
       sum(overpayment_credit)                 as total_credited,
       max(abs(unaccounted))                   as worst_gap
from public.student_tuition_plan_balances
group by billing_mode
order by billing_mode;
