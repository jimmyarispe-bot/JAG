-- ============================================================================
-- 552  THE SHADOW DAY GETS ITS LETTER
--      14 October 2026
-- ============================================================================
--
-- WHY
--
-- The interest meeting has had a notes letter at its appointment since
-- 5 October. The tour got one on 13 October, migration 539. The shadow day
-- has never had one, and `accept_or_deny` opens at shadow_day_completed - a
-- stage nothing in the JAG has ever written. So after a shadow day, nothing:
-- no prompt, no decision, no acceptance and no decline.
--
-- Jimmy tested exactly that on the night of 13 October: application submitted,
-- shadow days invited, booked for 1:30am. "i didn't receive any followup email
-- with decision to accept or send denial letter."
--
-- ── THE WORDS ARE HIS ──────────────────────────────────────────────────────
--
-- Drafted from 539 - the tour letter he approved - with only what a shadow day
-- requires changed, and corrected twice by him on 14 October.
--
-- THE FIRST LINE. The draft read "{{student_full_name}}'s Shadow Days start
-- right now", written for a letter landing at the START. He then changed when
-- it fires, which made that line false, and gave the replacement himself:
--
--   "change to - ... shadow days completed for [student]"
--
-- THE SUBJECT had the identical fault - "happening now" - and he answered
-- "change to end language", then gave it outright:
--
--   "this should be subject - Shadow Days completed for {{student_full_name}}."
--
-- So the subject IS the first line of the body, word for word, full stop and
-- all. That is a deliberate departure from every other notes letter in this
-- platform, and the departure is worth naming rather than smoothing over:
--
--   the interest meeting  "Interest conversation w/ parent - ...; TAKE notes"
--   the tour              "Tour w/ parent - ...; TAKE notes"
--   the shadow day        "Shadow Days completed for Konnor Broyld."
--
-- WHAT THAT GIVES UP. The other two name the guardian in the subject and end
-- with "TAKE notes", so a leader scanning her inbox on a phone sees whose
-- family it is and what she is being asked to do without opening anything.
-- This one says neither. A row of these in an inbox reads as a record of
-- shadow days that happened rather than as four things waiting for her.
--
-- WHAT IT GAINS. It is unambiguous, it is true at the moment it arrives, and
-- it is what he asked for twice. His build, his words.
--
-- If he wants the guardian or "TAKE notes" back it is one update to one
-- column and nothing else moves.
--
-- ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────────
--
-- NO LINE ABOUT WHERE TO BE. The tour letter says "Meet {{guardian_name}} and
-- {{student_full_name}} at the school to start the tour." A shadow day is not
-- a meeting, and Virtual's is not at a school at all - it is online. Writing
-- one sentence would be wrong at one campus, and he has not given two. Absent
-- rather than invented.
--
-- NO {{meeting_link}}, for the same reason it is absent from the tour's
-- letter: three of the five campuses create no conference for this.
--
-- NO PRONOUN ANYWHERE. The child's name appears five times.
--
-- ── FIVE CAMPUS ROWS, NOT ONE NETWORK ROW ──────────────────────────────────
--
-- "2 days @ ga n fl, 1 day @ hs n virtual". GA, FL and the test campus read
-- "Shadow Days"; HS and Virtual read "Shadow Day". The difference is in the
-- SUBJECT as well as the body, so a merge field inside one shared letter
-- cannot carry it - the subject is rendered from the same row.
--
-- This is the shape inquiry_thank_you_email already uses for the same reason,
-- and the shape 540 had to be corrected for: there is no network parent here,
-- so there is no dead row left under these five to confuse anybody later.
--
-- ── IT IS INERT UNTIL THE CODE SHIPS ───────────────────────────────────────
--
-- Seeded ACTIVE. Nothing emits `staff_shadow_day_held` yet, and a trigger
-- event with no sender sends nothing, so this cannot reach a school leader
-- until the code that fires it is deployed. The ship is the arming step -
-- exactly as it was for 539, and for the same reason: migration 505 sat five
-- days unrun because it was seeded switched off and the second switch was
-- forgotten.
--
-- ============================================================================

begin;

-- ── THE LETTER, FIVE TIMES ─────────────────────────────────────────────────
--
-- Built from the campus list rather than pasted five times, so the only thing
-- that differs between the rows is the one word that is supposed to differ.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number, description)
select
  c.school_id,
  'staff_record_shadow_day_notes',
  'RECORD your notes - at the end of the shadow day(s)',
  'staff_email',
  'staff_shadow_day_held',
  c.words || ' completed for {{student_full_name}}.',
  /* Stored with \r\n, because every approved body in this table is, and a
     paragraph split looking for \n\n finds nothing in a \r\n body. */
  E'' || c.words || E' completed for {{student_full_name}}.\r\n\r\n'
    || E'Click on this RECORD YOUR NOTES button to document important information revealed in your time with them.\r\n\r\n'
    || E'Saving your notes will ask you whether to accept {{student_first_name}}.\r\n\r\n'
    || E'{{post_call_link}}\r\n\r\n'
    || E'{{student_full_name}}\r\n{{student_grade}}\r\n{{student_age}}\r\n{{parent_phone}}',
  0,
  true,
  'shadow_day',
  1,
  null
