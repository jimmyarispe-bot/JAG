-- 276 (v2): load the 2026-27 Schedules of Tuition Payments for The Academy FL.
--
-- v1 aborted: "1 student(s) not found at The Academy FL: Emma Karns". The
-- document says Emma, JAG says Emmaleigh. Same child — same family, same
-- payer (Becky Karns), and Square bills the two Karns girls on one series.
-- Fixed below with a prefix probe that refuses to run if it is ambiguous.
--
-- All 32 current FL students — an exact match to the Step Up roster.
--   27 from their documents, read at the latest revision
--    5 employee children, who have no document because they owe nothing
--
-- Generated from the same parsed data that verified every schedule closes to
-- the cent, so the documents and the database cannot disagree.
--
-- THREE PARSING TRAPS this was built around, recorded because they will bite
-- anyone who redoes it:
--
--   1. Sibling documents are ONE text flow, not two pages. pdftotext emits both
--      children concatenated with a trailing form feed, so splitting on \f puts
--      everything in page 0 and nothing in page 1.
--   2. The Bowers document lists HARPER first, then Zechariah — the reverse of
--      its filename. Filename order swaps two children's scholarships.
--   3. Fuzzy surname matching put Izrael and Zion Alexander on ALEXANDRA
--      Rubio's document, and Naomi Hayes on Harrison Hayes's, who is not
--      enrolled. Every student names its file and section explicitly.
--
-- WHAT IS NOT HERE. Scholarships are not duplicated into the plan; they live in
-- scholarship_awards. The plan records only what follows from them: the billing
-- basis, what the family owes, and when.
--
-- Alexander Pobuda, Isla Fitzgerald, Penny Shropshire, Maximillian Salas and
-- Mackenzie Morris are Florida-FUNDED but attend HS or Virtual. They are not
-- FL campus students and are not loaded here.
--
-- IDEMPOTENT: existing active plans for this year are superseded, not
-- duplicated.

begin;

create temp table fl on commit drop as
select s.id,
       lower(split_part(s.first_name, ' ', 1))         as first_probe,
       lower(left(split_part(s.last_name, ' ', 1), 5)) as last_probe
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
  and s.status = 'active';

do $$
declare
  v_year    uuid;
  v_student uuid;
  v_plan    uuid;
  v_loaded  int := 0;
  v_hits    int;
  v_missing text[] := '{}';
