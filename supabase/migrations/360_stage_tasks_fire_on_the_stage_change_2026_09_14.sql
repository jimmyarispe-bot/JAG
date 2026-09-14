-- ===========================================================================
-- STOP THE HOLE REFILLING
-- 14 September 2026
-- ===========================================================================
--
-- 316 backfilled 113 families. 359 backfilled ~69 more. Both were backfills,
-- and between them GA alone accumulated 20 new unattended families in five days.
--
-- THE CAUSE, unchanged since 316 wrote it down:
--
--     createStageAutomatedTasks() runs ONLY from transitionLeadStage()
--
-- i.e. only when the application moves a lead. Every other way a lead_stage gets
-- written — the bulk import, hand-written SQL like 302, the public inquiry form,
-- a direct update from a staff screen — sets the column and never calls it. Of
-- the 113 families 316 fixed, ZERO had a stage-history row. The feature was not
-- broken; it had never been reached.
--
-- A backfill can only ever be a broom. This is the door.
--
-- WHY A TRIGGER. 062 already puts a trigger on lead_stage — it maintains
-- stage_entered_at and has fired correctly on every one of these writes,
-- including the imports, for months. The hook is proven; nothing else in this
-- schema catches a direct write. Putting the guarantee where it cannot be
-- bypassed is the same reasoning as making has_role SECURITY DEFINER in 350.
--
-- WHY A TABLE AND NOT A CASE STATEMENT. The stage -> task map lives in
-- TypeScript (registry/stages.ts, workflow.ts). Copying it into a function body
-- makes a second copy that drifts silently. A table can be read, diffed and
-- corrected without a migration, and a test in the repo asserts it still matches
-- the registry.
--
-- THIS CREATES TASKS, NOT MESSAGES. Nothing here touches automation_started_at
-- and nothing here sends a family anything. The automation gate stays exactly as
-- it is — 316 created 113 tasks the same way without enabling it for anybody. A
-- task is a note for staff that a family is waiting.
--
-- SECURITY DEFINER because the public inquiry form writes lead_stage as an
-- anonymous caller, and RLS on admissions_tasks would refuse its insert. A
-- refused insert inside a trigger is silent, which is the failure mode this
-- whole migration exists to end.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- THE MAP
-- ---------------------------------------------------------------------------
create table if not exists public.admissions_stage_tasks (
  lead_stage text primary key,
  task_name  text not null,
  due_days   integer not null check (due_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admissions_stage_tasks is
  'Which follow-up task each lead stage creates, and how many days it is due '
  'after the family enters that stage. Mirrors src/lib/admissions/registry/'
  'stages.ts and STANDARD_AUTOMATED_TASKS in workflow.ts — the code is authority '
  'for display, this table is authority for creation. A stage absent here '
  'creates no task, which is correct for declined, not_returning and enrolled.';

insert into public.admissions_stage_tasks (lead_stage, task_name, due_days) values
  ('new_inquiry',           'Request interest meeting',          2),
  ('information_sent',      'Follow up on information sent',     3),
  ('interest_meeting_held', 'Send application to family',        2),
  ('tour_requested',        'Follow up on tour request',         3),
  ('tour_completed',        'Follow up after tour',              3),
  ('application_started',   'Follow up on application progress', 7),
  ('records_requested',     'Follow up on records request',      5),
  ('accepted',              'Enrollment follow-up',              3)
on conflict (lead_stage) do update
  set task_name = excluded.task_name,
      due_days  = excluded.due_days,
      updated_at = now();

alter table public.admissions_stage_tasks enable row level security;

drop policy if exists admissions_stage_tasks_read on public.admissions_stage_tasks;
create policy admissions_stage_tasks_read on public.admissions_stage_tasks
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- THE DOOR
-- ---------------------------------------------------------------------------
create or replace function public.create_admissions_stage_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cfg record;
begin
  -- Archived leads are not waiting on anybody.
  if new.archived_at is not null then
    return new;
  end if;

  select task_name, due_days into cfg
    from public.admissions_stage_tasks
   where lead_stage = new.lead_stage;

  if not found then
    return new;
  end if;

  -- Idempotent on the same terms 316 and 359 used: one open task of this name
  -- per lead. A family moved back and forth between stages does not collect
  -- duplicates, and a re-run changes nothing.
  if exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = new.id
       and t.task_status = 'open'
       and t.task_name = cfg.task_name
  ) then
    return new;
  end if;

  insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
  values (new.id, cfg.task_name, (current_date + cfg.due_days), 'open');

  return new;
end;
$$;

-- AFTER, not BEFORE: the lead row must exist before a task can reference it on
-- insert. OF lead_stage on update so an unrelated edit — a phone number, a
-- note — does not re-enter the stage.
drop trigger if exists trg_admissions_leads_stage_task on public.admissions_leads;

create trigger trg_admissions_leads_stage_task
  after insert or update of lead_stage on public.admissions_leads
  for each row
  execute function public.create_admissions_stage_task();

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. The map, as the trigger will read it. Eight rows.
select '1. map' as check, lead_stage as detail, task_name || ' / ' || due_days || 'd' as extra
from public.admissions_stage_tasks

union all

-- 2. The trigger exists and is enabled. 'O' means enabled for normal operation.
select '2. trigger', tgname, case tgenabled when 'O' then 'enabled' else tgenabled::text end
from pg_trigger
where tgrelid = 'public.admissions_leads'::regclass
  and not tgisinternal

union all

-- 3. Anybody still unattended at a stage the map covers. EXPECT NOTHING if 359
--    has run — the trigger only helps from now on, it does not backfill.
select '3. still unattended (run 359 first)',
       s.name || ' / ' || l.lead_stage,
       count(*)::text
from public.admissions_leads l
join public.schools s on s.id = l.school_id
join public.admissions_stage_tasks st on st.lead_stage = l.lead_stage
left join (
  select lead_id, count(*) filter (where task_status = 'open') as open_tasks
  from public.admissions_tasks group by lead_id
) t on t.lead_id = l.id
where l.archived_at is null
  and coalesce(t.open_tasks, 0) = 0
group by s.name, l.lead_stage

order by 1, 2;
