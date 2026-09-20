-- 284: the 2026-27 tuition plans for The Academy HS and The Academy Virtual.
--
-- 26 plans. 13 at each school. This is the last of the four schools.
--
-- TWO SHAPES, AND WHY.
--
-- Five students have a signed Schedule of Tuition Payments, so they load the
-- way GA and FL did: a year total, a dated instalment list, and a balance that
-- has to close. The other twenty-one are month to month with no end date and no
-- year total, so they load as `monthly_open` — the shape migration 279 added.
--
-- No annual figure is synthesised for a monthly family. 965 x 10 is not a debt
-- Ivy Ash's mother agreed to, and once it is in a column somebody will read it
-- as one.
--
-- WHERE THE MONEY ARRIVES IS RECORDED, because four of these families pay
-- outside the Square recurring export entirely:
--   Jelina Augustave   ClassWallet
--   Ivy Ash            invoiced, a la carte
--   Olson Peters       invoiced, session-based
--   Wren Peters        invoiced, session-based
-- Without payment_channel, every Square-to-JAG reconciliation reports all four
-- as unpaid, and an exception list nobody trusts is worse than none.
--
-- LERA OSTERHOUDT GETS NO PLAN. "Holding pattern" — active, not billed, on
-- purpose. A plan at 0.00 would assert she owes nothing; the absence of one
-- says the arrangement is unsettled, which is the truth.
--
-- ROUNDING. Cole Heffernan's nine payments fall 0.04 short of his stated 8,500
-- and Violet's exceed hers by 0.01. Handled the way 281 handled the FL drift:
-- forgiveness one way, an overpayment credit the other, and not one payment
-- amount touched.
--
-- IDEMPOTENT: an existing active plan for this year is superseded, not
-- duplicated.

begin;

create temp table hv on commit drop as
select s.id,
       case when sc.name ilike '%academy hs%' then 'hs' else 'vi' end as school,
       lower(split_part(s.first_name, ' ', 1))         as first_probe,
       lower(left(split_part(s.last_name, ' ', 1), 5)) as last_probe
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%')
  and s.status = 'active';

do $$
declare
  v_hs_year uuid;
  v_vi_year uuid;
  v_year    uuid;
  v_student uuid;
  v_plan    uuid;
  v_loaded  int := 0;
  v_missing text[] := '{}';
