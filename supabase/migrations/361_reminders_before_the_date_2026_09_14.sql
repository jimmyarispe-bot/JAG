-- ===========================================================================
-- 25 FAMILIES WITH AN INTERVIEW OR A SHADOW DAY AND NOTHING TRACKING IT
-- 14 September 2026
-- ===========================================================================
--
--   The Academy Virtual  interview_scheduled   16 leads,  1 task
--   The Academy Virtual  shadow_day_scheduled  10 leads,  2 tasks
--   The Academy HS       interview_scheduled    1 lead,   0 tasks
--   The Academy HS       shadow_day_scheduled   1 lead,   0 tasks
--   The Academy FL       tour_scheduled         3 leads,  0 tasks
--
-- Neither stage has a task defined ANYWHERE in the codebase. Not missing from
-- 359's backfill — missing from the product. Somebody books an interview and
-- nothing is ever created to make sure it happens.
--
-- tour_scheduled is different and worse in its own way: a task IS defined for
-- it, in TypeScript, as a reminder one day BEFORE the tour read from
-- admissions_tours. Like every other stage task it only ran from
-- transitionLeadStage(), so FL's three never got one.
--
-- WHY THESE THREE CANNOT USE 360's MAP AS IT STANDS
--
-- 360 stores "N days after the family entered the stage". That is the wrong
-- shape here. A reminder is useful one day before the appointment, not three
-- days after somebody booked it — book a tour a month out under the old shape
-- and the reminder fires four weeks early.
--
-- So the map gains an anchor: stage_entry, as before, or scheduled_event, which
-- reads the real date out of admissions_interviews or admissions_tours. due_days
-- may now be negative, which is what "the day before" means.
--
-- ORDER OF OPERATIONS, CHECKED NOT ASSUMED. actions.ts inserts the
-- admissions_interviews row and THEN transitions the stage, so by the time this
-- trigger fires the date already exists. If that ever reverses, the trigger
-- finds no date and creates nothing — it does not create a wrong one.
--
-- THE PAST IS NOT A REMINDER
--
-- A reminder for an appointment that already happened is noise in somebody's
-- queue. For the 25 families whose date has passed, the honest task is a
-- different one: find out whether it took place. The trigger only ever creates
-- reminders for future dates; the backfill at the bottom creates the "confirm"
-- task, once, for the ones already behind us.
--
-- Nothing here touches automation_started_at or sends a family anything.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. THE MAP GAINS AN ANCHOR
-- ---------------------------------------------------------------------------
alter table public.admissions_stage_tasks
  drop constraint if exists admissions_stage_tasks_due_days_check;

alter table public.admissions_stage_tasks
  add column if not exists anchor text not null default 'stage_entry';

alter table public.admissions_stage_tasks
  drop constraint if exists admissions_stage_tasks_anchor_check;

alter table public.admissions_stage_tasks
  add constraint admissions_stage_tasks_anchor_check
  check (anchor in ('stage_entry', 'scheduled_event'));

comment on column public.admissions_stage_tasks.anchor is
  'stage_entry: due_days counted from when the family entered the stage. '
  'scheduled_event: counted from the appointment itself, read from '
  'admissions_interviews or admissions_tours — due_days is negative for a '
  'reminder BEFORE the date.';

insert into public.admissions_stage_tasks (lead_stage, task_name, due_days, anchor) values
  ('tour_scheduled',       'Tour reminder — contact family',       -1, 'scheduled_event'),
  ('interview_scheduled',  'Interview reminder — contact family',  -1, 'scheduled_event'),
  ('shadow_day_scheduled', 'Shadow day reminder — contact family', -1, 'scheduled_event')
on conflict (lead_stage) do update
  set task_name  = excluded.task_name,
      due_days   = excluded.due_days,
      anchor     = excluded.anchor,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. THE TRIGGER LEARNS TO READ A DATE
-- ---------------------------------------------------------------------------
create or replace function public.create_admissions_stage_task()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cfg        record;
  event_at   timestamptz;
  task_due   date;
begin
  if new.archived_at is not null then
    return new;
  end if;

  select task_name, due_days, anchor into cfg
    from public.admissions_stage_tasks
   where lead_stage = new.lead_stage;

  if not found then
    return new;
  end if;

  if cfg.anchor = 'scheduled_event' then
    if new.lead_stage = 'tour_scheduled' then
      select max(t.scheduled_at) into event_at
        from public.admissions_tours t
       where t.lead_id = new.id;
    else
      select max(i.scheduled_at) into event_at
        from public.admissions_interviews i
       where i.lead_id = new.id;
    end if;

    -- No date means nothing honest to remind anybody about. Silence here is
    -- correct; a reminder dated from today would be a guess wearing a date.
    if event_at is null then
      return new;
    end if;

    -- The past is not a reminder. Backfilled separately, once, as a question
    -- rather than a prompt.
    if event_at < now() then
      return new;
    end if;

    task_due := (event_at::date + cfg.due_days);
  else
    task_due := (current_date + cfg.due_days);
  end if;

  if exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = new.id
       and t.task_status = 'open'
       and t.task_name = cfg.task_name
  ) then
    return new;
  end if;

  insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
  values (new.id, cfg.task_name, task_due, 'open');

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. THE 25 ALREADY BEHIND US
-- ---------------------------------------------------------------------------
begin;

