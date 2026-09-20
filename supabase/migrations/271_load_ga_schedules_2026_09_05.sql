-- 271: load the 2026-27 Schedules of Tuition Payments into JAG.
--
-- Nineteen students at The Academy GA — every active one. Seventeen carry the
-- revised figures generated on 2026-09-05; Gabrielle Ingram and Nolan Riley
-- needed no revision and are loaded from their current schedules.
--
-- This is generated from the same computed data that produced the PDFs, so the
-- documents and the database cannot disagree. Every plan was verified to close
-- to zero before generation, and the balances view checks it again afterwards.
--
-- Israel Cooks is NOT here. He is a The Academy HS student whose schedule was
-- filed in the GA folder, and his tuition is per-class (HS Experience + Math)
-- rather than an annual figure. He needs the HS structure, not this one.
--
-- Matching is on first-name and surname prefix within The Academy GA, and any
-- student who cannot be found is REPORTED rather than skipped silently.
--
-- IDEMPOTENT: existing active plans for this year are superseded, not
-- duplicated, so re-running replaces rather than doubles.

begin;

create temp table ga on commit drop as
select s.id,
       lower(split_part(s.first_name, ' ', 1)) as first_probe,
       lower(split_part(s.last_name, ' ', 1))  as last_probe
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
  and s.status = 'active';

do $$
declare
  v_year    uuid;
  v_student uuid;
  v_plan    uuid;
  v_loaded  int := 0;
  v_missing text[] := '{}';
