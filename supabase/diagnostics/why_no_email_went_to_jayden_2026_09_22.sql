/*
  WHY NO EMAIL WENT TO JAYDEN ROY — read-only. Nothing here writes.

  Corrected 2026-09-22: the stage column is `lead_stage`, not `stage`. The
  first version of this file guessed and errored with 42703.

  WHAT EMPTY MEANS, decided before running it:

  1. lead           — zero rows means the name is stored differently, NOT that
                      the family is missing. Widen the LIKE and try again.
  2. stage history  — zero rows means the move was never recorded, which would
                      be its own finding. Rows here prove the move happened.
  3. automation     — 0 of N means the follow-up gate has never been opened for
                      a single family. That is the gate obeying instructions,
                      not a fault.
  4. communications — zero rows means the platform has never created a
                      communication of any kind, for anybody, ever. It does NOT
                      mean a send failed; a failed send still leaves a row.
  5. documents      — zero rows means nothing has ever been uploaded. The screen
                      looks identical when a read is refused, which is why this
                      runs in the SQL editor as service role.
*/

-- 1. The lead, by name.
select
  '1. lead' as check,
  coalesce(first_name, '') || ' ' || coalesce(last_name, '') as detail,
  'id=' || id::text
    || ' | lead_stage=' || coalesce(lead_stage, 'NULL')
    || ' | stage_entered_at=' || coalesce(stage_entered_at::text, 'NULL')
    || ' | automation_started_at=' || coalesce(automation_started_at::text, 'NULL')
    as extra
from public.admissions_leads
where lower(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) like '%jayden%'
   or lower(coalesce(last_name, '')) like '%roy%'

union all

-- 2. Every stage move recorded for that lead. The row is rendered whole
--    rather than by column name, so this cannot fail on a guessed column.
select
  '2. stage history',
  coalesce(h.changed_at::text, 'no timestamp'),
  to_jsonb(h)::text
from public.admissions_lead_stage_history h
join public.admissions_leads l on l.id = h.lead_id
where lower(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')) like '%jayden%'
   or lower(coalesce(l.last_name, '')) like '%roy%'

union all

-- 3. How many families have automated follow-up switched on at all.
select
  '3. automation gate',
  'leads with automation_started_at set',
  count(*) filter (where automation_started_at is not null)::text
    || ' of ' || count(*)::text
from public.admissions_leads

union all

-- 4. Has the platform ever created a communication.
select
  '4. communications',
  'rows in platform_communications',
  count(*)::text
from public.platform_communications

union all

-- 5. Has anything ever been uploaded.
select
  '5. documents',
  'rows in platform_documents',
  count(*)::text
from public.platform_documents

order by 1, 2;
