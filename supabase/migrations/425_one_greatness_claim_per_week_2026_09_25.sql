-- ONE GREATNESS CLAIM PER WEEK - 25 September 2026
--
-- The pay sheet now asks "How many GREATNESS Reports did you complete this
-- week?" and saves the answer as a contractor_work_claims row keyed on the
-- Monday, work_code 'greatness_report'.
--
-- SAVING MUST REPLACE, NOT ACCUMULATE. Without a unique key, a teacher who
-- picks 8, changes her mind and picks 4 has claimed twelve. The screen would
-- show her the last number she chose and the pay run would total both rows.
-- Nobody would notice until somebody added up a month.
--
-- WHY THE INDEX IS NOT PARTIAL. A partial unique index cannot be named by
-- PostgREST's on-conflict inference, which sends only the column list - so a
-- partial index would exist and the upsert would still fail. Keyed on all
-- three columns for every work code instead, which is also the right shape:
-- quantity already carries "two of these on the same day", so a second row for
-- the same person, code and date was never meaningful.
--
-- IT REFUSES RATHER THAN MERGES. If duplicate rows already exist this raises
-- and names them. Silently summing them would decide somebody's pay on a guess
-- about which rows were real.

begin;

do $$
declare
  dupes text;
begin
  select string_agg(
           format('%s / %s / %s (%s rows)', employee_id, work_code, work_date, n),
           E'\n'
         )
    into dupes
    from (
      select employee_id, work_code, work_date, count(*) as n
        from public.contractor_work_claims
       group by employee_id, work_code, work_date
      having count(*) > 1
    ) d;

  if dupes is not null then
    raise exception
      'contractor_work_claims already holds more than one row for the same person, code and date. Nothing has changed. Resolve these by hand first, because merging them automatically would decide somebody''s pay by guessing:%s%s',
      E'\n', dupes;
  end if;
end
$$;

create unique index if not exists idx_contractor_work_claims_one_per_day
  on public.contractor_work_claims (employee_id, work_code, work_date);

comment on index public.idx_contractor_work_claims_one_per_day is
  'One claim row per person, per work code, per date. Quantity carries the '
  'count. Required by the GREATNESS Reports upsert on the weekly pay sheet.';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 1) The rate the screen prices from. Expect one row, 5.00, unit 'student',
--    employee_id null (anybody). No row means the dropdown will refuse to save
--    with "There is no GREATNESS Report rate in force" - correct behaviour, but
--    it means the rate was never seeded and no teacher can claim one.
select
  code,
  label,
  unit,
  amount,
  employee_id is null as applies_to_anybody,
  cadence_note,
  effective_from
from public.work_pay_rates
where code = 'greatness_report'
order by effective_from desc;
