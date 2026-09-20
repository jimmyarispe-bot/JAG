-- 320_automation_gate_2026_09_09.sql
--
-- THE GATE THAT MAKES GOING LIVE SAFE.
--
-- Jimmy, 9 September 2026: the public inquiry URLs go on the websites tomorrow.
-- New parents sign up and flow into JAG automatically. **Families already in JAG
-- wait for a human to start them**, and when a human does, they resume from
-- wherever they actually are - not from the beginning.
--
-- WHY THIS IS URGENT RATHER THAN TIDY
--
-- `processParentReminders` selects EVERY ROW in admissions_leads. No filter:
--
--     supabase.from("admissions_leads").select("id, school_id, lead_stage, guardian_email")
--
-- It then opens a reminder timer on every lead sitting in a waiting state,
-- sends at 48 hours, sends again 48 hours later, and escalates to the school.
-- That is 289 families, including the 113 parked at `information_sent` since
-- 2 February. The only thing standing between them and a chasing email today is
-- Jimmy's instruction not to run the job. Going live removes that instruction.
--
-- Three timers are ALREADY OPEN - wait_key `enrollment_not_completed`, first
-- opened 2026-09-07 00:36 UTC. Those are live clocks on real families.
--
-- WHAT THIS DOES
--
--   1. Adds admissions_leads.automation_started_at (nullable).
--      NULL means automation has never touched this lead and will not.
--      Every existing lead is NULL - that is the default, and it is the point.
--   2. Resolves the three open reminder rows, so nothing can fire on a lead the
--      gate has not opened.
--
-- HOW IT BEHAVES AFTERWARDS
--
--   public inquiry form  -> set at creation. Automation runs.
--   bulk import          -> stays NULL. A human starts them.
--   staff "Add Lead"     -> stays NULL, deliberately. Adding a record is not the
--                           same decision as starting to chase someone.
--   human presses Start  -> set to now(). The engine derives which wait applies
--                           from the lead's CURRENT stage, so a family sitting
--                           at shadow_day_scheduled resumes there. No
--                           stage-skipping logic is needed; that is why the gate
--                           is one column rather than a workflow.
--
-- REVERSIBLE. Clearing the column stops automation for that lead again.
-- SAFE TO RE-RUN.

begin;

create temp table _r320 (seq int, item text, detail text);

-- 1. The column ------------------------------------------------------------
alter table public.admissions_leads
  add column if not exists automation_started_at timestamptz;

comment on column public.admissions_leads.automation_started_at is
  'When automated parent follow-up was switched on for this lead. NULL = never '
  'automated; every automated sender must filter on this being non-null. Set by '
  'the public inquiry form at creation, or by a human pressing Start. Existing '
  'leads were left NULL on 2026-09-09 so that going live could not chase 289 '
  'families, 113 of whom had been parked since February.';

-- Finding a lead the automation may touch is the hottest read in the engine.
create index if not exists admissions_leads_automation_started_at_idx
  on public.admissions_leads (automation_started_at)
  where automation_started_at is not null;

do $$
declare
  v_total   bigint;
  v_started bigint;
  v_open    bigint;
begin
  select count(*), count(automation_started_at)
    into v_total, v_started
    from public.admissions_leads;

  insert into _r320 values (10, 'admissions_leads',
    format('%s leads. %s with automation on, %s waiting for a human.',
           v_total, v_started, v_total - v_started));

  -- 2. Park anything already ticking ---------------------------------------
  select count(*) into v_open
    from public.admissions_parent_reminders
   where resolved_at is null and escalated_at is null;

  if v_open = 0 then
    insert into _r320 values (20, 'open reminder timers', 'None were running. Nothing to park.');
  else
    update public.admissions_parent_reminders
       set resolved_at = now()
     where resolved_at is null
       and escalated_at is null;

    insert into _r320 values (20, 'open reminder timers',
      format('%s timer(s) closed. They were opened before the gate existed and '
             'would have fired at families nobody had chosen to contact. A fresh '
             'timer opens by itself once a human starts that lead.', v_open));
  end if;

end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- What happened.
-- ---------------------------------------------------------------------------
select item, detail from _r320 order by seq, item;

-- ---------------------------------------------------------------------------
-- The state of play. EVERY campus should read 0 automated until you start
-- someone, and open_timers must be 0.
-- ---------------------------------------------------------------------------
select
  sc.name                                                          as campus,
  count(*)                                                         as leads,
  count(l.automation_started_at)                                   as automated,
  count(*) - count(l.automation_started_at)                        as waiting_for_a_human,
  (select count(*) from public.admissions_parent_reminders
    where resolved_at is null and escalated_at is null)            as open_timers_network_wide
from public.admissions_leads l
join public.schools sc on sc.id = l.school_id
group by sc.name
order by 2 desc;
