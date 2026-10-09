-- 483_the_invitation_to_apply_in_jimmys_words_second_pass_2026_10_04.sql
--
-- The invitation to apply, rewritten again by Jimmy on 4 October after
-- reading the version 480 shipped this morning.
--
-- WHAT CHANGED FROM 480.
--
-- 1. "the time you spent with us" -> "the time you spent with me earlier so
--    that I could learn about {{student_first_name}}". The letter is signed by
--    one person and now speaks as one person throughout, which it did not:
--    "us ... we would like to invite you" then a single signature.
--
-- 2. IT NOW SAYS WHY THE APPLICATION EXISTS. The old letter asked for an
--    application and gave no reason. This one names the thing the family
--    actually wants - "before we can schedule {{student_first_name}}'s shadow
--    days" - so the hundred dollars and the hour buy a visible next step
--    rather than a place in a queue.
--
-- 3. IT TELLS THEM WHAT HAPPENS AFTER THEY SUBMIT. New sentence.
--
-- 4. "Warm regards," -> "Thank you,". Jimmy's sign-off.
--
-- THREE DEPARTURES FROM HIS TEXT, ALL NAMED.
--
--   a) "complete and Application for Admission" -> "an Application for
--      Admission". Typo.
--
--   b) HIS SENTENCE ABOUT WHAT HAPPENS AFTER SUBMISSION WAS CHANGED, WITH HIS
--      APPROVAL, BECAUSE THE PLATFORM DOES NOT DO WHAT IT PROMISED.
--
--      He wrote: "immediately after you submit the application, you will be
--      sent an email with a scheduling link to schedule the Shadow Days."
--
--      It is not immediate and it is not automatic. The shadow-days booking
--      link is sent by the invite_to_shadow_days gate in
--      src/lib/admissions/gates/definitions.ts, which opens at stage
--      application_submitted and waits for a school leader to answer "Yes -
--      invite to shadow days" after reading the application and the documents.
--      That is his own standing rule - a student does not move from one stage
--      to the next without the school leader moving him or her - working
--      exactly as designed. A letter promising "immediately" would have been
--      broken by the gate every time the leader read the application the next
--      morning, which is most times.
--
--      Asked which he wanted, he chose to soften the sentence and leave the
--      gate alone. It now reads "Once we have read the application we will
--      send you a link to schedule the shadow days" - which is true today,
--      with no code behind it.
--
--   c) He capitalised "Shadow Days" in one sentence and left "shadow days"
--      lowercase four lines above it, in the same letter. Asked which way, he
--      said capitalise both, so both now read "Shadow Days".
--
--      NOTE THAT THIS LETTER IS NOW THE ODD ONE OUT. The gate label reads
--      "Invite to shadow days" and shadow_days_invite_email is lowercase too.
--      A family reading both in the same week sees it spelled two ways. That
--      is a separate migration whenever you want it - say the word and the
--      rest of the chain follows this letter.
--
-- THE GREETING IS KEPT. His paste began at "Thank you for the time" with no
-- greeting line, which reads as a copy that started below it rather than an
-- instruction to delete it - every other letter a family reads opens "Dear
-- {{guardian_first_name}}," as of migration 482 this morning.
--
-- ONE ROW IS EXPECTED TO CHANGE. A campus override, if one exists, is left
-- alone and the verify will show it.

begin;

update public.admissions_communication_templates
   set subject = 'Next step for {{student_first_name}} — application to {{school_name}}',
       body = $letter$Dear {{guardian_first_name}},

Thank you for the time you spent with me earlier so that I could learn about {{student_first_name}}. The next step before we can schedule {{student_first_name}}'s Shadow Days is for you to complete an Application for Admission to {{school_name}}.

You can begin here: {{application_link}}

You will not need to repeat anything you already told us on your inquiry — that information is already on the application. Once we have read the application we will send you a link to schedule the Shadow Days.

If you have questions at any point, reply to this email and it will reach me directly.

Thank you,
{{admissions_contact_name}}
{{school_name}} Admissions$letter$,
       updated_at = now()
 where template_key = 'application_invite_email'
   and school_id is null;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT one row, "every campus", ON, reading exactly as above.
--
-- THE TOKEN CHECK IS THE POINT OF THIS VERIFY. renderTemplate leaves an
-- unknown token in place as literal text, so a misspelling does not fail - it
-- mails a family the characters {{student_frist_name}}. Five tokens must be
-- present: guardian_first_name, student_first_name, school_name,
-- application_link, admissions_contact_name.
--
-- The "immediately" check is there so this letter cannot quietly go back to
-- promising something the platform does not do.

select coalesce(sc.name, 'every campus')                               as applies_to,
       case when t.is_active then 'ON' else '*** switched off ***' end as state,
       t.subject,
       t.body,
       case when t.body like '%{{guardian_first_name}}%'
             and t.body like '%{{student_first_name}}%'
             and t.body like '%{{school_name}}%'
             and t.body like '%{{application_link}}%'
             and t.body like '%{{admissions_contact_name}}%'
            then 'all five tokens present'
            else '*** A TOKEN IS MISSING OR MISSPELLED ***' end        as token_check,
       case when t.body ilike '%immediately%'
            then '*** PROMISES IMMEDIATE - THE GATE IS NOT IMMEDIATE ***'
            else 'no promise the gate cannot keep' end                 as promise_check,
       case when t.body like '%shadow days%'
            then '*** ONE IS STILL LOWERCASE ***'
            else 'Shadow Days, both times' end                         as casing_check,
       t.updated_at

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key = 'application_invite_email'
 order by applies_to;
