-- ============================================================================
-- 554  THE DENIAL AFTER A SHADOW DAY
--      14 October 2026
-- ============================================================================
--
-- WHY
--
-- The shadow day step shipped this morning with two buttons, Jimmy's words:
-- "accept-send email, deny-send email". Accept sends. Deny did not - it
-- recorded the decision, marked the days held, moved the child to Declined and
-- sent the family NOTHING, and the page said so in as many words rather than
-- printing a promise it could not keep.
--
-- The reason was that there is no approved decline letter for a decision at
-- this step. The only one in the JAG, application_declined_email (migration
-- 247), is keyed to shadow_days_not_invited - a refusal to INVITE a family to
-- shadow days. Firing it after two shadow days would tell the family, and the
-- record, that they were refused days they had just attended.
--
-- ── THE WORDS ARE HIS, AND THREE OF THE FOUR PARAGRAPHS ARE VERBATIM ────────
--
-- Asked for the one sentence that could not transfer, Jimmy answered on
-- 14 October. The proposal put to him was:
--
--   "Thank you for spending the last two days with us."
--
-- and his answer was "yes good". Everything after it is lifted WORD FOR WORD
-- from application_declined_email, which he wrote:
--
--   "After thorough review and full, thoughtful consideration, we are not able
--    to move {{student_first_name}} forward in the admissions process."
--
--   "We want to be clear about what this decision means. It is not a negative
--    reflection on {{student_first_name}}. It reflects our school's inability
--    to provide the support {{student_first_name}} needs to be successful
--    here."
--
--   "We wish you the very best in identifying a school where
--    {{student_first_name}} can thrive."
--
-- NOT ONE WORD OF THOSE THREE IS CHANGED. The sign-off is his too.
--
-- ── FIVE ROWS, BECAUSE HE SAID "read naturally" ─────────────────────────────
--
-- Asked whether this should read "day(s)" and stay one network row - the
-- choice he made for the booking confirmation on this same morning - or become
-- five campus rows so each reads naturally, he answered: "read naturally".
--
--   GA, FL, Test Campus   "Thank you for spending the last two days with us."
--   HS, Virtual           "Thank you for spending the day with us."
--
-- Two shadow days at GA and FL, one at HS and Virtual - "2 days @ ga n fl,
-- 1 day @ hs n virtual", 14 October. The same shape as
-- staff_record_shadow_day_notes and inquiry_thank_you_email, and for the same
-- reason: a merge field cannot carry a difference the SUBJECT also needs, and
-- a sentence read by a parent should not have a bracket in it.
--
-- There is NO NETWORK PARENT under these five. Migration 540 had to be
-- corrected because a switched-off network row nobody remembered was sitting
-- under five campus rows; the guard below refuses if one appears here.
--
-- ── THE SUBJECT DROPS "application" FOR THE SAME REASON THE OPENING DID ─────
--
--   His:   "Regarding {{student_name}}'s application to {{school_name}}"
--   Here:  "Regarding {{student_first_name}} at {{school_name}}"
--
-- The decision is no longer about a form. {{student_first_name}} rather than
-- {{student_name}}, because every other sentence in this letter uses the first
-- name and a subject line that uses the full name and a body that does not is
-- the kind of seam a parent notices. Same at all five campuses - the day count
-- does not appear in it.
--
-- ── WHERE IT FIRES FROM, AND THE GUARD IN THE CODE ─────────────────────────
--
-- trigger_event `student_declined`, which LEGACY_EVENT_MAP already reaches from
-- the workflow trigger `declined`. Three things produce a `declined`: the
-- shadow day letter's Deny button, the accept_or_deny gate's deny branch, and
-- the DecisionWizard on the decisions board. The first two only ever happen at
-- shadow_day_completed. The third can be used at any stage.
--
-- SO THE CODE WILL NOT SEND THIS TO A FAMILY WHO NEVER VISITED.
-- applyAdmissionsDecision now reads admissions_shadow_days for a COMPLETED row
-- before it dispatches a denial, and sends nothing when there is none - exactly
-- as it behaved yesterday. A letter that opens "thank you for spending the last
-- two days with us" must not reach somebody who did not.
--
-- ── IT DOES NOT RESURRECT WHAT 366 DELETED ─────────────────────────────────
--
-- student_declined_email - migration 068 seed data, "We are unable to offer
-- enrollment... You may reapply in a future enrollment period" - was deleted on
-- 15 September when Jimmy said "delete these. never approved these." It was on
-- this same trigger event, which is why this file is careful:
--
--   * the key is shadow_day_declined_email, not student_declined_email
--   * the guard below refuses if student_declined_email has come back
--   * the guard refuses if more than one key sits on student_declined, which is
--     the fault migrations 494, 503 and 506 each had to undo
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_deleted integer;
  n_keys    integer;
begin
  -- THE UNAPPROVED ONE MUST STILL BE GONE.
  select count(*) into n_deleted
  from public.admissions_communication_templates
  where template_key = 'student_declined_email';
  if n_deleted <> 0 then
    raise exception
      'Refusing: student_declined_email is back. Migration 366 deleted it as unapproved - find out who restored it before adding another letter to this trigger.';
  end if;

  -- AND NOTHING ELSE MAY ALREADY BE LISTENING ON THIS EVENT.
  -- getTemplatesForTrigger de-duplicates by KEY, not by event, so every key
  -- sharing an event survives and EVERY ONE SENDS.
  select count(distinct template_key) into n_keys
  from public.admissions_communication_templates
  where trigger_event = 'student_declined'
    and template_key <> 'shadow_day_declined_email';
  if n_keys <> 0 then
    raise exception
      'Refusing: % other template key(s) already sit on student_declined.', n_keys;
  end if;
