-- 371_two_applications_2026_09_15.sql
--
-- Two completed Admissions/Registration Applications for The Academy Virtual,
-- both with the $100 fee paid. Julian Oubre Towa already has a lead and must
-- keep it. Malachi Witcher does not.
--
-- WHY JULIAN IS AN UPDATE AND NOT AN INSERT, IN HIS OWN WORDS
--
-- Migration 238 exists and is called "fix_julian_duplicate". On 2 September a
-- previous import created a SECOND Julian, because the old row was stored as
-- first_name 'Julian Oubre' / last_name 'Towa' and the duplicate guard looked
-- for first_name = 'Julian'. This file does not go near an insert for him.
--
-- His lead also carries everything won today: he is at shadow_day_completed
-- with gate 3 open, after an afternoon spent working out why he had vanished
-- from the board. NOTHING HERE TOUCHES HIS STAGE.
--
-- THE APPLICATION CONFIRMS HIS DATE OF BIRTH INDEPENDENTLY
--
-- 238 inferred 2014-10-17 from an age and called a spreadsheet's 2026-10-17 a
-- year typo. The application his mother filled in says 17-Oct-2014. The guess
-- was right. Section 3a asserts it rather than trusting either source, and this
-- file will not overwrite a date of birth that is already set.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ONE JUDGEMENT CALL, STATED PLAINLY: MALACHI'S NAME ORDER
--
-- The form puts LAST in the left column and FIRST in the right. Julian's
-- application proves it: "Oubre Towa | Julian", and the parent row reads
-- "Oden Towa | Tara" with tara1n6@yahoo.com, which matches the lead already in
-- JAG. Left column is the surname.
--
-- Read that way, the other application says the child is "Witcher Malachi" and
-- the mother is "Johnson-Witcher Krystal". Both are backwards: Malachi and
-- Krystal are first names, and mother and son then share the surname Witcher.
-- Krystal filled both name pairs into the wrong boxes.
--
-- So this file records him as Malachi Witcher, son of Krystal Johnson-Witcher.
-- If that is wrong, it is wrong on purpose and section 3b shows it before you
-- commit to it. A misfiled name is how a child becomes unfindable - which is
-- the whole reason today happened.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- MALACHI GOES IN AT new_inquiry, NOT application_submitted
--
-- He has submitted a paid application, which sounds like application_submitted.
-- But that stage is the pipeline's reflection of a row in
-- admissions_applications, and this file does not create one. A lead sitting at
-- application_submitted with no application behind it is the kind of quiet lie
-- this codebase keeps producing. The facts are in his notes instead, and
-- recording the application properly is a separate, deliberate step.
--
-- The automation gate is deliberately NOT set on either lead.

do $$
declare
  v_virtual uuid;
  v_julian  uuid;
  v_n       integer;
begin
  select id into v_virtual from public.schools where name = 'Academy Virtual';
  if v_virtual is null then
    select id into v_virtual from public.schools where name = 'The Academy Virtual';
  end if;
  if v_virtual is null then
    raise exception 'Academy Virtual not found. Run: select id, name from public.schools;';
  end if;

  -- ---------------------------------------------------------------------------
  -- 1. Julian Oubre Towa - UPDATE ONLY. Pinned on four facts, never on a name
  --    alone, because a name alone is what created the duplicate in 237.
  -- ---------------------------------------------------------------------------
  select id into v_julian
  from public.admissions_leads
  where guardian_email = $t$tara1n6@yahoo.com$t$
    and lower(first_name) = 'julian'
    and lower(last_name)  = 'oubre towa'
    and school_id = v_virtual;

  if v_julian is null then
    raise exception 'Julian Oubre Towa not found at Academy Virtual. Nothing changed.';
  end if;

  update public.admissions_leads
  set
      -- Guardian identity: the application is the first document that gives her
      -- name in fields rather than as an email address.
      guardian_first_name = $t$Tara$t$,
      guardian_last_name  = $t$Oden Towa$t$,
      guardian_phone      = $t$+15049945577$t$,

      -- Only if missing. 238 already set 2014-10-17 and the application agrees;
      -- coalesce means a correction made since is not stamped over.
      date_of_birth = coalesce(date_of_birth, date '2014-10-17'),
      current_grade = coalesce(nullif(current_grade, ''), '6th_grade'),

      -- The board showed a blank where staff read the campus, because the
      -- public form deliberately writes p_program null. This family named one.
      program = coalesce(nullif(program, ''), 'academy_virtual'),

      updated_at = now(),
      notes = coalesce(notes || chr(10) || chr(10), '') ||
        $t$Application received 2026-09-15: completed Admissions/Registration Application for The Academy Virtual, $100 fee paid.
