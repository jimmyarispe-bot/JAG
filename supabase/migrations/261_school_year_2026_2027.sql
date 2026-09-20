-- 261: create the 2026-2027 school year for all four schools.
--
-- JAG has no 2026-27 school year. The only years defined are 2025-2026, they
-- all ended in June, and all four are still flagged is_current. Today —
-- 5 September 2026 — falls inside none of them.
--
-- Nothing complains about this, which is the problem. sis_enrollments.
-- school_year_id is NOT NULL, so both the import path and the admissions
-- conversion look up a year and skip the row rather than fail when the answer
-- is wrong. Three enrolment rows exist in the entire database and all three
-- point at last year.
--
-- Every schedule, invoice and enrolment created from here would attach to a
-- year that ended in June, and would look entirely normal on screen.
--
-- Each new year is derived from that school's own 2025-2026 row, +1 year, so
-- the Traditional/Year-Round distinction and each campus's own dates carry over
-- rather than being guessed.
--
-- IDEMPOTENT. Running twice creates nothing twice.

begin;

do $$
declare
  v_made int := 0;
  r record;
  v_new_id uuid;
begin
  for r in
    select sy.id, sy.school_id, sc.name as school_name, sy.name,
           sy.start_date, sy.end_date, sy.school_start_month
    from public.school_years sy
    join public.schools sc on sc.id = sy.school_id
    where sy.name like '2025-2026%'
  loop
    -- Skip a school that already has a 2026-2027 year.
    if exists (
      select 1 from public.school_years
      where school_id = r.school_id and name like '2026-2027%'
    ) then
      raise notice '% already has a 2026-2027 year. Skipped.', r.school_name;
      continue;
    end if;

    insert into public.school_years
      (school_id, name, start_date, end_date, school_start_month, is_current, status)
    values
      (r.school_id,
       replace(r.name, '2025-2026', '2026-2027'),
       r.start_date + interval '1 year',
       r.end_date   + interval '1 year',
       r.school_start_month,
       false,          -- flipped below, once every school has its new year
       'active')
    returning id into v_new_id;

    v_made := v_made + 1;
    raise notice 'Created % for %', replace(r.name, '2025-2026', '2026-2027'), r.school_name;
  end loop;

  raise notice '% school years created.', v_made;
end $$;

-- Exactly one current year per school: the one today actually falls inside.
-- Done as a single pass so no school is ever left with none.
update public.school_years sy
   set is_current = (current_date between sy.start_date and sy.end_date),
       updated_at = now();

-- Last year is finished. Say so, rather than leaving it 'active' forever.
update public.school_years
   set status = 'inactive',
       updated_at = now()
 where name like '2025-2026%'
   and end_date < current_date
   and status = 'active';

-- Move the three existing enrolments onto the right year. All three belong to
-- students confirmed enrolled for 26-27: Nolan Riley (created today) and
-- Josiah Cooks, who is dual-enrolled academy_hs + academy_virtual.
update public.sis_enrollments e
   set school_year_id = ny.id
  from public.school_years oy,
       public.school_years ny
 where e.school_year_id = oy.id
   and oy.name like '2025-2026%'
   and ny.school_id = oy.school_id
   and ny.name like '2026-2027%';

-- What we now have. Today should fall inside exactly one year per school.
select sc.name as school,
       sy.name as year,
       sy.start_date, sy.end_date, sy.is_current, sy.status,
       case when current_date between sy.start_date and sy.end_date
            then '<-- today' else '' end as note
from public.school_years sy
join public.schools sc on sc.id = sy.school_id
order by sc.name, sy.start_date desc;

commit;
