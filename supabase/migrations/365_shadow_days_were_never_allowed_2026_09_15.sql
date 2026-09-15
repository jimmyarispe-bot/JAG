-- ===========================================================================
-- THE SHADOW DAY THE DATABASE HAS ALWAYS REFUSED
-- 15 September 2026
-- ===========================================================================
--
-- Found by the new booking dialog refusing to save, out loud, within an hour of
-- shipping:
--
--   new row for relation "admissions_interviews" violates check constraint
--   "admissions_interviews_interview_type_check"
--
-- FROM MIGRATION 070, LINE 38:
--
--   interview_type text not null default 'virtual'
--     check (interview_type in ('virtual', 'in_person', 'phone')),
--
-- THREE PLACES IN THE CODEBASE WRITE 'initial_assessment'
--
--   1. src/components/admissions/experience/InterviewDecisionPanel.tsx — the
--      staff panel's own "Assessment interview" option, which is how a shadow
--      day is booked from the case screen.
--   2. src/lib/sis/activation.ts — the Admissions-to-Active-Student workflow.
--   3. The new pipeline board dialog.
--
-- None of them could ever have succeeded. The value has never been permitted.
--
-- AND THIS IS PROBABLY WHERE THE SHADOW-DAY HALF OF THE 28 CAME FROM
--
-- scheduleInterview awaited that insert and discarded the result — the house
-- pattern — so the refusal was invisible. The interview was never written and
-- the stage moved to shadow_day_scheduled anyway. A member of staff booked a
-- shadow day, saw it succeed, and the database had quietly declined.
--
-- That is exactly the 28: a stage claiming an appointment with nothing behind
-- it. Ten of them are shadow days. The error check shipped today (c420845d) is
-- the only reason this surfaced at all.
--
-- A FOURTH THING, QUIETER
--
-- activation.ts also READS these rows:
--
--   .eq("interview_type", "initial_assessment")
--
-- looking for an existing assessment before creating one. No such row can
-- exist, so that read has always returned nothing — the sibling failure, a
-- plausible empty answer rather than an error.
--
-- WHAT THIS DOES
--
-- Adds 'initial_assessment' to the permitted values. It does NOT invent a new
-- vocabulary: three separate places already agreed on this spelling, and the
-- constraint is the only thing that disagreed. Changing the code in three
-- places to match the constraint would break the reader in activation.ts and
-- rename a concept the rest of the system already has a word for.
--
-- Nothing is backfilled. The bookings that were refused are gone — there is no
-- record of what date anybody chose, and inventing one would be worse than the
-- gap. Those families are in the 28 and need a phone call.
--
-- Idempotent: drops the constraint by name and recreates it.
-- ===========================================================================

begin;

alter table public.admissions_interviews
  drop constraint if exists admissions_interviews_interview_type_check;

alter table public.admissions_interviews
  add constraint admissions_interviews_interview_type_check
  check (interview_type in ('virtual', 'in_person', 'phone', 'initial_assessment'));

comment on column public.admissions_interviews.interview_type is
  'virtual | in_person | phone | initial_assessment. initial_assessment is a '
  'shadow day — the spelling used by InterviewDecisionPanel, sis/activation.ts '
  'and the pipeline board dialog. It was omitted from the original check in 070 '
  'and every attempt to book one was silently refused until 15 September 2026.';

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. The constraint now permits all four. EXPECT the definition to contain
--    initial_assessment.
select
  '1. constraint' as check,
  con.conname as detail,
  pg_get_constraintdef(con.oid) as extra
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'admissions_interviews'
  and con.conname = 'admissions_interviews_interview_type_check'

union all

-- 2. What is actually in the table today, by type. EXPECT NO initial_assessment
--    rows at all — that is the proof that every shadow day booking ever made
--    through the app was refused. If any exist, this migration's story is wrong
--    and should be re-read before trusting it.
select '2. existing rows', coalesce(interview_type, '(null)'), count(*)::text
from public.admissions_interviews
group by interview_type

union all

-- 3. The families whose stage says shadow day. EXPECT the count with no
--    interview row to match what migration 361 found.
select
  '3. shadow day stage',
  s.name,
  count(*) filter (where not exists (
    select 1 from public.admissions_interviews i where i.lead_id = l.id
  ))::text || ' of ' || count(*)::text || ' with no interview at all'
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.archived_at is null
  and l.lead_stage = 'shadow_day_scheduled'
group by s.name

order by 1, 2;
