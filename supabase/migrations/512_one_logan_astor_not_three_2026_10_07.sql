-- ==========================================================================
-- 512 — ONE LOGAN ASTOR, NOT THREE
--
-- 7 October 2026. Run top to bottom in the Supabase SQL editor.
-- The last statement is a verification SELECT. Read it before you leave.
--
-- ── WHAT HAPPENED ─────────────────────────────────────────────────────────
--
-- Logan Astor's mother (lorenafranza77@gmail.com) submitted the public
-- interest form three times on the morning of 7 October, at 07:14:50,
-- 07:33:18 and 07:34:48 Eastern. The Academy Virtual received three lead
-- rows for one boy, each with a full answer set, and Heather Brown
-- received three new-inquiry alerts for him.
--
-- She was not being careless. Every public inquiry was taking between 47
-- and 50 seconds to come back, because the form was running the school's
-- nightly job runner inside her submission. That is fixed in commit
-- ab5ae152. This migration cleans up after it.
--
-- ── WHAT THIS DOES, AND WHAT IT DELIBERATELY DOES NOT ─────────────────────
--
-- KEEPS   3e3e6a13-ec07-47d2-92e3-bdebe2c99c00   07:34:48   her last attempt
-- CLOSES  40a51866-1afd-4817-8374-b7ab371576a4   07:33:18
-- CLOSES  1b90fda3-63d4-4d23-bee0-df4313664b29   07:14:50
--
-- Jimmy chose the last one on 7 October: it is the attempt she finished on,
-- and the one most likely to carry her final corrections.
--
-- NOTHING IS DELETED. The two closed rows are ARCHIVED, using the columns
-- migration 228 added for exactly this — archived_at, archived_by,
-- archived_reason — and 228's own comment names this case: "which is why
-- the test rows and the duplicate entries are still sitting in the
-- pipeline."
--
-- lead_stage is LEFT ALONE on all three. 228 is explicit that archiving is
-- a statement about the record, not a position in the funnel, so restoring
-- a lead needs no lookup of what its stage used to be.
--
-- Their interest submissions and answers are left in place too. Three
-- complete sets of what this mother typed is a record worth keeping, and
-- nothing reads them for an archived lead.
--
-- ── WHY automation_started_at IS ALSO CLEARED ─────────────────────────────
--
-- The nightly chase does not honour archived_at. parent-reminders.ts:462
-- selects every lead where automation_started_at is not null and filters
-- on nothing else, so archiving alone would leave Heather Brown being
-- chased about two boys who do not exist, every night, forever.
--
-- Clearing automation_started_at is what actually stops it, and it is an
-- honest statement rather than a workaround: automation is no longer
-- running for this record. The code should honour archived_at as well, and
-- that is a separate change.
--
-- Any open reminder rows for the two closed leads are resolved in the same
-- breath, so nothing is left waiting on a record nobody will act on.
--
-- Idempotent. Safe to re-run.
-- ==========================================================================

begin;

-- 1 ---------------------------------------------------------------- ARCHIVE
update public.admissions_leads
set
  archived_at     = coalesce(archived_at, now()),
  archived_reason = 'Duplicate inquiry. The public interest form took 47-50 '
                 || 'seconds to return (it was running the nightly job '
                 || 'runner, fixed in ab5ae152), so this family submitted '
                 || 'three times on 7 October 2026. Keeping the 07:34:48 '
                 || 'row, 3e3e6a13-ec07-47d2-92e3-bdebe2c99c00.'
where id in (
  '1b90fda3-63d4-4d23-bee0-df4313664b29',   -- 07:14:50
  '40a51866-1afd-4817-8374-b7ab371576a4'    -- 07:33:18
);

-- 2 ------------------------------------------------- STOP THE NIGHTLY CHASE
update public.admissions_leads
set automation_started_at = null
where id in (
  '1b90fda3-63d4-4d23-bee0-df4313664b29',
  '40a51866-1afd-4817-8374-b7ab371576a4'
);

-- 3 --------------------------------------------- CLOSE ANY OPEN WAIT ON THEM
update public.admissions_parent_reminders
set resolved_at = coalesce(resolved_at, now())
where lead_id in (
  '1b90fda3-63d4-4d23-bee0-df4313664b29',
  '40a51866-1afd-4817-8374-b7ab371576a4'
)
and resolved_at is null;

-- 4 ---------------------------------------------------- ASSERT, THEN COMMIT
-- Exactly two archived, exactly one Logan Astor left live. If either number
-- is wrong this raises and the whole transaction rolls back.
do $$
declare
  archived_count int;
  live_count     int;
begin
  select count(*) into archived_count
  from public.admissions_leads
  where id in (
    '1b90fda3-63d4-4d23-bee0-df4313664b29',
    '40a51866-1afd-4817-8374-b7ab371576a4'
  )
  and archived_at is not null
  and automation_started_at is null;

  if archived_count <> 2 then
    raise exception
      '512: expected 2 archived leads with automation stopped, found %',
      archived_count;
  end if;

  select count(*) into live_count
  from public.admissions_leads
  where lower(first_name) = 'logan'
    and lower(last_name)  = 'astor'
    and archived_at is null;

  if live_count <> 1 then
    raise exception
      '512: expected exactly 1 live Logan Astor, found %', live_count;
  end if;
end $$;

commit;

-- 5 ------------------------------------------------------------- SEE IT DONE
-- One row should read LIVE. Two should read ARCHIVED.
select
  l.id::text                                               as lead_id,
  to_char(l.created_at at time zone 'America/New_York',
          'Mon DD HH12:MI:SS AM')                          as submitted,
  case when l.archived_at is null then 'LIVE'
       else 'ARCHIVED' end                                 as state,
  l.lead_stage                                             as lead_stage,
  case when l.automation_started_at is null then 'chase off'
       else 'chase on' end                                 as automation,
  coalesce(left(l.archived_reason, 60), '—')               as reason
from public.admissions_leads l
where lower(l.first_name) = 'logan'
  and lower(l.last_name)  = 'astor'
order by l.created_at;
