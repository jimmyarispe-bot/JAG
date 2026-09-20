-- 248_retire_placeholder_tuition_plans_2026_09_03.sql
--
-- Migration 056 seeded every school a tuition plan:
--
--   'Standard Tuition — ' || s.name, program null, 12000.00/yr, monthly, active
--
-- Nobody chose that number. It was scaffolding.
--
-- But activation.ts bills from whatever active plan it finds, so the moment a
-- family finished signing their enrollment packet, JAG created an invoice for
-- $1,000/month, wrote invoice_status = 'sent', and told no one. The family owed
-- a figure that appeared in their billing account and the aging report and had
-- no relationship to anything they agreed to.
--
-- This archives those rows. Paired with the code change in the same commit, an
-- enrollment with no real plan now opens a task for the business department
-- instead of inventing a price.
--
-- SAFE TO RE-RUN. It only touches rows that still match the seed exactly - same
-- name shape, same $12,000.00, null program, still active. Edit a plan's amount
-- or name and it is yours, and this leaves it alone.

begin;

do $$
declare
  v_placeholders int;
  v_real         int;
  v_row          record;
begin
  select count(*) into v_placeholders
  from public.tuition_plans
  where status = 'active'
    and program is null
    and annual_amount = 12000.00
    and name like 'Standard Tuition — %';

  select count(*) into v_real
  from public.tuition_plans
  where status = 'active'
    and not (program is null and annual_amount = 12000.00 and name like 'Standard Tuition — %');

  raise notice 'Active plans: % placeholder, % real.', v_placeholders, v_real;

  if v_placeholders = 0 then
    raise notice 'Nothing to archive - the placeholders are already gone.';
  end if;

  for v_row in
    select tp.name, tp.annual_amount, s.name as school
    from public.tuition_plans tp
    join public.schools s on s.id = tp.school_id
    where tp.status = 'active'
      and tp.program is null
      and tp.annual_amount = 12000.00
      and tp.name like 'Standard Tuition — %'
    order by s.name
  loop
    raise notice 'Archiving: % (% / $%)', v_row.name, v_row.school, v_row.annual_amount;
  end loop;
end $$;

update public.tuition_plans
set
  status = 'archived',
  description = trim(both ' | ' from
    coalesce(description, '') || ' | ' ||
    'Archived 2026-09-03: seeded placeholder from migration 056, never a real price.'
  ),
  updated_at = now()
where status = 'active'
  and program is null
  and annual_amount = 12000.00
  and name like 'Standard Tuition — %';

commit;

-- What the schools have now. Every row here is a price a human chose.
select
  s.name                as school,
  coalesce(tp.name, '— no active tuition plan —') as plan,
  tp.program,
  tp.annual_amount,
  tp.payment_schedule
from public.schools s
left join public.tuition_plans tp
  on tp.school_id = s.id
 and tp.status = 'active'
order by s.name, tp.name;