-- Future appointments: the reminder the trigger would now create.
insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
select distinct on (l.id)
  l.id,
  st.task_name,
  (ev.scheduled_at::date + st.due_days),
  'open'
from public.admissions_leads l
join public.admissions_stage_tasks st
  on st.lead_stage = l.lead_stage and st.anchor = 'scheduled_event'
join lateral (
  select max(x.scheduled_at) as scheduled_at
  from (
    select i.scheduled_at from public.admissions_interviews i
     where i.lead_id = l.id and l.lead_stage <> 'tour_scheduled'
    union all
    select t.scheduled_at from public.admissions_tours t
     where t.lead_id = l.id and l.lead_stage = 'tour_scheduled'
  ) x
) ev on true
where l.archived_at is null
  and ev.scheduled_at is not null
  and ev.scheduled_at >= now()
  and not exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = l.id and t.task_status = 'open' and t.task_name = st.task_name
  );

-- Past appointments: a question, not a prompt. Due today — the wait that
-- matters is how long nobody has known, and that starts now.
insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
select distinct on (l.id)
  l.id,
  case l.lead_stage
    when 'tour_scheduled'       then 'Confirm the tour took place'
    when 'interview_scheduled'  then 'Confirm the interview took place'
    when 'shadow_day_scheduled' then 'Confirm the shadow day took place'
  end,
  current_date,
  'open'
from public.admissions_leads l
join lateral (
  select max(x.scheduled_at) as scheduled_at
  from (
    select i.scheduled_at from public.admissions_interviews i
     where i.lead_id = l.id and l.lead_stage <> 'tour_scheduled'
    union all
    select t.scheduled_at from public.admissions_tours t
     where t.lead_id = l.id and l.lead_stage = 'tour_scheduled'
  ) x
) ev on true
where l.archived_at is null
  and l.lead_stage in ('tour_scheduled', 'interview_scheduled', 'shadow_day_scheduled')
  and ev.scheduled_at is not null
  and ev.scheduled_at < now()
  and not exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = l.id and t.task_status = 'open'
  );

-- No appointment on record at all. Neither a reminder nor a confirmation fits:
-- the stage says one was booked and the schedule says otherwise, and somebody
-- has to look. Rare, and worth being loud about rather than skipping.
insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
select
  l.id,
  'Stage says scheduled but no appointment is on record — check',
  current_date,
  'open'
from public.admissions_leads l
where l.archived_at is null
  and l.lead_stage in ('tour_scheduled', 'interview_scheduled', 'shadow_day_scheduled')
  and not exists (
    select 1 from public.admissions_interviews i where i.lead_id = l.id
  )
  and not exists (
    select 1 from public.admissions_tours t where t.lead_id = l.id
  )
  and not exists (
    select 1 from public.admissions_tasks t
     where t.lead_id = l.id and t.task_status = 'open'
  );

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. The three scheduled-event stages, and whether anybody is still unattended.
select
  '1. scheduled stages' as check,
  s.name || ' / ' || l.lead_stage as detail,
  count(*) filter (where coalesce(t.open_tasks, 0) = 0)::text || ' of '
    || count(*)::text || ' still nobody' as extra
from public.admissions_leads l
join public.schools s on s.id = l.school_id
left join (
  select lead_id, count(*) filter (where task_status = 'open') as open_tasks
  from public.admissions_tasks group by lead_id
) t on t.lead_id = l.id
where l.archived_at is null
  and l.lead_stage in ('tour_scheduled', 'interview_scheduled', 'shadow_day_scheduled')
group by s.name, l.lead_stage

union all

-- 2. What this created, by task name.
select '2. created', t.task_name, count(*)::text
from public.admissions_tasks t
where t.task_status = 'open'
  and t.task_name in (
    'Tour reminder — contact family',
    'Interview reminder — contact family',
    'Shadow day reminder — contact family',
    'Confirm the tour took place',
    'Confirm the interview took place',
    'Confirm the shadow day took place',
    'Stage says scheduled but no appointment is on record — check'
  )
group by t.task_name

union all

-- 3. The whole map now, anchor included. Eleven rows.
select '3. map', lead_stage, task_name || ' / ' || due_days || 'd / ' || anchor
from public.admissions_stage_tasks

order by 1, 2;
