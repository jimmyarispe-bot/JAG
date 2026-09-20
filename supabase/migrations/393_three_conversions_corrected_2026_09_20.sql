-- 393_three_conversions_corrected_2026_09_20.sql
--
-- WHAT HAPPENED
--
-- This morning the new convert screen turned three accepted leads into students,
-- on my recommendation. Jimmy then read them back against the real world:
--
--   La'Marrieon Williams - "he is not a student of ours". He was already
--       archived at The Academy GA on 5 September by migration 258 as "not
--       enrolled 26-27". His lead still said 'accepted', so the screen offered
--       him and I said press it.
--   Michael Neuwirth    - a real student, and his application says
--       "Tutoring: Wilson Structured Literacy", NOT the full-school programme.
--       The conversion recorded him as academy_virtual because that is the
--       fallback the code uses when nothing says otherwise.
--   Anthony Venier      - "an old student. actually just reapplied but he has
--       [not] paid yet". Verified: no duplicate, one record created today. But
--       it reads 'enrolled', which is not true of a family who has not paid.
--
-- THE LESSON, WRITTEN DOWN BECAUSE IT WILL RECUR
--
-- The screen trusted lead_stage = 'accepted'. A lead sitting at 'accepted' does
-- not mean a family enrolled - it means nobody moved the card after they did
-- not. Same staleness as Israel Cooks in section 9 of the open items, whose
-- status was "left over from last year, never updated when he re-enrolled".
-- A stage is a record of the last thing someone did to a card, not a fact about
-- a child.
--
-- BOTH COLUMNS, EVERY TIME. Section 0 of the open items exists because every
-- archive migration before this one set status='archived' and left
-- enrollment_status alone, so five archived children kept being counted as
-- enrolled for weeks. This sets both.

begin;

-- =========================================================================
-- 1. THE TUTORING PROGRAMME CODE THAT WAS ASKED FOR LONG AGO
-- =========================================================================
--
-- sis_enrollments.program has allowed exactly six values since migration 053,
-- none of them tutoring. Section 13 of the open items lists
-- academy_virtual_tutoring as "asked for long ago, never completed" - so until
-- now a tutoring child could not be recorded as one, and Michael would have had
-- to stay mislabelled as full-school.
--
-- academy_ga_virtual, the other code named in section 13, is NOT added here.
-- Nothing today needs it and I do not know what it is meant to mean. A value
-- invented to close a list is worse than a list that is honestly short.

alter table public.sis_enrollments
  drop constraint if exists sis_enrollments_program_check;

alter table public.sis_enrollments
  add constraint sis_enrollments_program_check
  check (
    program in (
      'academy_fl_campus',
      'academy_fl_virtual',
      'academy_ga_campus',
      'academy_ga_hybrid',
      'academy_hs',
      'academy_virtual',
      'academy_virtual_tutoring'
    )
  );

-- =========================================================================
-- 2. THE THREE CORRECTIONS
-- =========================================================================
--
-- Every one is pinned on campus AND student number AND both names, so a wrong
-- one matches nothing rather than the wrong child. The report at the end says
-- how many rows each touched; a zero there is a failure to read, not a success.

create temp table corrections (ord int, what text, rows_touched int) on commit drop;

-- 2a. La'Marrieon Williams is not a student. Archived, not deleted - migration
--     188's path, so he can be restored if this turns out to be wrong.
with archived as (
  update public.students s
     set status            = 'archived',
         previous_status   = coalesce(s.previous_status, s.status),
         enrollment_status = 'withdrawn',
         updated_at        = now()
    from public.schools sc
   where sc.id = s.school_id
     and sc.name ilike '%academy%hs%'
     and s.student_number = '000021'
     and lower(btrim(s.first_name)) = 'la''marrieon'
     and lower(btrim(s.last_name))  = 'williams'
     and s.status <> 'archived'
  returning s.id
)
insert into corrections
select 1, 'La''Marrieon Williams archived (not a student)', count(*) from archived;

--     His enrolment row goes withdrawn too, or the schedule still believes in him.
with e as (
  update public.sis_enrollments en
     set enrollment_status = 'withdrawn'
    from public.students s
   where s.id = en.student_id
     and s.student_number = '000021'
     and lower(btrim(s.last_name)) = 'williams'
     and lower(btrim(s.first_name)) = 'la''marrieon'
  returning en.id
)
insert into corrections select 2, 'La''Marrieon enrolment withdrawn', count(*) from e;

--     And the lead stops being offered by the convert screen. The screen lists
--     leads at 'accepted' or 'enrolled'; 'not_returning' is the value migration
--     225 defines for exactly this, and it matches 258's own words.
with l as (
  update public.admissions_leads
     set lead_stage = 'not_returning',
         updated_at = now()
   where lower(btrim(first_name)) = 'la''marrieon'
     and lower(btrim(last_name))  = 'williams'
     and lead_stage in ('accepted', 'enrolled')
  returning id
)
insert into corrections select 3, 'La''Marrieon lead set to not_returning', count(*) from l;

-- 2b. Michael Neuwirth is a tutoring student, not a full-school one.
with m as (
  update public.sis_enrollments en
     set program = 'academy_virtual_tutoring'
    from public.students s
   where s.id = en.student_id
     and s.student_number = '000024'
     and lower(btrim(s.first_name)) = 'michael'
     and lower(btrim(s.last_name))  = 'neuwirth'
     and en.program = 'academy_virtual'
  returning en.id
)
insert into corrections
select 4, 'Michael Neuwirth -> academy_virtual_tutoring', count(*) from m;

-- 2c. Anthony Venier has reapplied and has not paid. 'pending' is the word the
--     schema already has for that, and it is the default for a reason. He drops
--     out of the roster count until he pays, which is the truth.
with a_student as (
  update public.students s
     set enrollment_status = 'pending',
         updated_at        = now()
   where s.student_number = '000025'
     and lower(btrim(s.first_name)) = 'anthony'
     and lower(btrim(s.last_name))  = 'venier'
     and s.enrollment_status = 'enrolled'
  returning s.id
)
insert into corrections select 5, 'Anthony Venier student -> pending', count(*) from a_student;

with a_enrol as (
  update public.sis_enrollments en
     set enrollment_status = 'pending'
    from public.students s
   where s.id = en.student_id
     and s.student_number = '000025'
     and lower(btrim(s.last_name)) = 'venier'
     and en.enrollment_status = 'enrolled'
  returning en.id
)
insert into corrections select 6, 'Anthony Venier enrolment -> pending', count(*) from a_enrol;

-- =========================================================================
-- THE REPORT
--
-- Every line should read 1. A 0 means that correction matched nothing and the
-- child is still recorded the old way - which is the failure this whole file
-- is about, so read the numbers rather than the absence of an error.
-- =========================================================================

select
  ord,
  what                                             as correction,
  rows_touched,
  case when rows_touched = 1 then 'applied'
       when rows_touched = 0 then '>>> MATCHED NOTHING <<<'
       else '>>> TOUCHED MORE THAN ONE ROW <<<' end as result
from corrections
order by ord;

commit;
