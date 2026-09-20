-- 238_fix_julian_duplicate_2026_09_02.sql
--
-- 237 inserted a second Julian. The pre-existing lead was stored as
-- first_name 'Julian Oubre' / last_name 'Towa' -- the combined-name column split
-- one word too late -- so 237's duplicate guard (first_name = 'Julian') did not
-- see it and inserted a new row.
--
-- Keep the OLDER row: it is at 'information_sent', so it carries stage history
-- and mail already sent to Tara. Correct its name split and grade, and delete
-- the row 237 created.
--
-- The old row also answers the open question: date_of_birth 2014-10-17. The
-- spreadsheet's 2026-10-17 was a year typo, not a junk value -- 2014-10-17
-- makes him 11 on the 2026-09-01 inquiry date, which matches the sheet.

do $$
declare
  v_dupe uuid;
  v_keep uuid;
  v_n    integer;
begin
  -- The row 237 created: new_inquiry, no DOB, name already split correctly.
  select id into v_dupe
  from public.admissions_leads
  where guardian_email = 'tara1n6@yahoo.com'
    and first_name = 'Julian'
    and last_name = 'Oubre Towa'
    and date_of_birth is null
    and lead_stage = 'new_inquiry';

  -- The row that was already there.
  select id into v_keep
  from public.admissions_leads
  where guardian_email = 'tara1n6@yahoo.com'
    and first_name = 'Julian Oubre'
    and last_name = 'Towa';

  if v_keep is null then
    raise exception 'Did not find the pre-existing Julian Oubre / Towa row. Nothing changed.';
  end if;

  -- Correct the name split and bring the grade up to what the new inquiry says.
  update public.admissions_leads
  set first_name    = 'Julian',
      last_name     = 'Oubre Towa',
      current_grade = '6th_grade',
      notes = coalesce(notes || chr(10) || chr(10), '') ||
        'Corrected 2026-09-02: name was stored as "Julian Oubre" / "Towa" -- the ' ||
        'combined-name column split one word too late. Grade moved 5th -> 6th per the ' ||
        '2026-09-01 inquiry (age 11). Duplicate lead created that day was deleted.' || chr(10) ||
        'Lives: Chicago, IL, USA. Preferred start date: 2026-09-07.' || chr(10) ||
        'GREATNESS: Creative and kind' || chr(10) ||
        'Challenges: He struggles with spelling, decoding new words and some familiar ' ||
        'words. He also struggles in math. Socially he has a hard time rebounding from ' ||
        'rejection and injuries.'
  where id = v_keep;

  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'Expected to update exactly 1 row, updated %.', v_n;
  end if;

  if v_dupe is not null then
    delete from public.admissions_leads where id = v_dupe;
    get diagnostics v_n = row_count;
    if v_n <> 1 then
      raise exception 'Expected to delete exactly 1 duplicate, deleted %.', v_n;
    end if;
  end if;
end $$;

-- Verification: three rows, one per child, each with the CHILD's own name.
select
  l.first_name,
  l.last_name,
  s.name as school,
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