begin
  select sy.id into v_hs_year from public.school_years sy
    join public.schools sc on sc.id = sy.school_id
   where sc.name ilike '%academy hs%' and sy.is_current limit 1;
  select sy.id into v_vi_year from public.school_years sy
    join public.schools sc on sc.id = sy.school_id
   where sc.name ilike '%academy virtual%' and sy.is_current limit 1;

  if v_hs_year is null or v_vi_year is null then
    raise exception 'Aborting: The Academy HS or The Academy Virtual has no current school year.';
  end if;

  update public.student_tuition_plans p
     set status = 'superseded', updated_at = now()
   where p.school_year_id in (v_hs_year, v_vi_year)
     and p.status = 'active'
     and p.student_id in (select hv.id from hv);


  -- Cate Crath
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'cate' and hv.last_probe = 'crath' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Cate Crath');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, forgiveness_amount, forgiveness_reason,
       overpayment_credit, overpayment_reason, status, source_document, notes)
    values (v_student, v_year, 'scheduled', 'square_recurring',
            8500.00, null, null, 8500.00,
            8500.00, 0.00, null,
            0.00, null, 'active',
            'CATE CRATH Schedule of Tuition Payments for Parents. revised 6.7.2026.pdf', 'The HS Experience, 8,500 over ten payments. The document''s December row is printed as 25 December 2027; stored as 2026-12-25, which is the only reading consistent with the rows either side of it.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 850.00, false, null),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due August 25, 2026', '2026-08-25', 850.00, false, null),
      (v_plan, 6, 'Due September 25, 2026', '2026-09-25', 850.00, false, null),
      (v_plan, 7, 'Due October 25, 2026', '2026-10-25', 850.00, false, null),
      (v_plan, 8, 'Due November 25, 2026', '2026-11-25', 850.00, false, null),
      (v_plan, 9, 'Due December 25, 2026', '2026-12-25', 850.00, false, null),
      (v_plan, 10, 'Due January 25, 2027', '2027-01-25', 850.00, false, null),
      (v_plan, 11, 'Due February 25, 2027', '2027-02-25', 850.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 850.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 850.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Cole Heffernan
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'cole' and hv.last_probe = 'heffe' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Cole Heffernan');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, forgiveness_amount, forgiveness_reason,
       overpayment_credit, overpayment_reason, status, source_document, notes)
    values (v_student, v_year, 'scheduled', 'square_recurring',
            8500.00, null, null, 8500.00,
            8500.00, 0.04, 'Rounding: nine payments of 944.44 fall 0.04 short of the stated 8,500.00. School forgiveness 2026-09-06. No payment changed.',
            0.00, null, 'active',
            'Cole n Violet Heffernan Schedule of Tuition Payments. 2026.2027 revised 8.7.2026.pdf', 'The HS Experience 8,500 plus 1 Math class at 0.00. Billed on one Heffernan Square series; his sister Violet is billed on the other.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 944.44, false, null),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due August 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due September 25, 2026', '2026-09-25', 944.44, false, null),
      (v_plan, 7, 'Due October 25, 2026', '2026-10-25', 944.44, false, null),
      (v_plan, 8, 'Due November 25, 2026', '2026-11-25', 944.44, false, null),
      (v_plan, 9, 'Due December 25, 2026', '2026-12-25', 944.44, false, null),
      (v_plan, 10, 'Due January 25, 2027', '2027-01-25', 944.44, false, null),
      (v_plan, 11, 'Due February 25, 2027', '2027-02-25', 944.44, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 944.44, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 944.44, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Alexander Pobuda
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'alexander' and hv.last_probe = 'pobud' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Alexander Pobuda');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, forgiveness_amount, forgiveness_reason,
       overpayment_credit, overpayment_reason, status, source_document, notes)
    values (v_student, v_year, 'scheduled', null,
            12750.00, null, null, 12750.00,
            851.00, 0.00, null,
            0.00, null, 'active',
            'HS. Alexander Pobuda Schedule of Tuition Payments 2026.2027 revised 7.20.2026.pdf', 'HS Experience 8,500 plus 1 Math class 4,250. Florida Step Up covers 11,899, leaving 851 in two payments. The 1,000 HS + core class discount is NOT applied on this document — excused rather than re-cut, on instruction, 2026-09-05.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 425.50, false, null),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due August 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due September 25, 2026', '2026-09-25', 0.00, false, null),
      (v_plan, 7, 'Due October 25, 2026', '2026-10-25', 0.00, false, null),
      (v_plan, 8, 'Due November 25, 2026', '2026-11-25', 425.50, false, null),
      (v_plan, 9, 'Due December 25, 2026', '2026-12-25', 0.00, false, null),
      (v_plan, 10, 'Due January 25, 2027', '2027-01-25', 0.00, false, null),
      (v_plan, 11, 'Due February 25, 2027', '2027-02-25', 0.00, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 0.00, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 0.00, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Andrew Ribeiro
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'andrew' and hv.last_probe = 'ribei' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Andrew Ribeiro');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, forgiveness_amount, forgiveness_reason,
       overpayment_credit, overpayment_reason, status, source_document, notes)
    values (v_student, v_year, 'scheduled', 'state_direct',
            7343.00, null, null, 7343.00,
            0.00, 0.00, null,
            0.00, null, 'active',
            'No document — scholarship only', 'Tuition is the GA Special Needs Scholarship of 7,343.00 and nothing else. No parent portion, no instalments, no Square series. Not a discount — the award is the whole arrangement.')
    returning id into v_plan;
    v_loaded := v_loaded + 1;
  end if;

  -- Ava Caplan
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'ava' and hv.last_probe = 'capla' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Ava Caplan');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 150.00, 'active',
            'No document — month to month', 'Square series #000044, payer Amy Caplan.');
    v_loaded := v_loaded + 1;
  end if;

  -- Isla Fitzgerald
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'isla' and hv.last_probe = 'fitzg' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Isla Fitzgerald');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 806.00, 'active',
            'No document — month to month', 'Square series #000050, payer Scott Fitzgerald. 806.00 x 10 = 8,060.00, her 26-27 parent portion. The tuition calculator is anchored on 1,850.00 for her, which is a 25-26 figure and is wrong for this year.');
    v_loaded := v_loaded + 1;
  end if;

  -- Samuel Johns
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'samuel' and hv.last_probe = 'johns' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Samuel Johns');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1902.33, 'active',
            'No document — month to month', 'Square series #000054, payer Sharona Dobson.');
    v_loaded := v_loaded + 1;
  end if;

  -- Izabella McCallum
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'izabella' and hv.last_probe = 'mccal' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Izabella McCallum');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 850.00, 'active',
            'No document — month to month', 'Square series #000048. The HS Experience at 850.00/month, which is the 8,500 annual over ten months.');
    v_loaded := v_loaded + 1;
  end if;

  -- Claire Meyers
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'claire' and hv.last_probe = 'meyer' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Claire Meyers');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 850.00, 'active',
            'No document — month to month', 'Square series #000039, payer Jamie Cooper Meyers. The HS Experience at 850.00/month, which is the 8,500 annual over ten months.');
    v_loaded := v_loaded + 1;
  end if;

  -- Kody Sanders
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'kody' and hv.last_probe = 'sande' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Kody Sanders');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1850.00, 'active',
            'No document — month to month', 'Square series #000046, payer MEGAN O''LEARY — the payer surname does not match the child''s, which is why this series read as unmatched.');
    v_loaded := v_loaded + 1;
  end if;

  -- Darla Sewell
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'darla' and hv.last_probe = 'sewel' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Darla Sewell');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 850.00, 'active',
            'No document — month to month', 'Square series #000035, payer Cassandra Sewell. The HS Experience at 850.00/month, which is the 8,500 annual over ten months.');
    v_loaded := v_loaded + 1;
  end if;

  -- Penny Shropshire
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'penny' and hv.last_probe = 'shrop' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Penny Shropshire');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 236.90, 'active',
            'No document — month to month', 'Square series #000250, payer Lily Shropshire. Separately: the school filed her parent portion to Step Up as her tuition, capping her award at 2,369 against 9,631 — a 7,262 shortfall. That is a portal problem, not a plan problem, and is tracked on the Tuesday notice.');
    v_loaded := v_loaded + 1;
  end if;

  -- Jacob Stromlund
  v_year := v_hs_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'jacob' and hv.last_probe = 'strom' and hv.school = 'hs';
  if v_student is null then
    v_missing := array_append(v_missing, 'Jacob Stromlund');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 850.00, 'active',
            'No document — month to month', 'Square series #000041, payer NIKKI STROMLUND. The HS Experience at 850.00/month, which is the 8,500 annual over ten months.');
    v_loaded := v_loaded + 1;
  end if;

  -- Violet Heffernan
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'violet' and hv.last_probe = 'heffe' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Violet Heffernan');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, forgiveness_amount, forgiveness_reason,
       overpayment_credit, overpayment_reason, status, source_document, notes)
    values (v_student, v_year, 'scheduled', 'square_recurring',
            12500.00, null, null, 12500.00,
            12500.00, 0.00, null,
            0.01, 'Rounding: nine payments of 1,388.89 exceed the stated 12,500.00 by 0.01. Held as a credit 2026-09-06. No payment changed.', 'active',
            'Cole n Violet Heffernan Schedule of Tuition Payments. 2026.2027 revised 8.7.2026.pdf', 'A la carte, not full Virtual tuition: the document shows the 15,000 annual at 0.00, then Foundational Structured Literacy 7,500, Earthology 2,500 and Lit Lab 2,500.')
    returning id into v_plan;
    insert into public.student_tuition_instalments
      (plan_id, sequence, label, due_date, amount, is_paid, paid_at)
    values
      (v_plan, 1, 'Due Upon Signing Contract', null, 1388.89, false, null),
      (v_plan, 2, 'Due May 25, 2026', '2026-05-25', 0.00, false, null),
      (v_plan, 3, 'Due June 25, 2026', '2026-06-25', 0.00, false, null),
      (v_plan, 4, 'Due July 25, 2026', '2026-07-25', 0.00, false, null),
      (v_plan, 5, 'Due August 25, 2026', '2026-08-25', 0.00, false, null),
      (v_plan, 6, 'Due September 25, 2026', '2026-09-25', 1388.89, false, null),
      (v_plan, 7, 'Due October 25, 2026', '2026-10-25', 1388.89, false, null),
      (v_plan, 8, 'Due November 25, 2026', '2026-11-25', 1388.89, false, null),
      (v_plan, 9, 'Due December 25, 2026', '2026-12-25', 1388.89, false, null),
      (v_plan, 10, 'Due January 25, 2027', '2027-01-25', 1388.89, false, null),
      (v_plan, 11, 'Due February 25, 2027', '2027-02-25', 1388.89, false, null),
      (v_plan, 12, 'Due March 25, 2027', '2027-03-25', 1388.89, false, null),
      (v_plan, 13, 'Due April 25, 2027', '2027-04-25', 1388.89, false, null);
    v_loaded := v_loaded + 1;
  end if;

  -- Ivy Ash
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'ivy' and hv.last_probe = 'ash' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Ivy Ash');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'other',
            null, null, null, null, null, 965.00, 'active',
            'No document — month to month', 'NOT A TUITION STUDENT. A la carte, month to month: 12 one-to-one sessions at 45.00 = 540.00, plus the Earthology class at 425.00. Both figures are monthly. Does not appear in the Square recurring export.');
    v_loaded := v_loaded + 1;
  end if;

  -- Jelina Augustave
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'jelina' and hv.last_probe = 'augus' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Jelina Augustave');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'classwallet',
            null, null, null, null, null, 1500.00, 'active',
            'No document — month to month', 'Paid through CLASSWALLET, not Square. Payer France Augustave. She is absent from the Square export entirely — without this channel recorded, every Square reconciliation will report her as unpaid.');
    v_loaded := v_loaded + 1;
  end if;

  -- Carter Fromm
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'carter' and hv.last_probe = 'fromm' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Carter Fromm');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1850.00, 'active',
            'No document — month to month', 'Square series #000045, payer Doug Fromm.');
    v_loaded := v_loaded + 1;
  end if;

  -- Gabriela Gindel
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'gabriela' and hv.last_probe = 'ginde' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Gabriela Gindel');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1500.00, 'active',
            'No document — month to month', 'Square series #100328, payer Camila Gindel. The series lists two names; there is only one child. The second record, Gabriella Gomes-Gindel, was a duplicate and was archived by migration 282.');
    v_loaded := v_loaded + 1;
  end if;

  -- Amira Hayles
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'amira' and hv.last_probe = 'hayle' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Amira Hayles');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1500.00, 'active',
            'No document — month to month', 'Square series #100329, payer Nicole Hayles.');
    v_loaded := v_loaded + 1;
  end if;

  -- Kelvin McClean
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'kelvin' and hv.last_probe = 'mccle' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Kelvin McClean');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1500.00, 'active',
            'No document — month to month', 'Square series #100323, payer Jadrielle McLean — JAG spells the child McClean and the payer spells herself McLean.');
    v_loaded := v_loaded + 1;
  end if;

  -- Mackenzie Morris
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'mackenzie' and hv.last_probe = 'morri' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Mackenzie Morris');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 557.22, 'active',
            'No document — month to month', 'Square series #000270, payer Brian Morris. THE SERIES ENDS 2026-09-21 — one more payment and it stops. She is also on the Tuesday unpaid notice.');
    v_loaded := v_loaded + 1;
  end if;

  -- Olson Peters
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'olson' and hv.last_probe = 'peter' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Olson Peters');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'other',
            null, null, null, null, null, 800.00, 'active',
            'No document — month to month', 'Structured Literacy tutoring, 8 sessions a month at 100.00. Month to month, not in the Square recurring export. Rate held for this family on instruction 2026-09-06. His application files him as ''Peters Johnston, Olson''; JAG stores Olson Peters.');
    v_loaded := v_loaded + 1;
  end if;

  -- Wren Peters
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'wren' and hv.last_probe = 'peter' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Wren Peters');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'other',
            null, null, null, null, null, 990.00, 'active',
            'No document — month to month', 'Structured Literacy tutoring, 12 sessions a month at 82.50. Month to month, not in the Square recurring export. Rate held for this family on instruction 2026-09-06. Created by migration 283; date of birth and grade still unknown.');
    v_loaded := v_loaded + 1;
  end if;

  -- Louie Putman
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'louie' and hv.last_probe = 'putma' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Louie Putman');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 1500.00, 'active',
            'No document — month to month', 'Square series #100330, payer Sarah Putnam — payer spelt Putnam, child Putman.');
    v_loaded := v_loaded + 1;
  end if;

  -- Maximillian Salas
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'maximillian' and hv.last_probe = 'salas' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Maximillian Salas');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 479.07, 'active',
            'No document — month to month', 'Square series #100349, payer GABRIEL SEMIDEY. Florida Step Up funded; this is the parent portion on top.');
    v_loaded := v_loaded + 1;
  end if;

  -- Carwyn Williams
  v_year := v_vi_year;
  select hv.id into v_student from hv
   where hv.first_probe = 'carwyn' and hv.last_probe = 'willi' and hv.school = 'vi';
  if v_student is null then
    v_missing := array_append(v_missing, 'Carwyn Williams');
  else
    insert into public.student_tuition_plans
      (student_id, school_year_id, billing_mode, payment_channel,
       annual_tuition, prorated_tuition, proration_label, billing_basis,
       remaining_due, monthly_amount, status, source_document, notes)
    values (v_student, v_year, 'monthly_open', 'square_recurring',
            null, null, null, null, null, 400.00, 'active',
            'No document — month to month', 'Square series #100321, payer Sheena Williams.');
    v_loaded := v_loaded + 1;
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'Aborting: % student(s) not found at HS/Virtual: %',
      array_length(v_missing, 1), array_to_string(v_missing, ', ');
  end if;

  raise notice '% plan(s) loaded.', v_loaded;
end $$;

commit;

-- Every HS and Virtual plan. `closes` is true for the five scheduled ones and
-- NULL for the twenty-one monthly ones, which have nothing to close.
select school, student, billing_mode, payment_channel,
       monthly_amount, remaining_due, forgiveness_amount, overpayment_credit,
       scheduled_total, unaccounted, closes
from public.student_tuition_plan_balances
where school ilike '%academy hs%' or school ilike '%academy virtual%'
order by school, billing_mode, student;