begin
  select sy.id into v_year
  from public.school_years sy
  join public.schools sc on sc.id = sy.school_id
  where (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
    and sy.is_current
  limit 1;

  if v_year is null then
    raise exception 'Aborting: The Academy FL has no current school year.';
  end if;

  update public.student_tuition_plans p
     set status = 'superseded', updated_at = now()
   where p.school_year_id = v_year
     and p.status = 'active'
     and p.student_id in (select fl.id from fl);

  -- Izrael Alexander
  select ga.id into v_student from fl ga
   where ga.first_probe = 'izrael' and ga.last_probe = 'alexa';
  if v_student is null then
    v_missing := array_append(v_missing, 'Izrael Alexander');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 3965.00, 0, null,
            'active', '26.27 Izrael and Zion Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 330.42, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 330.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 330.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 330.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 330.42, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 330.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 330.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 330.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 330.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 330.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 330.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 330.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Zion Alexander
  select ga.id into v_student from fl ga
   where ga.first_probe = 'zion' and ga.last_probe = 'alexa';
  if v_student is null then
    v_missing := array_append(v_missing, 'Zion Alexander');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 3965.00, 0, null,
            'active', '26.27 Izrael and Zion Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 330.42, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 330.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 330.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 330.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 330.42, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 330.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 330.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 330.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 330.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 330.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 330.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 330.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Harper Bowers
  select ga.id into v_student from fl ga
   where ga.first_probe = 'harper' and ga.last_probe = 'bower';
  if v_student is null then
    v_missing := array_append(v_missing, 'Harper Bowers');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4286.00, 0, null,
            'active', '26.27 Zechariah and Harper Bowers Schedule of Tuition Payments revised 7.17.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 357.17, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 357.17, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 357.17, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 357.17, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 357.17, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 357.17, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 357.17, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 357.17, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 357.17, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 357.17, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 357.17, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 357.17, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Zechariah Bowers
  select ga.id into v_student from fl ga
   where ga.first_probe = 'zechariah' and ga.last_probe = 'bower';
  if v_student is null then
    v_missing := array_append(v_missing, 'Zechariah Bowers');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4866.00, 0, null,
            'active', '26.27 Zechariah and Harper Bowers Schedule of Tuition Payments revised 7.17.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 405.50, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 405.50, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 405.50, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 405.50, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 405.50, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 405.50, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 405.50, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 405.50, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 405.50, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 405.50, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 405.50, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 405.50, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Jayden Byrd
  select ga.id into v_student from fl ga
   where ga.first_probe = 'jayden' and ga.last_probe = 'byrd';
  if v_student is null then
    v_missing := array_append(v_missing, 'Jayden Byrd');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 15000.00, null, null, 15000.00, 5218.00, 0, null,
            'active', 'JAYDEN BYRD Schedule of Tuition Payments 2026.2027 revised 7.21.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 2, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 3, 'Due July 25, 2026', '2026-07-25', 521.80, false, null),
      (v_plan, 4, 'Due Aug 25, 2026', '2026-08-25', 521.80, false, null),
      (v_plan, 5, 'Due Sept 25, 2026', '2026-09-25', 521.80, false, null),
      (v_plan, 6, 'Due Oct 1, 2026', '2026-10-01', 521.80, false, null),
      (v_plan, 7, 'Due Nov 25, 2026', '2026-11-25', 521.80, false, null),
      (v_plan, 8, 'Due Dec 25, 2026', '2026-12-25', 521.80, false, null),
      (v_plan, 9, 'Due Jan 25, 2027', '2027-01-25', 521.80, false, null),
      (v_plan, 10, 'Due Feb 25, 2027', '2027-02-25', 521.80, false, null),
      (v_plan, 11, 'Due March 25, 2027', '2027-03-25', 521.80, false, null),
      (v_plan, 12, 'Due April 25, 2027', '2027-04-25', 521.80, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- James Dublis
  select ga.id into v_student from fl ga
   where ga.first_probe = 'james' and ga.last_probe = 'dubli';
  if v_student is null then
    v_missing := array_append(v_missing, 'James Dublis');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 5537.00, 0, null,
            'active', 'LJ Dublis 26.27 Schedule of Tuition Payments revised 3.10.20206.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 461.42, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 461.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 461.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 461.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 461.42, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 461.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 461.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 461.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 461.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 461.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 461.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 461.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Maddison Francillon
  select ga.id into v_student from fl ga
   where ga.first_probe = 'maddison' and ga.last_probe = 'franc';
  if v_student is null then
    v_missing := array_append(v_missing, 'Maddison Francillon');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4975.00, 0, null,
            'active', '26.27 Maddison Francillon Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 414.58, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 414.58, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 414.58, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 414.58, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 414.58, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 414.58, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 414.58, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 414.58, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 414.58, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 414.58, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 414.58, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 414.58, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Naomi Hayes
  select ga.id into v_student from fl ga
   where ga.first_probe = 'naomi' and ga.last_probe = 'hayes';
  if v_student is null then
    v_missing := array_append(v_missing, 'Naomi Hayes');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 6844.00, 0, null,
            'active', '26.27 Naomi Hayes Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 570.33, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 570.33, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 570.33, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 570.33, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 570.33, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 570.33, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 570.33, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 570.33, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 570.33, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 570.33, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 570.33, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 570.33, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Emma Karns.
  -- v2 FIX. The schedule document calls her EMMA; JAG stores her as
  -- EMMALEIGH, so `first_probe = 'emma'` matched nothing and the whole
  -- migration rolled back. Prefix match instead — and count first, because a
  -- prefix that hits two children would silently bill the wrong one.
  select count(*) into v_hits from fl ga
   where ga.first_probe like 'emma%' and ga.last_probe = 'karns';
  if v_hits > 1 then
    raise exception 'Aborting: % Karns children match first name emma%%. Too ambiguous to bill.', v_hits;
  end if;
  select ga.id into v_student from fl ga
   where ga.first_probe like 'emma%' and ga.last_probe = 'karns';
  if v_student is null then
    v_missing := array_append(v_missing, 'Emma / Emmaleigh Karns');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4512.00, 0, null,
            'active', '26.27 Emma and Abigail Karns Schedule of Tuition Payments revised 3.15.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 376.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 376.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 376.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 376.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 376.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 376.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 376.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 376.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 376.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 376.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 376.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 376.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Abigail Karns
  select ga.id into v_student from fl ga
   where ga.first_probe = 'abigail' and ga.last_probe = 'karns';
  if v_student is null then
    v_missing := array_append(v_missing, 'Abigail Karns');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4512.00, 0, null,
            'active', '26.27 Emma and Abigail Karns Schedule of Tuition Payments revised 3.15.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 376.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 376.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 376.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 376.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 376.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 376.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 376.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 376.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 376.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 376.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 376.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 376.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Cade Macklin
  select ga.id into v_student from fl ga
   where ga.first_probe = 'cade' and ga.last_probe = 'mackl';
  if v_student is null then
    v_missing := array_append(v_missing, 'Cade Macklin');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 2147.09, 0, null,
            'active', 'Cade Macklin. 26.27 Schedule of Tuition Payments. revised 4.4.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 165.16, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 165.16, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 165.16, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 165.16, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 165.16, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 165.16, false, null),
      (v_plan, 7, 'Due Oct 25, 2026', '2026-10-25', 165.16, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 165.16, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 165.16, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 165.16, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 165.16, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 165.16, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 165.16, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Gianna Mora
  select ga.id into v_student from fl ga
   where ga.first_probe = 'gianna' and ga.last_probe = 'mora';
  if v_student is null then
    v_missing := array_append(v_missing, 'Gianna Mora');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 8256.00, 0, null,
            'active', '26.27 GIANNA MORA Schedule of Tuition Payments revised 4.21.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 688.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 688.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 688.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 688.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 688.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 688.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 688.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 688.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 688.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 688.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 688.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 688.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Savannah Nemeroff
  select ga.id into v_student from fl ga
   where ga.first_probe = 'savannah' and ga.last_probe = 'nemer';
  if v_student is null then
    v_missing := array_append(v_missing, 'Savannah Nemeroff');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 0.00, 0, null,
            'active', '26.27 Savannah Nemeroff Schedule of Tuition Payments revised 6.1.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 0.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 0.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 0.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 0.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 0.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 0.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 0.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 0.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Lincoln Nieves
  select ga.id into v_student from fl ga
   where ga.first_probe = 'lincoln' and ga.last_probe = 'nieve';
  if v_student is null then
    v_missing := array_append(v_missing, 'Lincoln Nieves');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 3975.00, 0, null,
            'active', '26.27 Lincoln Nieves Schedule of Tuition Payments revised 6.7.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 397.50, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 397.50, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 397.50, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 397.50, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 397.50, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 397.50, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 397.50, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 397.50, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 397.50, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 397.50, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 0.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Damian Oliver
  select ga.id into v_student from fl ga
   where ga.first_probe = 'damian' and ga.last_probe = 'olive';
  if v_student is null then
    v_missing := array_append(v_missing, 'Damian Oliver');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4512.00, 0, null,
            'active', '26.27 Damari and Damian Oliver Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 376.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 376.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 376.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 376.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 376.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 376.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 376.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 376.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 376.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 376.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 376.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 376.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Damari Oliver
  select ga.id into v_student from fl ga
   where ga.first_probe = 'damari' and ga.last_probe = 'olive';
  if v_student is null then
    v_missing := array_append(v_missing, 'Damari Oliver');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 3965.00, 0, null,
            'active', '26.27 Damari and Damian Oliver Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 330.42, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 330.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 330.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 330.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 330.42, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 330.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 330.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 330.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 330.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 330.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 330.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 330.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Caly Padilla
  select ga.id into v_student from fl ga
   where ga.first_probe = 'caly' and ga.last_probe = 'padil';
  if v_student is null then
    v_missing := array_append(v_missing, 'Caly Padilla');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4594.00, 0, null,
            'active', '26.27 Caly Padilla Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 382.83, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 382.83, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 382.83, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 382.83, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 382.83, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 382.83, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 382.83, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 382.83, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 382.83, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 382.83, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 382.83, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 382.83, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Ava Perkins
  select ga.id into v_student from fl ga
   where ga.first_probe = 'ava' and ga.last_probe = 'perki';
  if v_student is null then
    v_missing := array_append(v_missing, 'Ava Perkins');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4750.00, 0, null,
            'active', '26.27 Ava Perkins Schedule of Tuition Payments revised 5.21.2026.pdf', 'Fortnightly payment schedule.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due June 5, 2026', '2026-06-05', 197.92, false, null),
      (v_plan, 3, 'Due June 19, 2026', '2026-06-19', 197.92, false, null),
      (v_plan, 4, 'Due July 3, 2026', '2026-07-03', 197.92, false, null),
      (v_plan, 5, 'Due July 17, 2026', '2026-07-17', 197.92, false, null),
      (v_plan, 6, 'Due July 31, 2026', '2026-07-31', 197.92, false, null),
      (v_plan, 7, 'Due Aug 14, 2026', '2026-08-14', 197.92, false, null),
      (v_plan, 8, 'Due Aug 28, 2026', '2026-08-28', 197.92, false, null),
      (v_plan, 9, 'Due Sept 11, 2026', '2026-09-11', 197.92, false, null),
      (v_plan, 10, 'Due Sept 25, 2026', '2026-09-25', 197.92, false, null),
      (v_plan, 11, 'Due Oct 9, 2026', '2026-10-09', 197.92, false, null),
      (v_plan, 12, 'Due Oct 23, 2026', '2026-10-23', 197.92, false, null),
      (v_plan, 13, 'Due Nov 6, 2026', '2026-11-06', 197.92, false, null),
      (v_plan, 14, 'Due Nov 20, 2026', '2026-11-20', 197.92, false, null),
      (v_plan, 15, 'Due Dec 4, 2026', '2026-12-04', 197.92, false, null),
      (v_plan, 16, 'Due Dec 18, 2026', '2026-12-18', 197.92, false, null),
      (v_plan, 17, 'Due Jan 1, 2027', '2027-01-01', 197.92, false, null),
      (v_plan, 18, 'Due Jan 15, 2027', '2027-01-15', 197.92, false, null),
      (v_plan, 19, 'Due Jan 29, 2027', '2027-01-29', 197.92, false, null),
      (v_plan, 20, 'Due Feb 12, 2027', '2027-02-12', 197.92, false, null),
      (v_plan, 21, 'Due Feb 26, 2027', '2027-02-26', 197.92, false, null),
      (v_plan, 22, 'Due March 12, 2027', '2027-03-12', 197.92, false, null),
      (v_plan, 23, 'Due March 26, 2027', '2027-03-26', 197.92, false, null),
      (v_plan, 24, 'Due April 9, 2027', '2027-04-09', 197.92, false, null),
      (v_plan, 25, 'Due April 23, 2027', '2027-04-23', 197.92, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Connor Ramos
  select ga.id into v_student from fl ga
   where ga.first_probe = 'connor' and ga.last_probe = 'ramos';
  if v_student is null then
    v_missing := array_append(v_missing, 'Connor Ramos');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 5000.00, 0, null,
            'active', '26.27 CONNOR RAMOS Schedule of Tuition Payments revised 5.3.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 416.67, true, '2026-09-01'),
      (v_plan, 2, 'Due May 1, 2026', '2026-05-01', 0.00, false, null),
      (v_plan, 3, 'Due June 1, 2026', '2026-06-01', 416.67, false, null),
      (v_plan, 4, 'Due July 1, 2026', '2026-07-01', 416.67, false, null),
      (v_plan, 5, 'Due Aug 1, 2026', '2026-08-01', 416.67, false, null),
      (v_plan, 6, 'Due Sept 1, 2026', '2026-09-01', 416.67, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 416.67, false, null),
      (v_plan, 8, 'Due Nov 1, 2026', '2026-11-01', 416.67, false, null),
      (v_plan, 9, 'Due Dec 1, 2026', '2026-12-01', 416.67, false, null),
      (v_plan, 10, 'Due Jan 1, 2027', '2027-01-01', 416.67, false, null),
      (v_plan, 11, 'Due Feb 1, 2027', '2027-02-01', 416.67, false, null),
      (v_plan, 12, 'Due March 1, 2027', '2027-03-01', 416.67, false, null),
      (v_plan, 13, 'Due April 1, 2027', '2027-04-01', 416.67, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Drew Ross
  select ga.id into v_student from fl ga
   where ga.first_probe = 'drew' and ga.last_probe = 'ross';
  if v_student is null then
    v_missing := array_append(v_missing, 'Drew Ross');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 15000.00, null, null, 15000.00, 4999.00, 0, null,
            'active', 'DREW ROSS Schedule of Tuition Payments. revised 8.6.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 624.88, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 624.88, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 624.88, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 624.88, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 624.88, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 624.88, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 624.88, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 624.88, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 0.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Alexandra Rubio
  select ga.id into v_student from fl ga
   where ga.first_probe = 'alexandra' and ga.last_probe = 'rubio';
  if v_student is null then
    v_missing := array_append(v_missing, 'Alexandra Rubio');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 12479.17, null, null, 12479.17, 1436.17, 0, null,
            'active', 'ALEXANDRA RUBIO Schedule of Tuition Payments.revised 8.15.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 159.57, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 159.57, false, null),
      (v_plan, 7, 'Due Oct 25, 2026', '2026-10-25', 159.57, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 159.57, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 159.57, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 159.57, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 159.57, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 159.57, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 159.57, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Cristian Rubio
  select ga.id into v_student from fl ga
   where ga.first_probe = 'cristian' and ga.last_probe = 'rubio';
  if v_student is null then
    v_missing := array_append(v_missing, 'Cristian Rubio');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 3932.00, 0, null,
            'active', '26.27 Alexandra and Christian Rubio Schedule of Tuition Payments revised 3.2.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 327.67, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 327.67, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 327.67, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 327.67, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 327.67, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 327.67, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 327.67, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 327.67, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 327.67, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 327.67, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 327.67, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 327.67, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- William Sifonte
  select ga.id into v_student from fl ga
   where ga.first_probe = 'william' and ga.last_probe = 'sifon';
  if v_student is null then
    v_missing := array_append(v_missing, 'William Sifonte');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 5537.00, 0, null,
            'active', '26.27 WILL SIFONTE Schedule of Tuition Payments revised 4.7.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 461.42, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 461.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 461.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 461.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 461.42, false, null),
      (v_plan, 7, 'Due Oct 25, 2026', '2026-10-25', 461.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 461.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 461.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 461.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 461.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 461.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 461.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Kainoa Skinner
  select ga.id into v_student from fl ga
   where ga.first_probe = 'kainoa' and ga.last_probe = 'skinn';
  if v_student is null then
    v_missing := array_append(v_missing, 'Kainoa Skinner');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 10000.00, 0, null,
            'active', 'Kainoa Skinner. 26.27 Schedule of Tuition Payments revised 4.4.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 6700.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 0.00, false, null),
      (v_plan, 7, 'Due Oct 25, 2026', '2026-10-25', 0.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 0.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 0.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 3300.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 0.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 0.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 0.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Fabianys Torres
  select ga.id into v_student from fl ga
   where ga.first_probe = 'fabianys' and ga.last_probe = 'torre';
  if v_student is null then
    v_missing := array_append(v_missing, 'Fabianys Torres');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 14975.00, null, null, 14975.00, 4512.00, 0, null,
            'active', '26.27 FABIANYS TORRES Schedule of Tuition Payments revised 3.6.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 0.00, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 376.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 376.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 376.00, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 376.00, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 376.00, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 376.00, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 376.00, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 376.00, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 376.00, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 376.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 376.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 376.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Bella Waldroup
  select ga.id into v_student from fl ga
   where ga.first_probe = 'bella' and ga.last_probe = 'waldr';
  if v_student is null then
    v_missing := array_append(v_missing, 'Bella Waldroup');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 15000.00, 5189.00, 0, null,
            'active', 'BELL ANN WALDROUP Schedule of Tuition Payments for Parents. revised 8.12.2026 wo Math.pdf', 'HS + a la carte class discount of 1,000.00 applied.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 2, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 3, 'Due July 25, 2026', '2026-07-25', 518.90, false, null),
      (v_plan, 4, 'Due Aug 25, 2026', '2026-08-25', 518.90, false, null),
      (v_plan, 5, 'Due Sept 25, 2026', '2026-09-25', 518.90, false, null),
      (v_plan, 6, 'Due Oct 1, 2026', '2026-10-01', 518.90, false, null),
      (v_plan, 7, 'Due Nov 25, 2026', '2026-11-25', 518.90, false, null),
      (v_plan, 8, 'Due Dec 25, 2026', '2026-12-25', 518.90, false, null),
      (v_plan, 9, 'Due Jan 25, 2027', '2027-01-25', 518.90, false, null),
      (v_plan, 10, 'Due Feb 25, 2027', '2027-02-25', 518.90, false, null),
      (v_plan, 11, 'Due March 25, 2027', '2027-03-25', 518.90, false, null),
      (v_plan, 12, 'Due April 25, 2027', '2027-04-25', 518.90, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Adaya Ward
  select ga.id into v_student from fl ga
   where ga.first_probe = 'adaya' and ga.last_probe = 'ward';
  if v_student is null then
    v_missing := array_append(v_missing, 'Adaya Ward');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 16000.00, null, null, 16000.00, 5537.00, 0, null,
            'active', '26.27 ADAYA WARD Schedule of Tuition Payments revised 4.22.2026.pdf', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 461.42, true, '2026-09-01'),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 461.42, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 461.42, false, null),
      (v_plan, 5, 'Due Aug 25, 2026', '2026-08-25', 461.42, false, null),
      (v_plan, 6, 'Due Sept 25, 2026', '2026-09-25', 461.42, false, null),
      (v_plan, 7, 'Due Oct 1, 2026', '2026-10-01', 461.42, false, null),
      (v_plan, 8, 'Due Nov 25, 2026', '2026-11-25', 461.42, false, null),
      (v_plan, 9, 'Due Dec 25, 2026', '2026-12-25', 461.42, false, null),
      (v_plan, 10, 'Due Jan 25, 2027', '2027-01-25', 461.42, false, null),
      (v_plan, 11, 'Due Feb 25, 2027', '2027-02-25', 461.42, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 461.42, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 461.42, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Hudson Bowden — employee child
  select ga.id into v_student from fl ga
   where ga.first_probe = 'hudson' and ga.last_probe = 'bowde';
  if v_student is null then
    v_missing := array_append(v_missing, 'Hudson Bowden');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 11043.00, null, null, 11043.00, 0, 0, null,
            'active', 'No document — employee child', 'Employee child. Tuition is whatever the Step Up scholarship pays; there is no parent portion. Not a discount — a consequence of the employment relationship.');
    v_loaded := v_loaded + 1;
  end if;

  -- Brooke Bowden — employee child
  select ga.id into v_student from fl ga
   where ga.first_probe = 'brooke' and ga.last_probe = 'bowde';
  if v_student is null then
    v_missing := array_append(v_missing, 'Brooke Bowden');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 8324.00, null, null, 8324.00, 0, 0, null,
            'active', 'No document — employee child', 'Employee child. Tuition is whatever the Step Up scholarship pays; there is no parent portion. Not a discount — a consequence of the employment relationship.');
    v_loaded := v_loaded + 1;
  end if;

  -- Charlee Treu — employee child
  select ga.id into v_student from fl ga
   where ga.first_probe = 'charlee' and ga.last_probe = 'treu';
  if v_student is null then
    v_missing := array_append(v_missing, 'Charlee Treu');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 10312.00, null, null, 10312.00, 0, 0, null,
            'active', 'No document — employee child', 'Employee child. Tuition is whatever the Step Up scholarship pays; there is no parent portion. Not a discount — a consequence of the employment relationship.');
    v_loaded := v_loaded + 1;
  end if;

  -- Brady Treu — employee child
  select ga.id into v_student from fl ga
   where ga.first_probe = 'brady' and ga.last_probe = 'treu';
  if v_student is null then
    v_missing := array_append(v_missing, 'Brady Treu');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 11824.00, null, null, 11824.00, 0, 0, null,
            'active', 'No document — employee child', 'Employee child. Tuition is whatever the Step Up scholarship pays; there is no parent portion. Not a discount — a consequence of the employment relationship.');
    v_loaded := v_loaded + 1;
  end if;

  -- Bentley Treu — employee child
  select ga.id into v_student from fl ga
   where ga.first_probe = 'bentley' and ga.last_probe = 'treu';
  if v_student is null then
    v_missing := array_append(v_missing, 'Bentley Treu');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values (v_student, v_year, 10463.00, null, null, 10463.00, 0, 0, null,
            'active', 'No document — employee child', 'Employee child. Tuition is whatever the Step Up scholarship pays; there is no parent portion. Not a discount — a consequence of the employment relationship.');
    v_loaded := v_loaded + 1;
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'Aborting: % student(s) not found at The Academy FL: %',
      array_length(v_missing, 1), array_to_string(v_missing, ', ');
  end if;

  raise notice '% plans loaded.', v_loaded;
end $$;

-- Every FL plan, and whether it closes.
--
-- `closes` must be true on all 32. The five employee children show
-- remaining_due 0 with no instalments, which is correct: they owe nothing.
select student, billing_basis, remaining_due, scheduled_total,
       unaccounted, closes, instalment_count
from public.student_tuition_plan_balances
where school ilike '%academy%fl%' or school ilike '%academy florida%'
order by closes, student;

commit;
