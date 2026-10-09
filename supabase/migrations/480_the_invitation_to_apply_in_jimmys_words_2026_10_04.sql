-- 480_the_invitation_to_apply_in_jimmys_words_2026_10_04.sql
--
-- The letter a family gets when a school leader answers "yes, invite them to
-- apply". Rewritten by Jimmy on 3 October, reading the live version.
--
-- WHAT CHANGED, AND WHY EACH ONE MATTERS.
--
-- 1. FIRST NAMES, EVERYWHERE.
--
--    The letter opened "Dear {{parent_name}}", and parent_name renders the
--    FULL name - "Dear Maria Tondreau,". The subject and the body carried
--    {{student_name}}, which is the child's full name too. Every other letter
--    in the chain uses first names, and this is the one asking a family to
--    commit an hour and a hundred dollars.
--
--    There is a second reason beyond warmth. When a guardian's name is
--    missing, parent_name falls back to the literal word "Family" - so an
--    incomplete record produces "Dear Family,". guardian_first_name falls
--    back to "there", which is plainer and reads less like a mail merge that
--    came up empty.
--
-- 2. "REPLY TO THIS EMAIL AND IT WILL REACH ME DIRECTLY."
--
--    It said "...will reach {{admissions_contact_name}} directly" and then
--    signed off with that same name three lines later. A letter signed by
--    Heather should not refer to Heather in the third person. "me" is both
--    warmer and more accurate.
--
--    The promise itself is true and was checked before this shipped: the
--    engine sets reply-to to the campus admissions contact on every letter
--    sent on channel 'email', so a reply does reach her inbox.
--
-- 3. "your application" -> "application" in the subject. Jimmy's edit. The
--    subject already names the child and the school; the possessive was doing
--    nothing.
--
-- The only departure from his text is a double space between the child's name
-- and the dash in the subject, which is a typo rather than an instruction.
--
-- ONE ROW IS EXPECTED TO CHANGE. If a campus has overridden this template the
-- update below leaves that override alone, and the verify will show both -
-- which is itself worth seeing, because it would mean one campus has been
-- saying something different all along.

begin;

update public.admissions_communication_templates
   set subject = 'Next step for {{student_first_name}} — application to {{school_name}}',
       body = $letter$Dear {{guardian_first_name}},

Thank you for the time you spent with us talking about {{student_first_name}}. We would like to invite you to complete an application for admission to {{school_name}}.

You can begin here: {{application_link}}

You will not need to repeat anything you already told us on your inquiry — that information is already on the application.

If you have questions at any point, reply to this email and it will reach me directly.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions$letter$,
       updated_at = now()
 where template_key = 'application_invite_email'
   and school_id is null;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT one row, "every campus", reading exactly as Jimmy wrote it.
--
-- CHECK THE FOUR TOKENS ARE STILL SPELLED RIGHT. renderTemplate leaves an
-- unknown token in place as literal text, so a typo here does not fail - it
-- mails a family the characters {{guardian_frist_name}}. The names that must
-- appear are: student_first_name, guardian_first_name, school_name,
-- application_link, admissions_contact_name.
--
-- A second row means a campus holds its own version, which this did not
-- touch. Read it and decide whether it should.

select coalesce(sc.name, 'every campus')                              as applies_to,
       case when t.is_active then 'ON' else '*** switched off ***' end as state,
       t.subject,
       t.body,
       case when t.body like '%{{guardian_first_name}}%'
             and t.body like '%{{student_first_name}}%'
             and t.body like '%{{application_link}}%'
            then 'tokens present'
            else '*** A TOKEN IS MISSING OR MISSPELLED ***' end        as token_check,
       t.updated_at

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'application_invite_email'
 order by applies_to;
