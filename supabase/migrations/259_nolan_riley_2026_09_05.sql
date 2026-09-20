-- 259: Nolan Riley — the one child on the Georgia roster with no student record.
--
-- He was in JAG all along, filed under the WRONG SURNAME: the admissions lead
-- reads "Nolan Powers", taking the second guardian's surname (Powers, Napoleon)
-- instead of the student's own. The application is surname-first — "Riley,
-- Nolan" / "Riley, Imani" — and whoever keyed it took the wrong half. The
-- guardian email is identical on both: imaniremona@gmail.com.
--
-- This corrects the lead and creates the student, following the same path the
-- app's own conversion uses: families -> students -> guardians -> sis_enrollments.
--
-- State award: GA Special Needs $12,109, matching the roster to the dollar.
-- He also applied for an Academy-Based Scholarship, amount not stated. The
-- $100 application fee is paid.
--
-- IDEMPOTENT. Running it twice creates nothing twice.

begin;

do $$
declare
  v_school_id   uuid;
  v_lead_id     uuid;
  v_family_id   uuid;
  v_student_id  uuid;
  v_year_id     uuid;
  v_number      text;
begin
  select id into v_school_id
  from public.schools
  where name ilike '%academy%ga%' or name ilike '%academy georgia%'
  limit 1;

  if v_school_id is null then
    raise exception 'Aborting: could not find The Academy GA.';
  end if;

  -- Already done?
  select id into v_student_id
  from public.students
  where school_id = v_school_id
    and lower(first_name) = 'nolan'
    and lower(last_name) = 'riley';

  if v_student_id is not null then
    raise notice 'Nolan Riley already exists (%). Nothing to do.', v_student_id;
    return;
  end if;

  -- 1. Correct the misfiled lead, matched on the guardian email rather than the
  --    wrong name.
  select id into v_lead_id
  from public.admissions_leads
  where school_id = v_school_id
    and guardian_email ilike 'imaniremona@gmail.com';

  if v_lead_id is null then
    raise notice 'No lead found for imaniremona@gmail.com. Creating the student without one.';
  else
    update public.admissions_leads
       set first_name          = 'Nolan',
           last_name           = 'Riley',
           guardian_first_name = 'Imani',
           guardian_last_name  = 'Riley',
           guardian_phone      = '478-342-2259',
           lead_stage          = 'enrolled'
     where id = v_lead_id;
    raise notice 'Lead % corrected from "Nolan Powers" to "Nolan Riley".', v_lead_id;
  end if;

  -- 2. Family. Billing goes to Guardian 1, who the form names as the person who
  --    receives tuition invoices.
  insert into public.families (school_id, family_name, billing_email, billing_phone,
                               primary_address, city, state, zip_code, status)
  values (v_school_id, 'Riley', 'imaniremona@gmail.com', '478-342-2259',
          '4030 Hawthorne Cir SE, Apt 2', 'Smyrna', 'GA', '30080', 'active')
  returning id into v_family_id;

  -- 3. Student number, from the same function the app calls.
  select public.generate_student_number(v_school_id) into v_number;

  select id into v_year_id
  from public.school_years
  where school_id = v_school_id and is_current
  limit 1;

  insert into public.students (
    school_id, family_id, first_name, last_name, date_of_birth, grade_level,
    program, school_year_id, enrollment_status, enrollment_start_date,
    status, lifecycle_stage, student_number, admissions_lead_id
  )
  values (
    v_school_id, v_family_id, 'Nolan', 'Riley', date '2016-02-04', '4th_grade',
    'academy_ga_campus', v_year_id, 'enrolled', date '2026-08-24',
    'active', 'accepted', v_number, v_lead_id
  )
  returning id into v_student_id;

  -- 4. Guardians. Two, one billing.
  insert into public.guardians (family_id, first_name, last_name, email, phone,
                                relationship_to_student, is_primary, receives_billing)
  values
    (v_family_id, 'Imani', 'Riley', 'imaniremona@gmail.com', '478-342-2259', 'parent', true,  true),
    (v_family_id, 'Napoleon', 'Powers', null,                '470-659-1505', 'parent', false, false);

  -- 5. Enrollment for the current year, if one is set.
  --
  -- NOT "on conflict (student_id, school_year_id)". Migration 229 dropped that
  -- unique constraint to allow dual enrolment and replaced it with
  -- (student_id, school_year_id, program). A guarded insert is used instead, so
  -- this does not depend on which constraint happens to exist.
  if v_year_id is not null then
    insert into public.sis_enrollments (student_id, school_year_id, program,
                                        enrollment_status, enrolled_at, lead_id,
                                        is_primary)
    select v_student_id, v_year_id, 'academy_ga_campus', 'enrolled',
           date '2026-08-24', v_lead_id, true
    where not exists (
      select 1 from public.sis_enrollments e
      where e.student_id = v_student_id
        and e.school_year_id = v_year_id
        and e.program = 'academy_ga_campus'
    );
  else
    raise notice 'No current school year at The Academy GA — sis_enrollments row skipped.';
  end if;

  raise notice 'Created Nolan Riley: student % , number %', v_student_id, v_number;
end $$;

-- Confirm, and re-count GA. This should now read 20.
select s.first_name || ' ' || s.last_name as student,
       s.student_number, s.grade_level, s.date_of_birth,
       s.status, s.enrollment_status,
       f.billing_email
from public.students s
left join public.families f on f.id = s.family_id
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
  and lower(s.last_name) = 'riley';

select count(*) as active_ga_students
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
  and s.status = 'active';

commit;
