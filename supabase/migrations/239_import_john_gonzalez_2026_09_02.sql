-- 239_import_john_gonzalez_2026_09_02.sql
--
-- One inquiry from Student_Admissions_Spreadsheet_1788320640.xlsx, submitted
-- 2026-08-31. Explicit column mapping, same as 237 -- not run through the
-- import wizard, whose matcher can still put a parent's name in a child's field.
--
-- The duplicate guard is on guardian_email ALONE this time. 237 guarded on
-- (guardian_email, first_name) and that let a second Julian in, because the
-- existing row had the combined-name column split one word too late
-- ('Julian Oubre' / 'Towa'). An email is the one value a split cannot corrupt.
-- If a lead already exists for this parent, this script inserts nothing and the
-- verification query below shows you what is already there.
--
-- Names are title-cased. The sheet has them lowercase ('john gonzalez',
-- 'yohanka martin'); stored as typed they would show up lowercase on his
-- profile, in the directory, and in the salutation of every email sent to Yohanka.

do $$
declare
  v_virt uuid;
  v_n    integer;
begin
  select count(*) into v_n from public.schools where name ilike '%Virtual%';
  if v_n <> 1 then
    raise exception 'Expected exactly 1 school matching Virtual, found %. Run: select id, name from public.schools;', v_n;
  end if;
  select id into v_virt from public.schools where name ilike '%Virtual%';

  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth,
    current_grade, program, referral_source,
    guardian_first_name, guardian_last_name, guardian_email, guardian_phone,
    lead_stage, inquiry_date, notes
  )
  select
    v_virt, 'John', 'Gonzalez', date '2017-09-08',
    '4th_grade', 'academy_virtual', 'AI search',
    'Yohanka', 'Martin', 'yohankamartin@gmail.com', '+17024891472',
    'new_inquiry', date '2026-08-31',
    'Imported from Monday.com admissions board 2026-09-02.' || chr(10) ||
    'Age at inquiry: 8. NOTE: 8 years old is young for 4th grade (typical is 9-10). ' ||
    'Confirm grade placement with the family.' || chr(10) ||
    'Address: 379 Sunflower Dr, Las Vegas, NV 89121, USA' || chr(10) ||
    'Preferred start date: 2026-08-31 (i.e. immediately).' || chr(10) ||
    'GREATNESS: he is a bright kid' || chr(10) ||
    'Challenges: he have adhd'
  where not exists (
    select 1 from public.admissions_leads
    where guardian_email = 'yohankamartin@gmail.com'
  );
end $$;

-- Verification. One row, the child's own name in first_name/last_name.
-- More than one row means this parent already had a lead -- reconcile by hand.
select
  l.first_name,
  l.last_name,
  s.name as school,
  l.current_grade,
  l.date_of_birth,
  l.guardian_first_name,
  l.guardian_last_name,
  l.lead_stage,
  l.inquiry_date
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email = 'yohankamartin@gmail.com'
order by l.inquiry_date;
