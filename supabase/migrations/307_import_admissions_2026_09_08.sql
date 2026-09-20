-- 307_import_admissions_2026_09_08.sql
--
-- 1 lead from Student_Admissions_Spreadsheet_1788871432.xlsx (Monday.com
-- admissions board export, single submission 7 September 2026).
--
-- The sheet has 7 rows: a 2-row title block, a blank, an "All Students"
-- banner, the header, ONE data row, and a trailing echo row that repeats only
-- the three date values with no name. The echo row is not a student and is not
-- imported.
--
-- Explicit column mapping, not the import wizard, for the same reason as 302:
-- the matcher at /dashboard/admissions/import still scores "Parent First Name"
-- as a 0.75 candidate for a child's first_name and has no usedSources guard.
--
-- Duplicate guard is on (guardian_email, date_of_birth), the key established in
-- 302. Email cannot be split wrong; date of birth distinguishes siblings.
--
-- NO EMAIL IS SENT BY THIS SCRIPT. It writes one row. The communications engine
-- runs on its own schedule and the parent reminder templates are disabled.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the verification.

begin;

do $$
declare
  v_vi uuid;
begin
  select id into v_vi from public.schools where name = 'The Academy Virtual';

  if v_vi is null then
    raise exception 'School lookup failed for The Academy Virtual. Run: select id, name from public.schools;';
  end if;

  -- 1. Chloe Ladd -> Virtual, 4th_grade, new_inquiry
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

end $$;

commit;

-- ---------------------------------------------------------------------------
-- Verification. Expect exactly 1 row, with the CHILD's name (Chloe Ladd) in
-- first_name/last_name and the PARENT's (Brandi Ladd) in the guardian columns.
-- ---------------------------------------------------------------------------

select
  l.first_name, l.last_name, s.name as school, l.current_grade,
  l.date_of_birth, l.guardian_first_name, l.guardian_last_name,
  l.guardian_email, l.guardian_phone, l.lead_stage, l.inquiry_date
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email = 'braner84@yahoo.com'
order by l.inquiry_date;