Requested start date: 2026-09-24. Program requested: 3rd-8th grade Full-School Program. Currently in 6th grade.
Date of birth 2014-10-17 CONFIRMED by the application - matches what 238 inferred from his age.
No state or district scholarship (answered NO).
Guardian: Tara Oden Towa, tara1n6@yahoo.com, 504-994-5577.
Address on the application: 6448 S Rhodes Ave, Chicago, Illinois 60637, United States.
GREATNESS: He is very creative and passionate about a lot of things.
Frustrates him at his current school: He gets distracted at times and has a hard time focusing.
Parent wants us to know: He will be started on meds for ADHD again this school year and this should help his focus.
Documents attached to the application, NOT yet uploaded into JAG: IEP_for_Julian_Oubre-Towa.pdf, Obre_J--corrected.pdf (psychological report), J.O.T_25-26_ILP-2.pdf (report card/ILP).
Stage deliberately unchanged - he is at shadow_day_completed with the accept-or-deny decision open.$t$
  where id = v_julian;

  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'Expected to update exactly 1 Julian row, updated %.', v_n;
  end if;

  -- ---------------------------------------------------------------------------
  -- 2. Malachi Witcher - INSERT, guarded.
  --    The guard is guardian email AND date of birth, the pair 302 used, so a
  --    re-run cannot make a second Malachi the way 237 made a second Julian.
  -- ---------------------------------------------------------------------------
  insert into public.admissions_leads (
    school_id, first_name, last_name, date_of_birth, current_grade, program,
    referral_source, guardian_first_name, guardian_last_name, guardian_email,
    guardian_phone, lead_stage, inquiry_date, notes
  )
  select
    v_virtual, $t$Malachi$t$, $t$Witcher$t$, date '2018-05-27', '3rd_grade', 'academy_virtual',
    $t$Admissions/Registration Application$t$,
    $t$Krystal$t$, $t$Johnson-Witcher$t$, $t$krysjohnson90@gmail.com$t$,
    $t$+13343540446$t$, 'new_inquiry', date '2026-09-15',
    $t$Application received 2026-09-15: completed Admissions/Registration Application for The Academy Virtual, $100 fee paid.
Requested start date: 2026-09-15. Program requested: 3rd-8th grade Full-School Program. Currently in 3rd grade. Age given as 8.
No state or district scholarship (answered NO).
Guardian: Krystal Johnson-Witcher, krysjohnson90@gmail.com, 334-354-0446.
Address on the application: 263 Weldons Drive, Tallassee, AL 36078, United States.
GREATNESS: Science. He is very matter of fact so he likes that science can be proven.
Frustrates him at his current school: They do not have a good system to really develop learners that may process information differently.
Parent wants us to know: He can be very easily distracted. Working with him on focus.
Documents attached to the application, NOT yet uploaded into JAG: sharp_tcschools.com_20260903_094841.pdf (report card). No IEP, psychological report or writing sample supplied.
NAME ORDER: the form's left column is the surname (proved by the other application on this batch), so it read "Witcher Malachi" and "Johnson-Witcher Krystal". Recorded as Malachi Witcher, son of Krystal Johnson-Witcher, because both pairs were clearly entered back to front and mother and son then share the surname Witcher. CONFIRM WITH THE FAMILY.
Stage is new_inquiry although a paid application is in hand, because no row exists in admissions_applications yet. Record the application, then move him.$t$
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = $t$krysjohnson90@gmail.com$t$
       and date_of_birth  = date '2018-05-27'
  );

  get diagnostics v_n = row_count;
  raise notice 'Malachi Witcher: % row(s) inserted (0 means he was already there).', v_n;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. VERIFICATION
-- -----------------------------------------------------------------------------

-- 3a. Julian. Expect ONE row: dob 2014-10-17, 6th_grade, academy_virtual,
--     Tara Oden Towa with her phone, and lead_stage STILL shadow_day_completed.
select
  'julian after' as check,
  l.first_name, l.last_name, l.date_of_birth, l.current_grade, l.program,
  l.guardian_first_name, l.guardian_last_name, l.guardian_phone,
  l.lead_stage,
  (l.date_of_birth = date '2014-10-17') as dob_matches_the_application,
  (l.automation_started_at is null)     as automation_still_off
from public.admissions_leads l
where l.guardian_email = 'tara1n6@yahoo.com'
order by l.created_at;

-- 3b. Malachi. READ THE NAME. Expect first_name Malachi, last_name Witcher.
--     If the family says otherwise, fix it here before anything is sent.
select
  'malachi after' as check,
  l.first_name, l.last_name, l.date_of_birth, l.current_grade, l.program,
  l.guardian_first_name, l.guardian_last_name, l.guardian_email, l.guardian_phone,
  l.lead_stage, s.name as campus,
  (l.automation_started_at is null) as automation_still_off
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email = 'krysjohnson90@gmail.com';

-- 3c. THE ONE THAT MATTERS. Exactly one lead per child, no duplicates.
--     237 made a second Julian. Expect 1 and 1.
select
  'duplicate check' as check,
  count(*) filter (where guardian_email = 'tara1n6@yahoo.com')      as julian_rows,
  count(*) filter (where guardian_email = 'krysjohnson90@gmail.com') as malachi_rows
from public.admissions_leads;

-- 3d. Both are reachable on the board. Expect a pipeline column for each -
--     the check that did not exist this morning.
select
  'on the board' as check,
  l.first_name || ' ' || l.last_name as child,
  l.lead_stage,
  s.name as campus
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.guardian_email in ('tara1n6@yahoo.com', 'krysjohnson90@gmail.com')
order by l.last_name;
