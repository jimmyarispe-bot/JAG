-- 372_malachi_application_2026_09_15.sql
--
-- 371 did half a job, on purpose, and this is the other half.
--
-- WHAT HAPPENED
--
-- 371 updated Julian Oubre Towa and tried to INSERT Malachi Witcher. The insert
-- was guarded on guardian email AND date of birth - the pair 302 used, after 237
-- created a second Julian - and the guard fired. Malachi was already in JAG:
-- inquiry 2026-05-15, row created 2026-08-25, sitting at interest_meeting_held.
--
-- So no duplicate was made, which is what the guard is for. But nothing from his
-- application landed either. The guard protected the row and blocked the content
-- in the same motion, and a migration that reports success while writing nothing
-- is the exact costume this codebase keeps handing to failure. Hence this file.
--
-- IT ALSO SETTLED THE NAME
--
-- 371 had to decide whether the form's "Witcher Malachi / Johnson-Witcher
-- Krystal" meant the columns are Last-then-First and Krystal had filled both
-- pairs in backwards. The row already in JAG reads first_name Malachi, last_name
-- Witcher. Somebody had read that application the same way before me. The guess
-- is now a confirmation, from a source that is not me.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY THIS IS THREE PLAIN STATEMENTS AND NOT ONE do $$ ... $$ BLOCK
--
-- Because the first version could not be run. It was written as a DO block with
-- dollar-quoted strings and a multi-line note, and pasting it into the Supabase
-- SQL editor failed twice: once as "unterminated dollar-quoted string", then
-- again with the statement arriving truncated mid-string. The editor would not
-- carry a literal that long in one piece.
--
-- What is here is what actually ran, on 2026-09-15, in three passes: the field
-- update, then the note in two halves. No DO block, no dollar quoting, no
-- multi-line literals, no apostrophes to escape - nothing for a statement
-- splitter or a paste buffer to break. A migration file that cannot be replayed
-- is a trap for whoever opens it next, so this one matches reality.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHAT CHANGES, AND WHAT DELIBERATELY DOES NOT
--
-- current_grade 2nd_grade -> 3rd_grade. Not a correction; a year passed. The
-- 2nd was right for the May inquiry and is wrong for the school year he is
-- starting - his application says 3rd grade and his age agrees (born 2018-05-27,
-- 8 years old). A stale grade drives placement and state reporting, so it is the
-- one field here that can do real damage left alone.
--
-- guardian_last_name gains its hyphen, because that is how Krystal spelled her
-- own name on a form she signed.
--
-- NOT the phone. The stored '(334) 354-0446' is the same number as the
-- application's 3343540446. Reformatting a correct value to match a convention
-- this table does not consistently keep is churn on a live record.
--
-- NOT the stage. A paid application arrived, which sounds like it should move
-- him past interest_meeting_held, but admissions_applications has no row for it
-- and a lead standing at a stage with nothing behind it is the quiet lie again.
-- The facts go in his notes; a person decides.
--
-- NOT the automation gate, date_of_birth or program. The gate is off and stays
-- off; the other two already match the application exactly.
--
-- Every statement pins on guardian email AND date of birth together, so each can
-- only ever touch that one row - the same guard the insert used, doing the
-- opposite job.

-- 1. The fields.
update public.admissions_leads
   set current_grade = '3rd_grade',
       guardian_last_name = 'Johnson-Witcher',
       updated_at = now()
 where guardian_email = 'krysjohnson90@gmail.com'
   and date_of_birth = date '2018-05-27';

-- 2. The application, first half.
update public.admissions_leads
   set notes = coalesce(notes, '') || chr(10) || chr(10) || 'Application received 2026-09-15: Admissions/Registration Application, Academy Virtual, fee paid. Start requested 2026-09-15. Grade moved 2nd to 3rd per this application - 2nd was right for the 2026-05-15 inquiry, a school year has passed. DOB 2018-05-27 confirmed by the application. No scholarship. Guardian: Krystal Johnson-Witcher, 334-354-0446, 263 Weldons Drive, Tallassee, AL 36078.'
 where guardian_email = 'krysjohnson90@gmail.com'
   and date_of_birth = date '2018-05-27';

-- 3. The application, second half. What the family said about their child, in
--    their words, which is the part a school leader actually reads.
update public.admissions_leads
   set notes = coalesce(notes, '') || chr(10) || 'GREAT at: Science. He is very matter of fact so he likes that science can be proven. Frustration at his current school: they do not have a good system to develop learners who process information differently. Parent: he can be very easily distracted, working with him on focus. Report card attached to the application, not yet uploaded into JAG - no IEP or psychological report supplied. Stage left at interest_meeting_held: paid application in hand, no admissions_applications row yet.'
 where guardian_email = 'krysjohnson90@gmail.com'
   and date_of_birth = date '2018-05-27';

-- -----------------------------------------------------------------------------
-- VERIFY. One query, because the Supabase editor shows only the LAST result set
-- - which is why the four-section verify in 371 was unreadable. Every answer is
-- a column, and every boolean must read true.
-- -----------------------------------------------------------------------------

select
  l.first_name,
  l.last_name,
  l.current_grade,
  l.guardian_last_name,
  l.lead_stage,
  (l.current_grade = '3rd_grade')                      as grade_now_3rd,
  (l.guardian_last_name = 'Johnson-Witcher')           as surname_hyphenated,
  (l.date_of_birth = date '2018-05-27')                as dob_matches_application,
  (l.lead_stage = 'interest_meeting_held')             as stage_untouched,
  (l.automation_started_at is null)                    as automation_still_off,
  (l.notes like '%Application received 2026-09-15%')   as application_recorded,
  (l.notes like '%GREAT at: Science%')                 as family_words_recorded,
  (select count(*) from public.admissions_leads
    where guardian_email = 'krysjohnson90@gmail.com')  as malachi_rows,
  (select count(*) from public.admissions_leads
    where guardian_email = 'tara1n6@yahoo.com')        as julian_rows
from public.admissions_leads l
where l.guardian_email = 'krysjohnson90@gmail.com';
