-- 237_import_three_leads_2026_09_02.sql
--
-- Loads three inquiries from Student_Admissions_Spreadsheet_1788313806.xlsx
-- into admissions_leads.
--
-- Written by hand, NOT run through /dashboard/admissions/import. The wizard's
-- column matcher still scores "Parent First Name" as a 0.75 candidate for the
-- child's own first_name and has no used-source guard, which is what put the
-- parent's name in seven children's name fields on 21 Aug. Every column below
-- is mapped explicitly, so that failure cannot repeat here.
--
-- Safe to re-run: each insert is guarded by NOT EXISTS on
-- (guardian_email, first_name), so a second run inserts nothing.
--
-- Two deliberate deviations from the spreadsheet, both flagged to Jimmy:
--   1. Madison Haines' sheet says "The Academy NJ", which is not a school in
--      this system. Assigned to The Academy Virtual per Jimmy, 2026-09-02.
--   2. Julian Oubre Towa's Birthdate cell reads 2026-10-17 — a date four
--      months in the future, for a child listed as 11 years old. That is not a
--      birthdate, so date_of_birth is left NULL rather than written wrong.
--      Fill it in on his profile once the real date is known.

do $$
declare
  v_ga    uuid;
  v_virt  uuid;
  v_n     integer;
begin
  -- Resolve by name, and insist on exactly one match each. A silent LIMIT 1
  -- over two same-named schools is how a lead ends up filed under the wrong
  -- campus with nothing to show it happened.
  select count(*) into v_n from public.schools where name ilike '%GA%';
  if v_n <> 1 then
    raise exception 'Expected exactly 1 school matching GA, found %. Run: select id, name from public.schools;', v_n;
  end if;
  select id into v_ga from public.schools where name ilike '%GA%';

  select count(*) into v_n from public.schools where name ilike '%Virtual%';
  if v_n <> 1 then
    raise exception 'Expected exactly 1 school matching Virtual, found %. Run: select id, name from public.schools;', v_n;
  end if;
  select id into v_virt from public.schools where name ilike '%Virtual%';

  -- 1. Konnor Broyld -- The Academy GA
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth,
    current_grade, program, referral_source,
    guardian_first_name, guardian_last_name, guardian_email, guardian_phone,
    lead_stage, inquiry_date, notes
  )
  select
    v_ga, 'Konnor', 'Broyld', date '2010-09-01',
    '11th_grade', null, 'Other social media',
    'Dennis', 'Broyld', 'dennisjbroyldjr@gmail.com', '+17706067505',
    'new_inquiry', date '2026-09-01',
    'Imported from Monday.com admissions board 2026-09-02.' || chr(10) ||
    'Age at inquiry: 16.' || chr(10) ||
    'Lives: Cartersville, GA, USA.' || chr(10) ||
    'Preferred start date: 2026-09-02.' || chr(10) ||
    'GREATNESS: Personality' || chr(10) ||
    'Challenges: Social skills.' || chr(10) ||
    'Additional: Super smart.'
  where not exists (
    select 1 from public.admissions_leads
    where guardian_email = 'dennisjbroyldjr@gmail.com' and first_name = 'Konnor'
  );

  -- 2. Madison Haines -- sheet said "The Academy NJ"; assigned to Virtual
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth,
    current_grade, program, referral_source,
    guardian_first_name, guardian_last_name, guardian_email, guardian_phone,
    lead_stage, inquiry_date, notes
  )
  select
    v_virt, 'Madison', 'Haines', date '2015-12-16',
    '5th_grade', 'academy_virtual', 'Google search',
    'Kelsey', 'Haines', 'kelhaines13@gmail.com', '+17322642202',
    'new_inquiry', date '2026-09-01',
    'Imported from Monday.com admissions board 2026-09-02.' || chr(10) ||
    'Sheet listed school as "The Academy NJ", which does not exist; assigned to The Academy Virtual per Jimmy.' || chr(10) ||
    'Age at inquiry: 10.' || chr(10) ||
    'Lives: Hazlet, NJ, USA.' || chr(10) ||
    'Preferred start date: 2026-10-05.' || chr(10) ||
    'GREATNESS: She is caring and very friendly' || chr(10) ||
    'Challenges: Reading and writing'
  where not exists (
    select 1 from public.admissions_leads
    where guardian_email = 'kelhaines13@gmail.com' and first_name = 'Madison'
  );

  -- 3. Julian Oubre Towa -- The Academy Virtual, Full-School Program
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth,
    current_grade, program, referral_source,
    guardian_first_name, guardian_last_name, guardian_email, guardian_phone,
    lead_stage, inquiry_date, notes
  )
  select
    v_virt, 'Julian', 'Oubre Towa', null,
    '6th_grade', 'academy_virtual', 'Google search',
    'Tara', 'Oden Towa', 'tara1n6@yahoo.com', '+15049945577',
    'new_inquiry', date '2026-09-01',
    'Imported from Monday.com admissions board 2026-09-02.' || chr(10) ||
    'DATE OF BIRTH MISSING: the source sheet had 2026-10-17, which is not a birthdate. Confirm with the family.' || chr(10) ||
    'Age at inquiry: 11.' || chr(10) ||
    'Lives: Chicago, IL, USA.' || chr(10) ||
    'Preferred start date: 2026-09-07.' || chr(10) ||
    'GREATNESS: Creative and kind' || chr(10) ||
    'Challenges: He struggles with spelling, decoding new words and some familiar words. He also struggles in math. Socially he has a hard time rebounding from rejection and injuries.'
  where not exists (
    select 1 from public.admissions_leads
    where guardian_email = 'tara1n6@yahoo.com' and first_name = 'Julian'
  );
end $$;

-- Verification. The child's name must be the CHILD's name in every row.
select
  l.first_name,
  l.last_name,
  s.name          as school,
  l.current_grade,
  l.date_of_birth,
  l.guardian_first_name,
  l.guardian_last_name,
  l.lead_stage
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email in (
  'dennisjbroyldjr@gmail.com',
  'kelhaines13@gmail.com',
  'tara1n6@yahoo.com'
)
order by l.first_name;
