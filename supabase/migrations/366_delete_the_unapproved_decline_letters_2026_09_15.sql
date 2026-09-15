-- ===========================================================================
-- TWO DECLINE LETTERS NOBODY APPROVED
-- 15 September 2026
-- ===========================================================================
--
-- Jimmy, 15 September: "delete these. never approved these."
--
-- THE LETTER HE WROTE, which stays, is application_declined_email from
-- migration 247:
--
--   "It is not a negative reflection on {{student_name}}. It reflects our
--    school's inability to provide the support {{student_name}} needs to be
--    successful here."
--
-- It fires on gate 2's "no" — declined after a full application.
--
-- THE ONE THIS DELETES is student_declined_email from migration 068:
--
--   "After careful review, we are unable to offer enrollment to
--    {{student_name}} at this time. You may reapply in a future enrollment
--    period."
--
-- Nobody wrote that for this school. It arrived with the seed data in 068 and
-- has been the letter a declined family actually receives ever since.
--
-- IT WAS NOT DORMANT, AND THE FIRST READING OF THIS SAID IT WAS
--
-- Gate 3's deny dispatches the workflow event `declined`, and every template is
-- keyed on `student_declined`. Those are different strings, which looks like a
-- dead end — and was reported as one. It is not. LEGACY_EVENT_MAP in
-- src/lib/admissions/automation/dispatch.ts maps declined -> student_declined,
-- so the letter sends. The mismatch is real and the mapping is real, and only
-- reading both tells you which wins.
--
-- WHAT THIS DOES NOT DO: PUT A DIFFERENT LETTER IN ITS PLACE
--
-- The obvious move is to copy the approved gate-2 wording onto this trigger.
-- That is a decision about what a family is told at the hardest moment in the
-- process, and it belongs to the person who wrote the approved letter, not to
-- the migration deleting the unapproved one.
--
-- So after this runs, a gate-3 deny sends the family NOTHING. That is a
-- deliberate, visible gap rather than a quiet wrong letter, and the code change
-- shipped alongside makes it refuse to record an email as sent when no approved
-- letter exists. The staff-facing record still says the decision was made.
--
-- Idempotent.
-- ===========================================================================

begin;

-- Keep a copy of what was there, so "what did that letter say" is answerable
-- later without reading migration 068.
create table if not exists public.admissions_retired_templates (
  id              uuid primary key default gen_random_uuid(),
  template_key    text not null,
  trigger_event   text,
  subject         text,
  body            text,
  retired_at      timestamptz not null default now(),
  retired_reason  text not null
);

insert into public.admissions_retired_templates
  (template_key, trigger_event, subject, body, retired_reason)
select t.template_key, t.trigger_event, t.subject, t.body,
       'Never approved. Seeded by migration 068; deleted 15 Sep 2026 on Jimmy''s instruction.'
from public.admissions_communication_templates t
where t.template_key = 'student_declined_email'
  and not exists (
    select 1 from public.admissions_retired_templates r
     where r.template_key = t.template_key
  );

delete from public.admissions_communication_templates
where template_key = 'student_declined_email';

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. The unapproved letter is gone. EXPECT NOTHING.
select '1. STILL PRESENT' as check, template_key as detail, trigger_event as extra
from public.admissions_communication_templates
where template_key = 'student_declined_email'

union all

-- 2. It was kept, not just destroyed.
select '2. retired copy', template_key, left(coalesce(body, ''), 60)
from public.admissions_retired_templates

union all

-- 3. The approved letter is untouched. EXPECT one row, gate 2's no.
select '3. approved letter', template_key, trigger_event
from public.admissions_communication_templates
where template_key = 'application_declined_email'

union all

-- 4. What now listens for student_declined. EXPECT NOTHING — the deliberate
--    gap. A row here means something else would send in its place.
select '4. still listening', template_key, trigger_event
from public.admissions_communication_templates
where trigger_event = 'student_declined'

order by 1, 2;
