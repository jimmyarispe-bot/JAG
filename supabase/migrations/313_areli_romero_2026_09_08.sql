-- 313_areli_romero_2026_09_08.sql
--
-- Creates Areli Romero at The Academy Virtual and attaches the Arkansas EFA
-- money that has already settled for her. Requires 311.
--
-- WHY SHE WAS MISSING AND HOW SHE WAS FOUND
--
-- She was not found by anyone looking at admissions. She was found by the
-- money: ClassWallet order 35309739 settled $1,537.50 through the Arkansas
-- Virtual login on 2026-09-04, script 311 could not match the payer name to any
-- student, and the unmatched row is what asked the question.
--
-- That is the funder ledger doing the job it was built for. A family had been
-- enrolled, invoiced and PAID without a student record existing, and nothing in
-- admissions or billing had noticed.
--
-- THE FAMILY SURNAME DOES NOT MATCH THE STUDENT'S, AND THAT IS NOT AN ERROR
--
-- Student:  Romero, Areli
-- Guardian: Jacz, Brittani  (bjacz1231@gmail.com)
--
-- Two different surnames. This is exactly the shape that produced the Nolan
-- Riley fault corrected by 259 - an application filed surname-first, where
-- whoever keyed it took the guardian's surname for the child's. Here the names
-- are recorded from the application as given: the CHILD is Romero, the GUARDIAN
-- is Jacz, and the family is filed under the child's surname.
--
-- TUITION IS NOT SET UP BY THIS SCRIPT
--
-- $1,500/month plus the ClassWallet fee. This script creates the student,
-- family, guardian and enrolment - it does NOT write a tuition plan or a
-- payment schedule, because student_tuition_plans has its own shape and
-- guessing at it would be worse than leaving it visibly undone. That is the
-- next step and it is called out in the verification.
--
-- IDEMPOTENT. Running it twice creates nothing twice.

begin;

do $$
declare
  v_school_id  uuid;
  v_family_id  uuid;
  v_student_id uuid;
  v_year_id    uuid;
  v_lead_id    uuid;
  v_number     text;
  v_rows       int;
