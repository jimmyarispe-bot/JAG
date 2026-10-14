-- ============================================================================
-- 551  THE INSTRUCTIONS ARE IN THE INVITE
--      14 October 2026
-- ============================================================================
--
-- JIMMY, 14 OCTOBER 2026, asked which letter this line belonged in and
-- answered "shadow day confirmation":
--
--   "specific instructions about the day(s) are included in the calendar
--    invite. Please see those instructions so you and [student] know what/how
--    to prepare."
--
-- That is shadow_day_booked_email - the confirmation a family gets when they
-- book, trigger shadow_day_scheduled, which he marked "content is fine" on
-- 13 October and which has never fired once, with eight children waiting
-- behind it.
--
-- ── IT REPLACES A SENTENCE, IT DOES NOT ADD ONE ────────────────────────────
--
-- The third paragraph already ended with:
--
--   "Please check the shadow day calendar invite/confirmation for specific
--    details concerning the day."
--
-- Which says the same thing less plainly and asks nothing of the reader. His
-- line says where the instructions are AND why to read them - so a parent and
-- a child know how to prepare. Keeping both would say it twice.
--
-- So the paragraph goes from:
--
--   A shadow day is exactly what it sounds like - {{student_first_name}}
--   spends the day with us and participates in the same classes our current
--   students attend. Please check the shadow day calendar
--   invite/confirmation for specific details concerning the day.
--
-- to:
--
--   A shadow day is exactly what it sounds like - {{student_first_name}}
--   spends the day with us and participates in the same classes our current
--   students attend. Specific instructions about the day(s) are included in
--   the calendar invite. Please see those instructions so you and
--   {{student_first_name}} know what/how to prepare.
--
-- NOT ONE OTHER WORD CHANGES. The greeting, the first paragraph, the sign-off
-- and the subject are exactly as he approved them.
--
-- ── "day(s)" IS HIS, TYPED THAT WAY, AND IT STAYS ONE NETWORK ROW ───────────
--
-- GA, FL and the test campus run two shadow days and HS and Virtual run one,
-- so a campus-perfect letter would read "days" at three campuses and "day" at
-- two - five rows under one key, the way inquiry_thank_you_email works.
--
-- He wrote "day(s)". Taking him literally keeps this one network row, keeps
-- the letter he already approved intact, and does not multiply a letter into
-- five to win one character. If he wants it to read naturally per campus that
-- is a later migration and a deliberate choice, not something to assume at
-- one in the morning.
--
-- The rest of the letter still says "shadow day" and "the day" singular, which
-- is the wording he approved on 13 October. This file does not touch it.
--
-- ── [student] IS THE FIRST NAME ────────────────────────────────────────────
--
-- {{student_first_name}}, the same field the rest of this letter already uses
-- in all three of its other mentions. Jimmy, standing rule: "always use
-- child's name" - never a pronoun.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_rows integer;
  n_old  integer;
begin
  select count(*) into n_rows
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email';

  if n_rows <> 1 then
    raise exception
      'Refusing: expected exactly 1 shadow_day_booked_email row, found %.', n_rows;
  end if;

  select count(*) into n_old
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email'
    and school_id is null
    and body like '%Please check the shadow day calendar invite/confirmation for specific details concerning the day.%';

  if n_old <> 1 then
    raise exception
      'Refusing: the sentence this file replaces is not in the letter. It may already have run, or the letter has changed.';
  end if;
end $$;

-- ── THE EDIT ───────────────────────────────────────────────────────────────
--
-- replace(), not a pasted body. The rest of this letter is approved and
-- untouched, and a full paste is a second place every one of its other words
-- is written down.

update public.admissions_communication_templates
   set body = replace(
         body,
         'Please check the shadow day calendar invite/confirmation for specific details concerning the day.',
         'Specific instructions about the day(s) are included in the calendar invite. Please see those instructions so you and {{student_first_name}} know what/how to prepare.'
       ),
       updated_at = now()
 where template_key = 'shadow_day_booked_email'
   and school_id is null;

-- ── THE GUARD, AFTER ───────────────────────────────────────────────────────

do $$
declare
  n_new      integer;
  n_old      integer;
  n_intact   integer;
  n_subject  integer;
begin
  select count(*) into n_new
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email'
    and body like '%Specific instructions about the day(s) are included in the calendar invite.%'
    and body like '%so you and {{student_first_name}} know what/how to prepare.%';
  if n_new <> 1 then
    raise exception 'Refusing: the new sentence did not land.';
  end if;

  select count(*) into n_old
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email'
    and body like '%Please check the shadow day calendar%';
  if n_old <> 0 then
    raise exception 'Refusing: the sentence it replaces is still there.';
  end if;

  -- Everything else he approved must still be word for word.
  select count(*) into n_intact
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email'
    and body like 'Dear {{guardian_first_name}},%'
    and body like '%{{student_first_name}}''s shadow day at {{school_name}} is scheduled for {{interview_datetime}}.%'
    and body like '%A shadow day is exactly what it sounds like%'
    and body like '%spends the day with us and participates in the same classes our current students attend.%'
    and body like '%Warmly,%'
    and body like '%{{admissions_contact_name}}%';
  if n_intact <> 1 then
    raise exception 'Refusing: something else in the approved letter changed.';
  end if;

  select count(*) into n_subject
  from public.admissions_communication_templates
  where template_key = 'shadow_day_booked_email'
    and subject = 'Shadow day for {{student_first_name}} at {{school_name}}';
  if n_subject <> 1 then
    raise exception 'Refusing: the subject line moved and this file must not touch it.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION - read it back as a parent will
-- ============================================================================

select subject from public.admissions_communication_templates
where template_key = 'shadow_day_booked_email';

select replace(body, E'\r\n', E'\n') as body
from public.admissions_communication_templates
where template_key = 'shadow_day_booked_email';

-- Every merge field it uses, so a typo shows up here and not in a parent's
-- inbox.
select distinct m[1] as merge_field
from public.admissions_communication_templates t,
     regexp_matches(t.subject || ' ' || t.body, '\{\{(\w+)\}\}', 'g') as m
where t.template_key = 'shadow_day_booked_email'
order by 1;