from (values
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'Shadow Days'),  -- FL
  ('a1000000-0000-4000-8000-000000000002'::uuid, 'Shadow Days'),  -- GA
  ('a1000000-0000-4000-8000-000000000003'::uuid, 'Shadow Day'),   -- HS
  ('a1000000-0000-4000-8000-000000000004'::uuid, 'Shadow Day'),   -- Virtual
  ('a1000000-0000-4000-8000-000000000005'::uuid, 'Shadow Days')   -- Test campus
) as c(school_id, words)
on conflict (school_id, template_key) do update set
  name          = excluded.name,
  channel       = excluded.channel,
  trigger_event = excluded.trigger_event,
  subject       = excluded.subject,
  body          = excluded.body,
  delay_hours   = excluded.delay_hours,
  is_active     = excluded.is_active,
  category      = excluded.category,
  updated_at    = now();

-- ── THE GUARDS ─────────────────────────────────────────────────────────────

do $$
declare
  n_keys    integer;
  n_rows    integer;
  n_plural  integer;
  n_single  integer;
  n_network integer;
begin
  -- TWO TEMPLATE KEYS ON ONE TRIGGER EVENT IS THE FAULT MIGRATIONS 494, 503
  -- AND 506 EACH HAD TO UNDO. getTemplatesForTrigger de-duplicates by KEY,
  -- not by event, so every key sharing an event survives and EVERY ONE SENDS.
  select count(distinct template_key) into n_keys
  from public.admissions_communication_templates
  where trigger_event = 'staff_shadow_day_held';
  if n_keys <> 1 then
    raise exception
      'Refusing: % template keys sit on staff_shadow_day_held, expected exactly 1.', n_keys;
  end if;

  select count(*) into n_rows
  from public.admissions_communication_templates
  where template_key = 'staff_record_shadow_day_notes';
  if n_rows <> 5 then
    raise exception 'Refusing: expected 5 campus rows, found %.', n_rows;
  end if;

  -- NO NETWORK PARENT. 540 had to be corrected because a switched-off network
  -- row nobody remembered was still sitting under five campus rows.
  select count(*) into n_network
  from public.admissions_communication_templates
  where template_key = 'staff_record_shadow_day_notes' and school_id is null;
  if n_network <> 0 then
    raise exception 'Refusing: a network row exists under the five campus rows.';
  end if;

  select count(*) into n_plural
  from public.admissions_communication_templates
  where template_key = 'staff_record_shadow_day_notes'
    and school_id in (
      'a1000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000005'
    )
    and subject = 'Shadow Days completed for {{student_full_name}}.'
    and body like 'Shadow Days completed for {{student_full_name}}.%';
  if n_plural <> 3 then
    raise exception
      'Refusing: % of GA, FL and the test campus read "Shadow Days", expected 3.', n_plural;
  end if;

  select count(*) into n_single
  from public.admissions_communication_templates
  where template_key = 'staff_record_shadow_day_notes'
    and school_id in (
      'a1000000-0000-4000-8000-000000000003',
      'a1000000-0000-4000-8000-000000000004'
    )
    and subject = 'Shadow Day completed for {{student_full_name}}.'
    and body like 'Shadow Day completed for {{student_full_name}}.%';
  if n_single <> 2 then
    raise exception
      'Refusing: % of HS and Virtual read "Shadow Day", expected 2.', n_single;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - read every line back, as a school leader will
-- ============================================================================

select s.name as campus, t.subject, t.is_active
from public.admissions_communication_templates t
join public.schools s on s.id = t.school_id
where t.template_key = 'staff_record_shadow_day_notes'
order by s.name;

-- One campus's letter in full, with its line breaks as a human reads them.
select s.name as campus, replace(t.body, E'\r\n', E'\n') as body
from public.admissions_communication_templates t
join public.schools s on s.id = t.school_id
where t.template_key = 'staff_record_shadow_day_notes'
  and s.name in ('The Academy GA', 'The Academy Virtual')
order by s.name;

-- Every merge field the letter uses, so a typo shows up here rather than as
-- "{{student_nmae}}" in Danni's inbox.
select distinct m[1] as merge_field
from public.admissions_communication_templates t,
     regexp_matches(t.subject || ' ' || t.body, '\{\{(\w+)\}\}', 'g') as m
where t.template_key = 'staff_record_shadow_day_notes'
order by 1;