begin
  select id into v_school_id
    from public.schools
   where name = 'The Academy Virtual';

  if v_school_id is null then
    raise exception 'Aborting: The Academy Virtual not found.';
  end if;

  -- Already done?
  select id into v_student_id
    from public.students
   where school_id = v_school_id
     and lower(first_name) = 'areli'
     and lower(last_name)  = 'romero';

  if v_student_id is null then

    -- 1. An admissions lead may or may not exist. Matched on the guardian
    --    email, never on a name - the surnames differ here, so a name match
    --    would be the exact fault 259 had to repair.
    select id into v_lead_id
      from public.admissions_leads
     where guardian_email ilike 'bjacz1231@gmail.com';

    if v_lead_id is null then
      raise notice 'No admissions lead for bjacz1231@gmail.com. Creating the student without one.';
    else
      update public.admissions_leads
         set lead_stage = 'enrolled'
       where id = v_lead_id;
      raise notice 'Lead % marked enrolled.', v_lead_id;
    end if;

    -- 2. Family. Filed under the CHILD's surname; billing goes to the guardian
    --    the application names as receiving tuition invoices.
    insert into public.families (school_id, family_name, billing_email, billing_phone,
                                 primary_address, city, state, zip_code, status)
    values (v_school_id, 'Romero', 'bjacz1231@gmail.com', '501-580-9527',
            '1457 Mountain Springs Road', 'Cabot', 'AR', '72023', 'active')
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
      v_school_id, v_family_id, 'Areli', 'Romero', date '2013-06-24', '8th_grade',
      'academy_virtual', v_year_id, 'enrolled', date '2026-09-01',
      'active', 'accepted', v_number, v_lead_id
    )
    returning id into v_student_id;

    -- 4. Guardian. One named on the application, and she is the billing contact.
    insert into public.guardians (family_id, first_name, last_name, email, phone,
                                  relationship_to_student, is_primary, receives_billing)
    values (v_family_id, 'Brittani', 'Jacz', 'bjacz1231@gmail.com', '501-580-9527',
            'parent', true, true);

    -- 5. Enrolment for the current year.
    --    Guarded insert rather than ON CONFLICT: migration 229 dropped the
    --    (student_id, school_year_id) unique constraint to allow dual
    --    enrolment, so this must not depend on which constraint exists.
    if v_year_id is not null then
      insert into public.sis_enrollments (student_id, school_year_id, program,
                                          enrollment_status, enrolled_at, lead_id,
                                          is_primary)
      select v_student_id, v_year_id, 'academy_virtual', 'enrolled',
             date '2026-09-01', v_lead_id, true
      where not exists (
        select 1 from public.sis_enrollments e
        where e.student_id = v_student_id
          and e.school_year_id = v_year_id
          and e.program = 'academy_virtual'
      );
    else
      raise notice 'No current school year at The Academy Virtual - sis_enrollments row skipped.';
    end if;

    raise notice 'Created Areli Romero: student %, number %', v_student_id, v_number;
  else
    raise notice 'Areli Romero already exists (%). Skipping creation.', v_student_id;
  end if;

  -- -------------------------------------------------------------------------
  -- 6. Attach the money. This is the point of the script.
  -- -------------------------------------------------------------------------

  update public.funder_disbursements d
     set student_id   = v_student_id,
         match_status = 'matched',
         matched_at   = now(),
         updated_at   = now(),
         notes        = coalesce(d.notes || E'\n', '') ||
                        'Matched to Areli Romero (The Academy Virtual) by script 313 on 2026-09-08. '
                        'She had no student record when 311 ran - the UNMATCHED DISBURSEMENT IS WHAT '
                        'FOUND HER. Enrolled 2026-09-01, 8th grade, full-school program, tuition '
                        '$1,500/month billed as $1,537.50 (tuition x 1.025 to cover the platform fee). '
                        'Guardian is Brittani Jacz - a different surname from the child, recorded as '
                        'given on the application.'
   where d.payer_account_name = 'Areli Romero'
     and d.match_status = 'unmatched';

  get diagnostics v_rows = row_count;
  raise notice 'Attached % disbursement(s) to Areli Romero.', v_rows;
end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification 1 - the student.
-- Expect one row: Areli Romero, 8th_grade, 2013-06-24, active/enrolled,
-- billing bjacz1231@gmail.com.
-- ---------------------------------------------------------------------------

select s.first_name || ' ' || s.last_name as student,
       s.student_number, s.grade_level, s.date_of_birth,
       s.status, s.enrollment_status, s.enrollment_start_date,
       f.billing_email, f.city, f.state
from public.students s
left join public.families f on f.id = s.family_id
join public.schools sc on sc.id = s.school_id
where sc.name = 'The Academy Virtual'
  and lower(s.last_name) = 'romero';

-- ---------------------------------------------------------------------------
-- Verification 2 - the ledger.
--
-- Expect 7 matched payer names and 2 unmatched (Jaxon Corduan, Kennedy Stone).
--
--   matched     $50,815.43   was $49,277.93
--   unmatched   $16,122.90   was $17,660.40
--   total       $66,938.33   unchanged
--
-- NEXT: Areli has NO TUITION PLAN. $1,500/month from 2026-09-01 is not yet
-- recorded anywhere, so she will not be invoiced by the billing engine even
-- though the state is already paying. That is the next script.
-- ---------------------------------------------------------------------------

select
  d.match_status,
  d.payer_account_name,
  coalesce(st.first_name || ' ' || st.last_name, '--') as matched_student,
  count(*)                                             as orders,
  sum(d.net_amount)::numeric(12,2)                     as net_received
from public.funder_disbursements d
left join public.students st on st.id = d.student_id
group by d.match_status, d.payer_account_name, st.first_name, st.last_name
order by
  case d.match_status when 'matched' then 1 else 2 end,
  sum(d.net_amount) desc;
