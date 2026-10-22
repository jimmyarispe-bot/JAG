-- 584: One open task per (family, task name).
--
-- Found 22 October 2026: 33 open tasks were second copies, written ~150 ms after
-- the first. Two code paths create the same task on one stage change
-- (createStageAutomatedTasks in workflow.ts, and the workflow engine's
-- create_internal_task step). Five insert sites exist; none checks first.
--
-- Fixed here, once, for every path: a second OPEN task with the same name for
-- the same family is silently skipped. No insert site uses .select() on
-- admissions_tasks, so returning NULL reads as success everywhere.
-- Completed and cancelled tasks are untouched: a task can recur after it closes.

create or replace function public.skip_duplicate_open_admissions_task()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.task_status is distinct from 'open' then
    return new;
  end if;

  -- Two inserts in the same instant must not both see "none yet".
  perform pg_advisory_xact_lock(hashtext(new.lead_id::text || '|' || new.task_name));

  if exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = new.lead_id
       and t.task_name = new.task_name
       and t.task_status = 'open'
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admissions_tasks_skip_duplicate_open on public.admissions_tasks;
create trigger trg_admissions_tasks_skip_duplicate_open
  before insert on public.admissions_tasks
  for each row execute function public.skip_duplicate_open_admissions_task();
