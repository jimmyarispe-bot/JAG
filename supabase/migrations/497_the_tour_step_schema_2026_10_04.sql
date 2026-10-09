-- 497_the_tour_step_schema_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED, same rule as 494: the two new
-- trigger events have to exist in the TypeScript union and in
-- TRIGGER_EVENT_LABELS before any row carries them, or the admissions
-- registry gate fails on an event it does not know.
--
-- WHAT THIS DOES, AND WHAT IT DELIBERATELY DOES NOT.
--
--   IT DOES    add admissions_leads.post_call_token, the single-use link in
--              the post-call letter, and widen the lead_call_outcomes check
--              so the three new decisions can be recorded.
--
--   IT DOES NOT seed either letter. staff_inquiry_call_held and
--              tour_invitation_sent have no rows at all, because Jimmy has
--              not written them yet and nothing in this build ships words a
--              family or a school leader will read without him seeing them
--              first. Until those rows exist and are active:
--                - the nightly scan finds GA and FL bookings, records them,
--                  and reports "no active template for staff_inquiry_call_held"
--                - nobody is emailed, nobody reaches /post-call/<token>, and
--                  no family is moved
--              which is the correct behaviour for an unwritten letter, and is
--              reported rather than silent.
--
-- THE GATE MOVE IS NOT IN HERE EITHER. It is in the code, switched off, behind
-- ADMISSIONS_TOUR_GATE in Vercel. See the long note in src/lib/admissions/tour.ts:
-- arming it before those two letters exist stops every GA and FL family dead
-- at the interest meeting, and the board would look like a quiet week.
--
-- Safe to re-run: the column is `if not exists`, the index is `if not exists`,
-- and the constraint is dropped by lookup before it is added.

begin;

-- ── 1. The token ─────────────────────────────────────────────────────────────
--
-- A FOURTH TOKEN COLUMN, not a reuse of one of the three that exist.
-- interest_call_token, application_call_token and now post_call_token each
-- open a different page asking a different question. One shared token would
-- mean the oldest email in a school leader's inbox opens the newest page: she
-- would answer "what came of the call?" and be shown "re-send the
-- application?" instead.
--
-- Same shape as the other three (migration 412): 64 lowercase hex, minted by
-- the server, read by exactly one route, never accepted from anywhere else.

alter table public.admissions_leads
  add column if not exists post_call_token text;

create unique index if not exists idx_admissions_leads_post_call_token
  on public.admissions_leads(post_call_token)
  where post_call_token is not null;

comment on column public.admissions_leads.post_call_token is
  'Single-use link to /post-call/<token>, the GA and FL decision page ten '
  'minutes after the inquiry call. Minted by the nightly scan when it finds '
  'the booking. Null everywhere else, including every Virtual and HS lead.';

-- ── 2. Three more outcomes ───────────────────────────────────────────────────
--
-- The constraint is looked up rather than named, for the reason 484 wrote out:
-- a hard-coded name that does not exist makes the drop a no-op and the add a
-- duplicate, and the failure would not show until a school leader pressed a
-- button.

do $$
declare
  v_name text;
begin
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'lead_call_outcomes'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%';

  if v_name is null then
    raise notice 'No outcome check constraint found — nothing to replace.';
  else
    execute format(
      'alter table public.lead_call_outcomes drop constraint %I', v_name
    );
  end if;

  alter table public.lead_call_outcomes
    add constraint lead_call_outcomes_outcome_check
    check (outcome in (
      -- The interest-meeting call, /call/<token>. These only RECORD.
      'spoke_will_book',
      'spoke_not_proceeding',
      'left_message',
      'no_answer',
      -- The five-day application call, /application-call/<token>. These ACT:
      -- the first re-sends the invitation, the second marks the lead declined.
      'application_resent',
      'application_not_proceeding',
      -- The post-call decision, /post-call/<token>. GA and FL only.
      -- The first sends the family the tour calendar and moves the child to
      -- Tour Requested; the second marks the lead declined and sends nothing;
      -- the third saves the notes and deliberately changes nothing at all.
      'tour_requested',
      'post_call_not_the_right_school',
      'post_call_follow_up'
    ));
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT four rows.
--
--   1  the column          post_call_token, 'present'
--   2  the index           'present'
--   3  COUNT outcomes      9. If it reads 6, section 2 did not run.
--   4  COUNT tour letters  0 — and zero is CORRECT today. It becomes 8 the
--                          day Jimmy's two letters are seeded at four
--                          campuses. Anything between 1 and 7 means a
--                          campus is missing one, which would look exactly
--                          like a leader who is simply quick.

select 1 as seq,
       'column' as what,
       'admissions_leads.post_call_token' as detail,
       case when exists (
         select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'admissions_leads'
            and column_name = 'post_call_token'
       ) then 'present' else '*** MISSING ***' end as state

union all

select 2,
       'index',
       'idx_admissions_leads_post_call_token',
       case when exists (
         select 1 from pg_indexes
          where schemaname = 'public'
            and indexname = 'idx_admissions_leads_post_call_token'
       ) then 'present' else '*** MISSING ***' end

union all

select 3,
       'COUNT outcomes the constraint allows',
       (
         select count(*)::text
           from pg_constraint con
           join pg_class rel on rel.oid = con.conrelid
          cross join lateral regexp_matches(
                       pg_get_constraintdef(con.oid), '''([a-z_]+)''', 'g'
                     ) as m(v)
          where rel.relname = 'lead_call_outcomes'
            and con.contype = 'c'
            and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%'
       ),
       case when (
         select count(*)
           from pg_constraint con
           join pg_class rel on rel.oid = con.conrelid
          cross join lateral regexp_matches(
                       pg_get_constraintdef(con.oid), '''([a-z_]+)''', 'g'
                     ) as m(v)
          where rel.relname = 'lead_call_outcomes'
            and con.contype = 'c'
            and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%'
       ) = 9 then 'all three new decisions can be recorded'
         else '*** THE POST-CALL BUTTONS WILL BE REFUSED ***' end

union all

select 4,
       'COUNT tour letters that exist',
       (
         select count(*)::text
           from public.admissions_communication_templates
          where trigger_event in ('staff_inquiry_call_held', 'tour_invitation_sent')
       ),
       'zero is correct until Jimmy writes them'

 order by seq;
