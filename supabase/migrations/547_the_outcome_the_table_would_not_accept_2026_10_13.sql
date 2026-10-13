-- ============================================================================
-- 547  THE OUTCOME THE TABLE WOULD NOT ACCEPT
--      13 October 2026
-- ============================================================================
--
-- WHAT HAPPENED, FIVE MINUTES AGO
--
-- Jimmy tested the tour step end to end at the test campus. Everything worked:
-- the booking was read off the calendar, the tour was recorded, the notes
-- letter arrived at the tour's start time, the button opened the page, the
-- page carried the letter's words, he typed "Good tour" - and pressing
-- "Send the application" gave him:
--
--   "That did not save. Tell Jimmy before you forget what you decided."
--
-- THE CAUSE
--
-- recordPostCallDecision writes the notes FIRST, before any stage move and
-- before any letter, deliberately: if a send fails afterwards, what a school
-- leader wrote about a child is still on the record. That write goes into
-- lead_call_outcomes, whose `outcome` column carries a CHECK constraint
-- listing every value it will accept:
--
--   spoke_will_book, spoke_not_proceeding, left_message, no_answer,
--   application_resent, application_not_proceeding, tour_requested,
--   shadow_days_invited, post_call_not_the_right_school, post_call_follow_up
--
-- The tour step added an eleventh button, `application_invited`, and nobody
-- added it here. So the very first statement of the very first branch was
-- refused by the database, and the page correctly reported that nothing
-- saved - because nothing had.
--
-- The guard worked exactly as designed. The list it guards was simply
-- incomplete, and that is mine: I added an action value and did not check
-- whether the column that stores it constrains what it will take.
--
-- NOTHING WAS HALF-DONE. The insert is the first statement, so the refusal
-- happened before the tour was marked held, before the stage moved and before
-- any letter. The child is still at Tour Scheduled and the family was sent
-- nothing. Pressing the button again after this runs does the whole thing
-- once, cleanly.
--
-- ── WHY ADD TO THE LIST RATHER THAN DROP IT ────────────────────────────────
--
-- The constraint is the reason this surfaced in a test instead of as a
-- mystery three weeks from now. A typo in an action value would otherwise
-- write a row nobody can interpret and every later report would quietly
-- miscount. The list stays; it gains the one value it is missing.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────
--
-- Refuses if the constraint is not the one this file was written against -
-- if somebody has already changed it, replacing it blind would throw their
-- change away.

do $$
declare
  definition text;
begin
  select pg_get_constraintdef(con.oid) into definition
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'lead_call_outcomes'
    and con.conname = 'lead_call_outcomes_outcome_check';

  if definition is null then
    raise exception
      'Refusing: lead_call_outcomes_outcome_check does not exist. This file expects it to.';
  end if;

  if position('application_invited' in definition) > 0 then
    raise exception
      'Refusing: application_invited is already allowed. This file has already run.';
  end if;

  if position('post_call_follow_up' in definition) = 0
     or position('tour_requested' in definition) = 0 then
    raise exception
      'Refusing: the constraint is not the one this file was written against: %', definition;
  end if;
end $$;

-- ── THE CHANGE ─────────────────────────────────────────────────────────────
--
-- The ten existing values, in their existing order, plus the eleventh. The
-- order is kept so a diff of the constraint reads as one addition rather than
-- a rewrite.

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
    -- Added 13 October 2026. The tour page's "Send the application" button.
    -- See the header: its absence is why the first live tour test could not
    -- save.
    'application_invited'::text
  ]));

-- ── THE GUARD, AFTER ───────────────────────────────────────────────────────

do $$
declare
  definition text;
  existing   integer;
begin
  select pg_get_constraintdef(con.oid) into definition
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'lead_call_outcomes'
    and con.conname = 'lead_call_outcomes_outcome_check';

  if definition is null or position('application_invited' in definition) = 0 then
    raise exception 'Refusing: application_invited did not land in the constraint.';
  end if;

  -- Every one of the ten that were there before must still be there. A
  -- replaced constraint that quietly dropped a value would start refusing
  -- outcomes the rest of the platform already writes.
  if position('spoke_will_book' in definition) = 0
     or position('spoke_not_proceeding' in definition) = 0
     or position('left_message' in definition) = 0
     or position('no_answer' in definition) = 0
     or position('application_resent' in definition) = 0
     or position('application_not_proceeding' in definition) = 0
     or position('tour_requested' in definition) = 0
     or position('shadow_days_invited' in definition) = 0
     or position('post_call_not_the_right_school' in definition) = 0
     or position('post_call_follow_up' in definition) = 0 then
    raise exception 'Refusing: one of the ten original outcomes was lost: %', definition;
  end if;

  -- And no row already in the table may be outside the new list. There should
  -- be none - the old constraint allowed a subset - but a constraint added
  -- over rows it does not cover is a failure worth naming rather than
  -- discovering later.
  select count(*) into existing
  from public.lead_call_outcomes
  where outcome is not null
    and outcome <> all (array[
      'spoke_will_book','spoke_not_proceeding','left_message','no_answer',
      'application_resent','application_not_proceeding','tour_requested',
      'shadow_days_invited','post_call_not_the_right_school',
      'post_call_follow_up','application_invited'
    ]);

  if existing <> 0 then
    raise exception 'Refusing: % existing rows carry an outcome outside the list.', existing;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- The constraint, read back. Expect eleven values, ending in
-- application_invited.
select pg_get_constraintdef(con.oid) as outcome_check
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'lead_call_outcomes'
  and con.conname = 'lead_call_outcomes_outcome_check';

-- What has actually been recorded through the post-call pages so far, newest
-- first. After a successful tour test there will be an application_invited
-- row at the top with the notes beside it.
select o.outcome,
       o.notes,
       o.called_at,
       coalesce(l.preferred_name, l.first_name) as student
from public.lead_call_outcomes o
join public.admissions_leads l on l.id = o.lead_id
order by o.called_at desc
limit 10;