begin
  -- sy.id, not id. Both school_years and schools have an id column, and an
  -- unqualified reference is ambiguous.
  select sy.id into v_year
  from public.school_years sy
  join public.schools sc on sc.id = sy.school_id
  where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
    and sy.is_current
  limit 1;

  if v_year is null then
    raise exception 'Aborting: The Academy GA has no current school year. Run migration 261 first.';
  end if;

  -- Supersede rather than duplicate.
  update public.student_tuition_plans p
     set status = 'superseded', updated_at = now()
   where p.school_year_id = v_year
     and p.status = 'active'
     and p.student_id in (select id from ga);


  -- ABIGAIL MCHONEY
  select ga.id into v_student from ga where ga.first_probe = 'abigail' and ga.last_probe = 'mchoney';
  if v_student is null then
    v_missing := array_append(v_missing, 'ABIGAIL MCHONEY');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition (10 months)', 19950.00, 9998.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', 'Tuition due is computed from the annual figure, as on the current schedule.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract + August 25, 2026', null, 2439.20, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 944.85, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 944.85, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 944.85, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 944.85, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 944.85, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 944.85, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 944.85, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 944.85, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- BRAYDON MCCASKILL
  select ga.id into v_student from ga where ga.first_probe = 'braydon' and ga.last_probe = 'mccaskill';
  if v_student is null then
    v_missing := array_append(v_missing, 'BRAYDON MCCASKILL');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition - August - May', 16625.00, 1063.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract', null, 118.11, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 118.11, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 118.11, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 118.11, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 118.11, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 118.11, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 118.11, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 118.11, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 118.12, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- DANTE NEASON
  select ga.id into v_student from ga where ga.first_probe = 'dante' and ga.last_probe = 'neason';
  if v_student is null then
    v_missing := array_append(v_missing, 'DANTE NEASON');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 10636.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 3864.32, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 846.46, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 846.46, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 846.46, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 846.46, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 846.46, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 846.46, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 846.46, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 846.46, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- EMILIANO PEREZ
  select ga.id into v_student from ga where ga.first_probe = 'emiliano' and ga.last_probe = 'perez';
  if v_student is null then
    v_missing := array_append(v_missing, 'EMILIANO PEREZ');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition (10 months: Aug-May)', 16625.00, 3396.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract + August 25, 2026', null, 679.20, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 339.60, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 339.60, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 339.60, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 339.60, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 339.60, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 339.60, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 339.60, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 339.60, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- HAILEY ROSSER
  select ga.id into v_student from ga where ga.first_probe = 'hailey' and ga.last_probe = 'rosser';
  if v_student is null then
    v_missing := array_append(v_missing, 'HAILEY ROSSER');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 5486.00, 1400.05,
       'Family held at the existing payment. Balance not recoverable over the remaining months.', 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', 'Payment unchanged. The school is absorbing the difference.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract + July and August 25, 2026', null, 1114.35, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 371.45, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 371.45, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 371.45, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 371.45, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 371.45, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 371.45, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 371.45, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 371.45, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- KAELYN MADDOX
  select ga.id into v_student from ga where ga.first_probe = 'kaelyn' and ga.last_probe = 'maddox';
  if v_student is null then
    v_missing := array_append(v_missing, 'KAELYN MADDOX');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 4380.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 1830.68, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 318.67, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 318.67, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 318.67, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 318.67, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 318.67, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 318.67, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 318.67, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 318.63, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- LIAM BRYANT
  select ga.id into v_student from ga where ga.first_probe = 'liam' and ga.last_probe = 'bryant';
  if v_student is null then
    v_missing := array_append(v_missing, 'LIAM BRYANT');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition (10 months - Aug - May)', 16625.00, 6138.00, 2382.00,
       'Family held at the existing payment. State award below the amount the schedule assumed.', 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', 'Payment unchanged. The school is absorbing the difference.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract + August 25, 2026', null, 751.20, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 375.60, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 375.60, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 375.60, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 375.60, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 375.60, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 375.60, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 375.60, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 375.60, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- MADISON CORLEY
  select ga.id into v_student from ga where ga.first_probe = 'madison' and ga.last_probe = 'corley';
  if v_student is null then
    v_missing := array_append(v_missing, 'MADISON CORLEY');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 15200.00, null,
       null, 15200.00, 4544.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 1880.00, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 333.00, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 333.00, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 333.00, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 333.00, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 333.00, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 333.00, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 333.00, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 333.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- MASON GOOLSBY
  select ga.id into v_student from ga where ga.first_probe = 'mason' and ga.last_probe = 'goolsby';
  if v_student is null then
    v_missing := array_append(v_missing, 'MASON GOOLSBY');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition - August - May', 16625.00, 4517.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract', null, 501.89, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 501.89, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 501.89, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 501.89, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 501.89, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 501.89, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 501.89, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 501.89, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 501.88, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- NASH WILSON
  select ga.id into v_student from ga where ga.first_probe = 'nash' and ga.last_probe = 'wilson';
  if v_student is null then
    v_missing := array_append(v_missing, 'NASH WILSON');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 10636.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 3864.32, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 846.46, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 846.46, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 846.46, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 846.46, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 846.46, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 846.46, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 846.46, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 846.46, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- PARKER BRITTELLE
  select ga.id into v_student from ga where ga.first_probe = 'parker' and ga.last_probe = 'brittelle';
  if v_student is null then
    v_missing := array_append(v_missing, 'PARKER BRITTELLE');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 9775.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 3606.68, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 771.04, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 771.04, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 771.04, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 771.04, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 771.04, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 771.04, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 771.04, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 771.04, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- SANTIAGO HERNANDEZ ALVARADO
  select ga.id into v_student from ga where ga.first_probe = 'santiago' and ga.last_probe = 'hernandez';
  if v_student is null then
    v_missing := array_append(v_missing, 'SANTIAGO HERNANDEZ ALVARADO');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 2152.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 1000.00, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 144.00, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 144.00, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 144.00, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 144.00, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 144.00, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 144.00, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 144.00, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 144.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- TALIA JOHNSON
  select ga.id into v_student from ga where ga.first_probe = 'talia' and ga.last_probe = 'johnson';
  if v_student is null then
    v_missing := array_append(v_missing, 'TALIA JOHNSON');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 11883.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'May, June, July and August 25, 2026', null, 4237.32, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 955.71, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 955.71, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 955.71, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 955.71, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 955.71, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 955.71, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 955.71, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 955.71, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- TIJAN SENGHORE
  select ga.id into v_student from ga where ga.first_probe = 'tijan' and ga.last_probe = 'senghore';
  if v_student is null then
    v_missing := array_append(v_missing, 'TIJAN SENGHORE');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, null,
       null, 19950.00, 5341.00, 1499.19,
       'Family held at the existing payment. Balance not recoverable over the remaining months.', 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', 'Payments due to date have been forgiven. Payment unchanged; the school is absorbing the balance.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Payments through September 2026 forgiven', null, 0.00, true, '2026-09-01'),
      
      (v_plan, 2, 'Due October 25, 2026', '2026-10-25', 548.83, false, null),
      
      (v_plan, 3, 'Due November 25, 2026', '2026-11-25', 548.83, false, null),
      
      (v_plan, 4, 'Due December 25, 2026', '2026-12-25', 548.83, false, null),
      
      (v_plan, 5, 'Due January 25, 2027', '2027-01-25', 548.83, false, null),
      
      (v_plan, 6, 'Due February 25, 2027', '2027-02-25', 548.83, false, null),
      
      (v_plan, 7, 'Due March 25, 2027', '2027-03-25', 548.83, false, null),
      
      (v_plan, 8, 'Due April 25, 2027', '2027-04-25', 548.83, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- ZAID BRADY
  select ga.id into v_student from ga where ga.first_probe = 'zaid' and ga.last_probe = 'brady';
  if v_student is null then
    v_missing := array_append(v_missing, 'ZAID BRADY');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition (10 months Aug - May)', 16625.00, 4637.00, 876.00,
       'Family held at the existing payment. State award below the amount the schedule assumed.', 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', 'Payment unchanged. The school is absorbing the difference.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract + August 25, 2026', null, 752.20, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 376.10, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 376.10, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 376.10, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 376.10, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 376.10, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 376.10, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 376.10, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 376.10, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- OLIVER WINIARCZYK
  select ga.id into v_student from ga where ga.first_probe = 'oliver' and ga.last_probe = 'winiarczyk';
  if v_student is null then
    v_missing := array_append(v_missing, 'OLIVER WINIARCZYK');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition - 10 months: August - May', 16625.00, 4516.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract', null, 501.78, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 501.78, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 501.78, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 501.78, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 501.78, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 501.78, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 501.78, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 501.78, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 501.76, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- RYLAN JEX
  select ga.id into v_student from ga where ga.first_probe = 'rylan' and ga.last_probe = 'jex';
  if v_student is null then
    v_missing := array_append(v_missing, 'RYLAN JEX');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 16625.00,
       'Prorated Tuition - 10 months: August - May', 16625.00, 4104.00, 0.00,
       null, 'active', 'Revised 9.5.2026 against SchoolRoster 2.xlsx', null)
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Signing contract', null, 456.00, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 25, 2026', '2026-09-25', 456.00, false, null),
      
      (v_plan, 3, 'Due October 25, 2026', '2026-10-25', 456.00, false, null),
      
      (v_plan, 4, 'Due November 25, 2026', '2026-11-25', 456.00, false, null),
      
      (v_plan, 5, 'Due December 25, 2026', '2026-12-25', 456.00, false, null),
      
      (v_plan, 6, 'Due January 25, 2027', '2027-01-25', 456.00, false, null),
      
      (v_plan, 7, 'Due February 25, 2027', '2027-02-25', 456.00, false, null),
      
      (v_plan, 8, 'Due March 25, 2027', '2027-03-25', 456.00, false, null),
      
      (v_plan, 9, 'Due April 25, 2027', '2027-04-25', 456.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- GABRIELLE INGRAM
  select ga.id into v_student from ga where ga.first_probe = 'gabrielle' and ga.last_probe = 'ingram';
  if v_student is null then
    v_missing := array_append(v_missing, 'GABRIELLE INGRAM');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 18287.50,
       'Prorated Tuition - 11 months: July - May', 18287.50, 7287.50, 0.00,
       null, 'active', 'Gabrielle Ingram Schedule of Tuition Payments 26.27 revised 7.24.2026.pdf', 'No revision required. Per Jimmy, only GA Promise and School-Based apply.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Payments due July and August 2026', null, 1325.00, true, '2026-09-01'),
      
      (v_plan, 2, 'Due September 30, 2026', '2026-09-30', 662.50, false, null),
      
      (v_plan, 3, 'Due October 31, 2026', '2026-10-31', 662.50, false, null),
      
      (v_plan, 4, 'Due November 30, 2026', '2026-11-30', 662.50, false, null),
      
      (v_plan, 5, 'Due December 31, 2026', '2026-12-31', 662.50, false, null),
      
      (v_plan, 6, 'Due January 31, 2027', '2027-01-31', 662.50, false, null),
      
      (v_plan, 7, 'Due February 26, 2027', '2027-02-26', 662.50, false, null),
      
      (v_plan, 8, 'Due March 31, 2027', '2027-03-31', 662.50, false, null),
      
      (v_plan, 9, 'Due April 30, 2027', '2027-04-30', 662.50, false, null),
      
      (v_plan, 10, 'Due May 31, 2027', '2027-05-31', 662.50, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- NOLAN RILEY
  select ga.id into v_student from ga where ga.first_probe = 'nolan' and ga.last_probe = 'riley';
  if v_student is null then
    v_missing := array_append(v_missing, 'NOLAN RILEY');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, annual_tuition, prorated_tuition, proration_label,
       billing_basis, remaining_due, forgiveness_amount, forgiveness_reason,
       status, source_document, notes)
    values
      (v_student, v_year, 19950.00, 14962.50,
       'Prorated Tuition - 9 months: Sept - May', 14962.50, 1853.50, 0.00,
       null, 'active', 'Nolan_Riely_Schedule_of_Tuition_Payments._revised_.pdf', 'No revision required. State award of 12,109 matches the schedule exactly.')
    returning id into v_plan;
    insert into public.student_tuition_instalments (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 231.69, true, '2026-09-01'),
      
      (v_plan, 2, 'Due October 25, 2026', '2026-10-25', 231.69, false, null),
      
      (v_plan, 3, 'Due November 25, 2026', '2026-11-25', 231.69, false, null),
      
      (v_plan, 4, 'Due December 25, 2026', '2026-12-25', 231.69, false, null),
      
      (v_plan, 5, 'Due January 25, 2027', '2027-01-25', 231.69, false, null),
      
      (v_plan, 6, 'Due February 25, 2027', '2027-02-25', 231.69, false, null),
      
      (v_plan, 7, 'Due March 25, 2027', '2027-03-25', 231.69, false, null),
      
      (v_plan, 8, 'Due April 25, 2027', '2027-04-25', 231.67, false, null);
    v_loaded := v_loaded + 1;
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'Aborting: % student(s) not found at The Academy GA: %',
      array_length(v_missing, 1), array_to_string(v_missing, ', ');
  end if;

  raise notice '% plans loaded.', v_loaded;
end $$;

-- Every plan, and whether it actually closes.
--
-- `closes` must be true on all nineteen rows. `unaccounted` is what the
-- instalments plus forgiveness fail to cover — the check the hand-built PDFs
-- asserted but never performed.
select student, school_year, billing_basis, remaining_due,
       forgiveness_amount, scheduled_total, unaccounted, closes, instalment_count
from public.student_tuition_plan_balances
order by closes, student;

commit;
