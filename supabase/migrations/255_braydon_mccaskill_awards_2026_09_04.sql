-- 255_braydon_mccaskill_awards_2026_09_04.sql
--
-- The first real awards, from BRAYDON MCCASKILL Schedule of Tuition Payments
-- 2026-2027, revised 8.12.2026:
--
--     GA Goal Scholarship                      1,000.00
--     GA Special Needs Scholarship (100%)     14,562.00
--
-- Awards only. No receipts, because as far as this system knows Georgia has
-- not sent anything yet — and saying so is the entire point of migration 254.
-- After this runs, Braydon's balance row reads $15,562 awarded, $0 received,
-- $15,562 outstanding. If Georgia has in fact paid, that is a receipt to
-- record, not a reason to fudge the award.
--
-- His family still owes $1,063. That is unaffected by any of this.
--
-- SAFE TO RE-RUN. The unique index on (student_id, program_name, award_year)
-- means a second run changes nothing.

begin;

do $$
declare
  v_student_id uuid;
  v_school_id  uuid;
  v_n          int;
begin
  -- Match on guardian email AND surname AND school. A name alone is not an
  -- identifier: "Julian Oubre / Towa" became two students in this database for
  -- exactly that reason.
  select count(*) into v_n
  from public.students s
  join public.schools sc  on sc.id = s.school_id
  join public.guardians g on g.family_id = s.family_id
  where lower(g.email) = 'stella0679@gmail.com'
    and s.last_name ilike 'McCaskill'
    and sc.name = 'The Academy GA';

  if v_n <> 1 then
    raise exception
      'Expected exactly 1 student matching Braydon McCaskill / stella0679@gmail.com at The Academy GA, found %. Do not guess — check first.', v_n;
  end if;

  select s.id, s.school_id into v_student_id, v_school_id
  from public.students s
  join public.schools sc  on sc.id = s.school_id
  join public.guardians g on g.family_id = s.family_id
  where lower(g.email) = 'stella0679@gmail.com'
    and s.last_name ilike 'McCaskill'
    and sc.name = 'The Academy GA';

  raise notice 'Matched student % at school %', v_student_id, v_school_id;

  insert into public.scholarship_awards
    (student_id, school_id, program_code, program_name, award_year, awarded_amount, status, notes)
  values
    (v_student_id, v_school_id, 'ga_goal',
     'GA Goal Scholarship', '2026-2027', 1000.00, 'awarded',
     'From Schedule of Tuition Payments 2026-27, revised 8.12.2026.'),
    (v_student_id, v_school_id, 'ga_esa',
     'GA Special Needs Scholarship', '2026-2027', 14562.00, 'awarded',
     'Applied at 100% on the schedule. From Schedule of Tuition Payments 2026-27, revised 8.12.2026.')
  on conflict (student_id, program_name, award_year) do nothing;
end $$;

commit;

-- What the school is owed, and by whom.
select
  s.first_name || ' ' || s.last_name as student,
  sc.name                            as school,
  b.program_name,
  b.award_year,
  b.awarded_amount,
  b.received_amount,
  b.outstanding_amount
from public.scholarship_award_balances b
join public.students s  on s.id  = b.student_id
join public.schools sc  on sc.id = b.school_id
order by s.last_name, b.program_name;
