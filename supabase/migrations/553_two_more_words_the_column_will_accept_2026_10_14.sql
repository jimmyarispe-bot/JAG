-- ============================================================================
-- 553  TWO MORE WORDS THE COLUMN WILL ACCEPT
--      14 October 2026
-- ============================================================================
--
-- WHY, AND IT IS THE SAME REASON AS 547 ELEVEN HOURS AGO
--
-- recordPostCallDecision writes the school leader's notes FIRST, before any
-- stage move, any letter and any decision - deliberately, so a refused send
-- never loses what she wrote. That first write goes into lead_call_outcomes,
-- whose `outcome` column carries a CHECK constraint listing every value it
-- accepts.
--
-- On 13 October the tour step added an eleventh button, application_invited,
-- and nobody added it to the constraint. The very first statement of the very
-- first live test was refused and the page correctly reported:
--
--   "That did not save. Tell Jimmy before you forget what you decided."
--
-- Migration 547 fixed it. The shadow day step adds a twelfth and a thirteenth
-- button - shadow_day_accepted and shadow_day_denied, Jimmy's "accept-send
-- email, deny-send email" - and this file is that same fix made BEFORE the
-- test rather than during it.
--
-- NOTHING IN TYPESCRIPT CAN SEE THIS CONSTRAINT. A test in
-- tour-notes-step.test.ts asserts the full list of button values, which is
-- what makes the NEXT new button fail in a second rather than in a school
-- leader's hands - but only a migration can make the database agree.
--
-- ── WHAT THE TWO VALUES MEAN ───────────────────────────────────────────────
--
--   shadow_day_accepted   The shadow day(s) happened and the child is in. The
--                         days are marked held, the child moves to
--                         Shadow Day Completed and then to Accepted, the
--                         approved acceptance letter goes, and the enrollment
--                         packet is built. Same code the accept_or_deny gate
--                         runs - one decision, two doors.
--
--   shadow_day_denied     The shadow day(s) happened and the answer is no. The
--                         days are marked held, the decision is recorded and
--                         the child moves to Declined. The family is sent
--                         NOTHING today: the only approved decline letter in
--                         the JAG is application_declined_email, keyed to
--                         shadow_days_not_invited - a different refusal at a
--                         different step - and firing it here would tell the
--                         record a family was refused shadow days they had
--                         just attended. The button's own text on the page
--                         says so rather than promising a letter that is not
--                         written.
--
-- ── THE EXISTING ELEVEN ARE KEPT, EXACTLY ──────────────────────────────────
--
-- Read back off the live constraint this morning, not from memory. Dropping a
-- value a row already holds would make the constraint un-addable and leave the
-- table with none.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_con integer;
begin
  select count(*) into n_con
  from pg_constraint con
  join pg_class cl on cl.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = cl.relnamespace
  where nsp.nspname = 'public'
    and cl.relname = 'lead_call_outcomes'
    and con.conname = 'lead_call_outcomes_outcome_check';

  if n_con <> 1 then
    raise exception
      'Refusing: lead_call_outcomes_outcome_check is not there to replace (found %).', n_con;
  end if;

  -- Every value already on the table must survive this. If a row holds
  -- something the new list does not name, the ALTER below would fail anyway -
  -- this says WHICH value, which the Postgres error does not.
  if exists (
    select 1 from public.lead_call_outcomes
    where outcome is not null
      and outcome <> all (array[
        'spoke_will_book', 'spoke_not_proceeding', 'left_message', 'no_answer',
        'application_resent', 'application_not_proceeding', 'tour_requested',
        'shadow_days_invited', 'post_call_not_the_right_school',
        'post_call_follow_up', 'application_invited',
        'shadow_day_accepted', 'shadow_day_denied'
      ])
  ) then
    raise exception 'Refusing: a recorded outcome is not in the new list: %',
      (select string_agg(distinct outcome, ', ') from public.lead_call_outcomes
        where outcome <> all (array[
          'spoke_will_book', 'spoke_not_proceeding', 'left_message', 'no_answer',
          'application_resent', 'application_not_proceeding', 'tour_requested',
          'shadow_days_invited', 'post_call_not_the_right_school',
          'post_call_follow_up', 'application_invited',
          'shadow_day_accepted', 'shadow_day_denied'
        ]));
  end if;
end $$;

-- ── THE REPLACEMENT ────────────────────────────────────────────────────────

alter table public.lead_call_outcomes
  drop constraint lead_call_outcomes_outcome_check;

alter table public.lead_call_outcomes
  add constraint lead_call_outcomes_outcome_check
  check (outcome = any (array[
    'spoke_will_book'::text,
    'spoke_not_proceeding'::text,
    'left_message'::text,
    'no_answer'::text,
    'application_resent'::text,
    'application_not_proceeding'::text,
    'tour_requested'::text,
    'shadow_days_invited'::text,
    'post_call_not_the_right_school'::text,
    'post_call_follow_up'::text,
    'application_invited'::text,
    'shadow_day_accepted'::text,
    'shadow_day_denied'::text
  ]));

-- ── THE GUARD, AFTER - BY TRYING IT, NOT BY READING IT ─────────────────────
--
-- A constraint definition that LOOKS right is what 547 was meant to prove and
-- could not. This inserts both new values against a real lead, reads them
-- back, and rolls that part away inside a savepoint - so the proof is that the
-- database accepted them, not that the text parses.

do $$
declare
  v_lead uuid;
begin
  select id into v_lead from public.admissions_leads limit 1;
  if v_lead is null then
    raise notice 'No leads to test against - the constraint text is all the proof there is.';
    return;
  end if;

  begin
    insert into public.lead_call_outcomes (lead_id, outcome, notes, recorded_by)
    values (v_lead, 'shadow_day_accepted', '553 constraint proof - rolled back', null),
           (v_lead, 'shadow_day_denied',   '553 constraint proof - rolled back', null);
  exception when check_violation then
    raise exception 'Refusing: the column still will not accept the two new values.';
  end;

  -- Both landed. Take them straight back out; this was a test, not a decision.
  delete from public.lead_call_outcomes
  where lead_id = v_lead
    and notes = '553 constraint proof - rolled back';

  raise notice 'Both values accepted and removed again.';
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- The constraint, read back. Thirteen values.
select pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class cl on cl.oid = con.conrelid
where cl.relname = 'lead_call_outcomes' and con.conname = 'lead_call_outcomes_outcome_check';

-- No proof rows left behind.
select count(*) as proof_rows_left
from public.lead_call_outcomes
where notes = '553 constraint proof - rolled back';

-- What has actually been recorded through these buttons so far, newest first.
select outcome, count(*) as times, max(called_at) as most_recent
from public.lead_call_outcomes
group by outcome
order by most_recent desc nulls last;
