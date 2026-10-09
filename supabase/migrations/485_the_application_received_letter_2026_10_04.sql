-- 485_the_application_received_letter_in_jimmys_words_2026_10_04.sql
--
-- The letter a family gets the moment they press Submit.
--
-- WHAT IT SAID UNTIL NOW. Seeded in migration 068 - the original July seed -
-- and never rewritten. Migration 482 this morning changed its greeting from
-- {{parent_name}} to {{guardian_first_name}} and nothing else, so this is the
-- exact live text, verbatim:
--
--     Subject: Application received — {{student_name}}
--
--     Dear {{guardian_first_name}},
--
--     We received {{student_name}}'s application.
--
--     Timeline:
--     1. Document review (3-5 business days)
--     2. Admissions review
--     3. Decision within {{decision_timeframe}}
--
--     Portal: {{portal_link}}
--
-- THREE THINGS WRONG WITH IT, all of which this removes.
--
--   1. {{portal_link}} RESOLVES TO A PASSWORD BOX. It renders
--      /apply/portal/<application id>, and that route calls
--      redirect("/login?next=/apply/portal") for anyone not signed in.
--      Families have no account. It is the last line of the letter, so it is
--      the thing a parent clicks. The token link at /apply/start/<token>
--      exists precisely because the portal does this.
--
--   2. {{decision_timeframe}} IS HARDCODED IN THE SOURCE. It is the literal
--      string "2–3 weeks" in merge-fields.ts, not a campus setting. Nobody at
--      a campus can change it and nothing checks whether it is true.
--
--   3. IT CONTRADICTED THE LETTER BEFORE IT. Migration 483, two hours earlier,
--      tells the family "Once we have read the application we will send you a
--      link to schedule the Shadow Days." This one then said document review,
--      admissions review, decision in 2-3 weeks, and never mentioned a shadow
--      day. Two different accounts of what happens next, days apart.
--
-- THE WORDS BELOW ARE JIMMY'S, 4 October 2026, verbatim. The only departures
-- are trailing spaces at the ends of three lines, which are paste artefacts
-- rather than instructions.
--
-- ONE THING HE SHOULD LOOK AT AGAIN, NOT CHANGED HERE.
--
--   "which normally involves scheduling your Shadow Days"
--
-- This letter is one row serving all four campuses. At GA and FL that
-- sentence is exactly right and matches what 483 already promised. At AV and
-- HS the shadow day has ALREADY HAPPENED by the time a family applies - that
-- is the fork decided on 3 October - so a Virtual or HS parent reads that they
-- are about to schedule a day their child has already spent at the school.
-- The word "normally" softens it rather than fixing it. A campus override at
-- AV and HS is two more rows whenever he wants them.
--
-- ONE ROW IS EXPECTED TO CHANGE. A campus override, if one exists, is left
-- alone and the verify will show it.

begin;

update public.admissions_communication_templates
   set subject = 'We have {{student_first_name}}''s application — {{school_name}}',
       body = $letter$Dear {{guardian_first_name}},

Thank you for submitting {{student_first_name}}'s application for admission to our school.

I will review it myself as quickly as possible and then email you with the next step, which normally involves scheduling your Shadow Days.

There is nothing else for you to do in the meantime. If you have questions at any point, reply to this email and it will reach me directly. You will hear from me shortly.

Thank you,
{{admissions_contact_name}}
{{school_name}} Admissions$letter$,
       updated_at = now()
 where template_key = 'application_submitted_email'
   and school_id is null;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT one row, "every campus", ON, reading exactly as above.
--
-- THE FOUR CHECKS ARE THE POINT.
--
--   token_check    renderTemplate leaves an unknown token in place as literal
--                  text, so a misspelling does not fail - it mails a family
--                  the characters {{student_frist_name}}. Four tokens must be
--                  present: guardian_first_name, student_first_name,
--                  school_name, admissions_contact_name.
--
--   link_check     the letter must carry NO link at all. {{portal_link}} is
--                  the password box this migration exists to remove.
--
--   timeframe      {{decision_timeframe}} is the hardcoded "2–3 weeks".
--
--   full_name      {{student_name}} is the child's FULL name. Every letter a
--                  family reads uses the first name now.

select coalesce(sc.name, 'every campus')                               as applies_to,
       case when t.is_active then 'ON' else '*** switched off ***' end as state,
       t.subject,
       t.body,
       case when t.subject like '%{{student_first_name}}%'
             and t.body like '%{{guardian_first_name}}%'
             and t.body like '%{{student_first_name}}%'
             and t.body like '%{{admissions_contact_name}}%'
             and t.body like '%{{school_name}}%'
            then 'all four tokens present'
            else '*** A TOKEN IS MISSING OR MISSPELLED ***' end        as token_check,
       case when t.body like '%{{portal_link}}%'
             or t.body like '%http%'
            then '*** STILL SENDS THEM TO A LINK ***'
            else 'no link — nothing for them to click' end             as link_check,
       case when t.body like '%{{decision_timeframe}}%'
            then '*** STILL PROMISES THE HARDCODED 2-3 WEEKS ***'
            else 'no hardcoded timeframe' end                          as timeframe_check,
       case when t.subject like '%{{student_name}}%'
             or t.body like '%{{student_name}}%'
            then '*** STILL USES THE FULL NAME ***'
            else 'first name only' end                                 as full_name_check,
       t.updated_at

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'application_submitted_email'
 order by applies_to;