end $$;

-- ── THE LETTER, FIVE TIMES ─────────────────────────────────────────────────
--
-- Built from the campus list rather than pasted five times, so the only thing
-- that differs between the rows is the one clause that is supposed to differ.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number, description)
select
  c.school_id,
  'shadow_day_declined_email',
  'Decision after the shadow day(s) - not moving forward',
  'email',
  'student_declined',
  'Regarding {{student_first_name}} at {{school_name}}',
  /* Stored with \r\n, because every approved body in this table is, and a
     paragraph split looking for \n\n finds nothing in a \r\n body. */
  E'Dear {{guardian_first_name}},\r\n\r\n'
    || E'Thank you for spending ' || c.visit || E' with us. '
    || E'After thorough review and full, thoughtful consideration, we are not able to move {{student_first_name}} forward in the admissions process.\r\n\r\n'
    || E'We want to be clear about what this decision means. It is not a negative reflection on {{student_first_name}}. It reflects our school''s inability to provide the support {{student_first_name}} needs to be successful here.\r\n\r\n'
    || E'We wish you the very best in identifying a school where {{student_first_name}} can thrive.\r\n\r\n'
    || E'Warm regards,\r\n{{admissions_contact_name}}\r\n{{school_name}} Admissions',
  0,
  true,
  'general',
  1,
  null
from (values
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'the last two days'),  -- FL
  ('a1000000-0000-4000-8000-000000000002'::uuid, 'the last two days'),  -- GA
  ('a1000000-0000-4000-8000-000000000003'::uuid, 'the day'),            -- HS
  ('a1000000-0000-4000-8000-000000000004'::uuid, 'the day'),            -- Virtual
  ('a1000000-0000-4000-8000-000000000005'::uuid, 'the last two days')   -- Test
) as c(school_id, visit)
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

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  n_rows    integer;
  n_two     integer;
  n_one     integer;
  n_network integer;
  n_his     integer;
  n_old     integer;
begin
  select count(*) into n_rows
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email';
  if n_rows <> 5 then
    raise exception 'Refusing: expected 5 campus rows, found %.', n_rows;
  end if;

  select count(*) into n_network
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email' and school_id is null;
  if n_network <> 0 then
    raise exception 'Refusing: a network row exists under the five campus rows.';
  end if;

  -- "read naturally" - his answer, checked.
  select count(*) into n_two
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email'
    and school_id in (
      'a1000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000005'
    )
    and body like '%Thank you for spending the last two days with us.%';
  if n_two <> 3 then
    raise exception
      'Refusing: % of GA, FL and the test campus read "the last two days", expected 3.', n_two;
  end if;

  select count(*) into n_one
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email'
    and school_id in (
      'a1000000-0000-4000-8000-000000000003',
      'a1000000-0000-4000-8000-000000000004'
    )
    and body like '%Thank you for spending the day with us.%';
  if n_one <> 2 then
    raise exception
      'Refusing: % of HS and Virtual read "the day", expected 2.', n_one;
  end if;

  -- HIS THREE PARAGRAPHS, WORD FOR WORD, IN ALL FIVE.
  select count(*) into n_his
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email'
    and body like '%After thorough review and full, thoughtful consideration, we are not able to move {{student_first_name}} forward in the admissions process.%'
    and body like '%It is not a negative reflection on {{student_first_name}}. It reflects our school''s inability to provide the support {{student_first_name}} needs to be successful here.%'
    and body like '%We wish you the very best in identifying a school where {{student_first_name}} can thrive.%';
  if n_his <> 5 then
    raise exception
      'Refusing: his three paragraphs are intact in only % of 5 rows.', n_his;
  end if;

  -- NOT ONE WORD OF THE DELETED SEED LETTER.
  select count(*) into n_old
  from public.admissions_communication_templates
  where template_key = 'shadow_day_declined_email'
    and (body ilike '%unable to offer enrollment%'
      or body ilike '%reapply in a future enrollment period%');
  if n_old <> 0 then
    raise exception 'Refusing: wording from the deleted student_declined_email is in this letter.';
  end if;

  -- AND HIS GATE-2 LETTER IS UNTOUCHED.
  select count(*) into n_old
  from public.admissions_communication_templates
  where template_key = 'application_declined_email'
    and trigger_event = 'shadow_days_not_invited'
    and is_active;
  if n_old <> 1 then
    raise exception 'Refusing: application_declined_email has moved. This file must not touch it.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - read it back as a parent will
-- ============================================================================

select s.name as campus, t.subject, t.is_active
from public.admissions_communication_templates t
join public.schools s on s.id = t.school_id
where t.template_key = 'shadow_day_declined_email'
order by s.name;

-- One of each, in full, with its line breaks as a human reads them.
select s.name as campus, replace(t.body, E'\r\n', E'\n') as body
from public.admissions_communication_templates t
join public.schools s on s.id = t.school_id
where t.template_key = 'shadow_day_declined_email'
  and s.name in ('The Academy GA', 'The Academy Virtual')
order by s.name;

-- Every merge field, so a typo shows up here rather than in a parent's inbox.
select distinct m[1] as merge_field
from public.admissions_communication_templates t,
     regexp_matches(t.subject || ' ' || t.body, '\{\{(\w+)\}\}', 'g') as m
where t.template_key = 'shadow_day_declined_email'
order by 1;

-- One key on this event, and the deleted one still gone.
select trigger_event, template_key, count(*) as rows
from public.admissions_communication_templates
where trigger_event = 'student_declined'
   or template_key = 'student_declined_email'
group by 1, 2;
