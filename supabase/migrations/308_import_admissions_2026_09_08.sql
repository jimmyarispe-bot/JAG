-- 308_import_admissions_2026_09_08.sql
--
-- SUPERSEDES 307. Run this one; ignore 307 whether or not it was run.
--
-- Source: Student_Admissions_Spreadsheet_1788877389.xlsx (Monday.com admissions
-- board export, submissions 7 - 8 September 2026). 3 data rows -> 2 leads.
--
-- ROW 1, AUDREY BEAN-MEHLSEN, IS DELIBERATELY NOT HERE. She was imported by
-- 302 on 2026-09-07 -- same guardian (bcbm1972@gmail.com), same date of birth
-- (2012-08-29), same everything. The board re-exported her because the export
-- window widened, not because anything about her changed. Including her would
-- be harmless (the guard would skip her) but silent, and a script that appears
-- to insert 3 and inserts 1 is a script nobody can read. She is excluded on
-- purpose and this comment is the record of why.
--
-- Row 9 of the sheet is a footer that carries only date RANGES
-- ("2026-09-07 to 2026-09-08") and no student name. Not a student. Excluded.
--
-- Explicit column mapping, not the import wizard: the matcher at
-- /dashboard/admissions/import still scores "Parent First Name" as a 0.75
-- candidate for a child's first_name and has no usedSources guard.
--
-- Duplicate guard is (guardian_email, date_of_birth), the key established in
-- 302. Email cannot be split wrong; date of birth distinguishes siblings.
-- BOTH inserts below are guarded, so this script is safe to run twice, and
-- safe to run after 307.
--
-- NO EMAIL IS SENT BY THIS SCRIPT. It writes rows. The communications engine
-- runs on its own schedule and the parent reminder templates are disabled.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the verification.

begin;

do $$
declare
  v_ga uuid; v_vi uuid;
begin
  select id into v_ga from public.schools where name = 'The Academy GA';
  select id into v_vi from public.schools where name = 'The Academy Virtual';

  if v_ga is null or v_vi is null then
    raise exception 'School lookup failed (GA=%, Virtual=%). Run: select id, name from public.schools;',
      v_ga, v_vi;
  end if;

  -- 1. Chloe Ladd -> Virtual, 4th_grade, new_inquiry
  --    (Identical to 307. Skipped automatically if 307 was already run.)
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_vi, $t$Chloe$t$, $t$Ladd$t$, date '2016-12-15', '4th_grade', 'academy_virtual',
         $t$Google search$t$, $t$Brandi$t$, $t$Ladd$t$, $t$braner84@yahoo.com$t$,
         $t$+13375013905$t$, 'new_inquiry', date '2026-09-07',
         $t$Imported from Monday.com admissions board 2026-09-08.
Program requested: The Academy Virtual - FULL-SCHOOL PROGRAM (not tutoring).
Preferred start date: 2026-10-01.
Address: Saint Martinville, LA, USA
GREATNESS: Chloe is a beautiful, smart and kind little girl. She is mature for her age and is pretty independent.
Challenges: Language arts, grammar, spelling, reading, etc. Lack of focus and confidence. Easily distracted and overwhelmed. She does ok socially.
Additional: She struggles with anxiety and ADHD as well as dyslexia.
Age and grade check out: DOB 2016-12-15 makes her 9 on the inquiry date, matching the sheet, and 9-turning-10 is normal for 4th grade.
LOUISIANA FAMILY. Out of state for every campus, so Virtual is the only fit. Louisiana is not one of the five voucher states JAG is approved in (GA, TX, NC, AR, AZ), so assume private pay unless the family says otherwise.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$braner84@yahoo.com$t$ and date_of_birth = date '2016-12-15'
  );

  -- 2. Jayden Roy -> GA, 3rd_grade, new_inquiry
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select v_ga, $t$Jayden$t$, $t$Roy$t$, date '2017-09-13', '3rd_grade', 'academy_ga_campus',
         $t$Friend, Current Academy parent$t$, $t$Lisa$t$, $t$Roy$t$, $t$lisinda1974@gmail.com$t$,
         $t$+17702356988$t$, 'new_inquiry', date '2026-09-08',
         $t$Imported from Monday.com admissions board 2026-09-08.
REFERRED BY A CURRENT ACADEMY PARENT. First referral-sourced lead in this board. Worth finding out which family so it can be acknowledged.
Preferred start date: 2027-01-04 -- a MID-YEAR JANUARY start, not this term. Nurture accordingly; a first-contact sequence written for an immediate start will read wrong.
Address: 4730 Summerwood Drive Southeast, Mableton, GA, USA (about 15 miles from the GA campus).
GREATNESS: He loves hands on projects where he needs to figure out how to build or construct something. He loves Legos and rather create his own model versus follow the directions of the Lego model. He loves drawing and playing sports. He is fascinated with history and world events. He likes to watch military movies and understands how countries interact and battle with each other.
Challenges: Academically he struggles with focusing when teachers are teaching the material to large groups of kids. Writing, math equations and worksheets that he dislikes. He finds nothing interesting. Having to sit down and do worksheets that he does not understand, because he was not able to focus enough in class to get the information needed to do the worksheets.
Additional: He is friendly and outgoing. Has many friends and is kind.
Age and grade check out: DOB 2017-09-13 makes him 8 on the inquiry date, matching the sheet -- he turns 9 five days later. 8-turning-9 is normal for 3rd grade.
Georgia family, so GSNS / GOAL / Odyssey Promise eligibility is worth establishing early. Note that GSNS and GOAL each make a student INELIGIBLE for the Georgia Promise Scholarship.
The sheet says only "The Academy GA" with no in-person or virtual qualifier; recorded as academy_ga_campus. Confirm with the family.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$lisinda1974@gmail.com$t$ and date_of_birth = date '2017-09-13'
  );

end $$;

commit;

-- ---------------------------------------------------------------------------
-- Verification. Expect exactly 3 rows: Chloe Ladd, Jayden Roy, and Audrey
-- Bean-Mehlsen (who came in on 302 and should be UNCHANGED -- inquiry_date
-- 2026-09-07, school The Academy Virtual). If Audrey is missing, 302 did not
-- run. If she is duplicated, the guard failed and that needs looking at.
--
-- Every row must carry the CHILD's own name in first_name/last_name and the
-- PARENT's in the guardian columns. Never a parent's name in a child's field.
-- ---------------------------------------------------------------------------

select
  l.first_name, l.last_name, s.name as school, l.current_grade,
  l.date_of_birth, l.guardian_first_name, l.guardian_last_name,
  l.guardian_email, l.guardian_phone, l.lead_stage, l.inquiry_date
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email in (
  'braner84@yahoo.com',
  'lisinda1974@gmail.com',
  'bcbm1972@gmail.com'
)
order by l.inquiry_date, l.last_name;
