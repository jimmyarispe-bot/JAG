-- 526_a_guest_class_is_not_her_own_class_2026_10_09.sql
--
-- Renee Tracewell, 9 October 2026, 2:24pm, subject "Pay 10/9/2026":
--
--     "I just submitted my hours and it would not allow me to add my guest
--      teaching hours. I got this when I tried to add the classes that I was
--      a guest teacher for on Thursday and Friday. Those classes are all
--      already on the week at that hour. Nothing was added twice."
--
-- The last sentence is The JAG's own error message, quoted back at us. She is
-- right and it is wrong.
--
-- THE CONSTRAINT CANNOT TELL TWO CLASSES APART
--
--     teacher_class_entries_unique
--       UNIQUE (teacher_week_id, course_id, class_date, start_time_et)
--
-- Four columns. Not one of them is is_guest or guest_for_employee_id. So to
-- the database, these are the same class:
--
--     Renee's own Structured Literacy, Thursday 9:00am
--     Marissa Vanella's Structured Literacy, Thursday 9:00am, covered by Renee
--
-- They are not the same class. They are different children, a different
-- register, and - the part that matters tonight - two separate payments.
-- Renee teaches Structured Literacy at 9:00, 11:00 and 12:00 every day of
-- this week. Every hour she covered for Marissa collided with one of her own,
-- so addClassAction inserted nothing, counted added = 0, and told her the
-- classes were already there.
--
-- WHAT IT COST HER. She submitted anyway rather than fight it:
--
--     base pay                               $505.00
--     guest teaching for Marissa Vanella     $240.00  (10/8 $115, 10/9 $125)
--     ----------------------------------------------
--     what she should be paid                $745.00
--
-- $240 short, on the day she is paid, and she wrote in to say so.
--
-- THIS IS NOT THE BUG WE FIXED THIS MORNING. Jimmy: "??? i thought we fixed
-- this?" Three separate faults have come out of this screen today and this is
-- the third:
--
--   1. The line said $35 and the Submit button said $20   fixed, 634b1e1c
--   2. "Copy children to other days" did nothing           fixed, 5e6d5c6a
--   3. A guest class cannot share an hour with her own     THIS FILE
--
-- Nothing in 1 or 2 went anywhere near this constraint, and no test could
-- have caught it: there are no tests over the unique index, and the only way
-- to meet it is to be a teacher who covers a colleague's class in an hour she
-- also teaches her own - which until this week nobody had done.

begin;

-- ============================================================================
-- WHOSE CLASS IT WAS BECOMES PART OF WHAT MAKES A CLASS UNIQUE
-- ============================================================================
--
-- The protection the old constraint gave is kept exactly: a teacher still
-- cannot log her own Structured Literacy twice on Thursday at 9:00, and still
-- cannot log the same cover for the same colleague twice. What becomes
-- possible is the thing that is actually true - one hour can hold her own
-- class AND a class she covered for somebody else.
--
-- coalesce to the nil uuid rather than leaving guest_for_employee_id null,
-- because in a plain unique index NULL is distinct from NULL: two of her own
-- Structured Literacy rows at Thursday 9:00 would both have null there and
-- both be allowed, which would undo the duplicate protection entirely. The
-- nil uuid is never a real employee id, so "her own" collapses to one value
-- and collides with itself, exactly as before.
--
-- THE NAME IS DEEPLY DELIBERATE. actions.ts line 211 reads
--
--     error.message.includes("teacher_class_entries_unique")
--
-- and that string is how a genuine duplicate gets the kind sentence instead
-- of a raw Postgres error at ten to midnight on a Friday. Renaming the index
-- would silently turn every real duplicate into a database error in front of
-- a teacher. Same name, different columns.

alter table public.teacher_class_entries
  drop constraint if exists teacher_class_entries_unique;

drop index if exists public.teacher_class_entries_unique;

create unique index teacher_class_entries_unique
  on public.teacher_class_entries (
    teacher_week_id,
    course_id,
    class_date,
    start_time_et,
    (coalesce(guest_for_employee_id, '00000000-0000-0000-0000-000000000000'::uuid))
  );

comment on index public.teacher_class_entries_unique is
  'One class per week, course, day, hour AND whose class it was. Widened 9 October 2026: Renee Tracewell covered Marissa Vanella''s Structured Literacy at hours she also teaches her own, and the four-column version refused every one of them, leaving her $240 short on pay day. The nil uuid stands in for her own class so that case still collides with itself. The index name is load-bearing - actions.ts matches on it to turn a duplicate into a sentence a teacher can read.';

commit;

-- ============================================================================
-- RENEE IS STILL NOT PAID BY THIS FILE
-- ============================================================================
--
-- Two things were in her way and this fixes one. Her week - 5 to 11 October,
-- teacher_weeks a00191b0-5981-4981-83d5-610b03bb78d7 - is already SUBMITTED,
-- and addClassAction goes through myOpenWeek, which refuses a submitted week.
--
-- So she cannot add them even now. The week has to be reopened first:
--
--   1. https://theacademyway.thejag.org/dashboard/finance/teacher-pay
--   2. Renee Tracewell, week of 5 October. Reopen it.
--   3. Tell her it is open and ask her to add the six classes again:
--
--        Thursday 8 October  - guest for Marissa Vanella, 3 classes, $115
--        Friday   9 October  - guest for Marissa Vanella, 3 classes, $125
--
--      She needs the hour and the children for each; her email gives the
--      money but not the hours, so the register is hers to fill.
--   4. Her total should read $745.00 when she submits again.
--
-- DO NOT TYPE $745 INTO THE OVERRIDE BOX. It would pay her correctly tonight
-- and leave six classes with no register, no children and no attendance -
-- which is the record of who was taught, not just a number. The override
-- exists for a figure the platform genuinely cannot produce, and this one it
-- can.
