-- 532_the_acceptance_letter_2026_10_09.sql
--
-- Jimmy, 9 October, on student_accepted_email:
--
--   "here change subject to [student]'s Admissions decision ;;;;; and in
--    body add this sentence at end - and your family to [school]
--    family..... We are really excited to have [student] join the rest of
--    our students to make our awesome school even better!"
--
-- ONE LETTER, ONE NETWORK ROW. No campus overrides exist for this one, so
-- the same words go to a family at all four schools.
--
-- ============================================================================
-- THE SUBJECT
-- ============================================================================
--
--   was   {{student_name}} has been accepted to {{school_name}}
--   now   {{student_name}}'s Admissions decision
--
-- {{student_name}} kept, not {{student_first_name}}: the old subject used
-- the full name and this is the letter that decides a child's school year.
--
-- IT NO LONGER SAYS "ACCEPTED" IN THE SUBJECT LINE, which is a real change
-- in how this lands. A mother glancing at her phone used to know the answer
-- before she opened it; now she has to open it. Worth knowing, because the
-- opposite letter - application_declined_email - already reads "Regarding
-- {{student_name}}'s application", so the two now look alike in an inbox.
-- Jimmy asked for this wording directly and it is his to weigh.
--
-- ============================================================================
-- THE SENTENCE
-- ============================================================================
--
-- Added at the end of the paragraph he quoted, verbatim, with [student]
-- resolved to {{student_first_name}} to match every other mention in that
-- paragraph:
--
--   We are really excited to have {{student_first_name}} join the rest of
--   our students to make our awesome school even better!
--
-- NOT PARAPHRASED AND NOT TIDIED. It sits directly after "We are very
-- excited to welcome {{student_first_name}} and your family to
-- {{school_name}} family." - two sentences, both beginning with excitement.
-- Jimmy, 4 October: "pls don't paraphrase. i cant follow this if the exact
-- language isn't in every part of this build." His words, as written.

begin;

update public.admissions_communication_templates
   set subject = '{{student_name}}''s Admissions decision',
       body = replace(
                body,
                'and your family to {{school_name}} family.',
                'and your family to {{school_name}} family. We are really excited to have {{student_first_name}} join the rest of our students to make our awesome school even better!'
              ),
       updated_at = now()
 where template_key = 'student_accepted_email';

do $$
declare v_body text; v_subject text;
begin
  select body, subject into v_body, v_subject
    from public.admissions_communication_templates
   where template_key = 'student_accepted_email';

  if v_subject <> '{{student_name}}''s Admissions decision' then
    raise exception 'The subject did not take: %', v_subject;
  end if;
  if position('make our awesome school even better!' in v_body) = 0 then
    raise exception 'The new sentence is not in the body. Nothing to rely on.';
  end if;
  /* The anchor appears once, so the sentence must appear once. A replace
     that fired twice would thank the family twice. */
  if (length(v_body) - length(replace(v_body, 'make our awesome school even better!', ''))) 
     / length('make our awesome school even better!') <> 1 then
    raise exception 'The new sentence appears more than once.';
  end if;
  raise notice 'Acceptance letter updated.';
end $$;

commit;

-- ============================================================================
-- WHAT A FAMILY NOW READS
-- ============================================================================
--
--   Subject: Jayden Roy's Admissions decision
--
--   Dear Tara,
--
--   It is my privilege to tell you that Jayden has been accepted to
--   The Academy Virtual.
--
--   We really enjoyed observing Jayden's interaction with our other students
--   and teachers during this time. We are very excited to welcome Jayden and
--   your family to The Academy Virtual family. We are really excited to have
--   Jayden join the rest of our students to make our awesome school even
--   better!
--
--   Here is what happens next, and there is nothing for you to do until our
--   business office contacts you directly to finalize three things:
--
--     • your schedule of tuition payments
--     • your enrollment contract
--     • your initial deposit, which is your first monthly payment
--
--   That will come as a separate email from the business office.
--
--   If you have any questions before then, simply reply to this message and
--   it will come directly to me.
--
--   Warmly,
--   ...
--
-- STILL TRUE, AND NOT CHANGED HERE: no family has ever received this letter.
-- Four accepted children - Jayden Roy, Rashard Salinding, Julian Oubre Towa,
-- Maddox Mixon - have packets sent and zero signatures, and the acceptance
-- gate has never been pressed for any of them.
