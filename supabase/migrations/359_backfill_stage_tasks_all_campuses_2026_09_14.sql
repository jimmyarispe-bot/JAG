-- ===========================================================================
-- 94 FAMILIES AT AN ACTIVE STAGE WITH NOBODY FOLLOWING UP
-- 14 September 2026
-- ===========================================================================
--
-- Asked because The Academy FL had never had a single admissions task — not one
-- open, none ever, on the largest campus. The answer turned out to be bigger
-- than FL.
--
--   campus / stage                     leads  have a task  nobody
--   The Academy GA   information_sent     30       10        20
--   The Academy Virtual interest_meeting_held 16    1        15
--   The Academy Virtual interview_scheduled  16     1        15
--   The Academy Virtual information_sent     92    80        12
--   The Academy Virtual shadow_day_scheduled 10     2         8
--   The Academy HS   interest_meeting_held    6     0         6
--   The Academy Virtual new_inquiry           9     4         5
--   The Academy FL   tour_scheduled           3     0         3
--   The Academy HS   information_sent        21    18         3
--   ... and nine more rows of one and two
--
-- FL is not special. FL simply has only five active leads — 46 of its 51 are
-- declined or not returning — and all five have nobody.
--
-- WHY. Migration 316's own note, still true: createStageAutomatedTasks() runs
-- ONLY from transitionLeadStage(), i.e. only when a lead MOVES into a stage.
-- Leads whose lead_stage was written directly — the import path, hand-written
-- SQL like 302, the public form — never call it. Of the 113 families 316 fixed,
-- zero had a stage-history row.
--
-- 316 closed one stage on three campuses. It was a backfill, not a fix, and the
-- hole it left has been filling ever since: GA had 10 unattended at
-- information_sent on 9 September and has 20 MORE today. Five days.
--
-- WHAT THIS DOES, AND WHAT IT DOES NOT
--
-- This is also a backfill. It creates the task the workflow would have created,
-- for every stage that HAS a task defined, on every campus. It does not stop it
-- happening again — that needs the creation to fire on the stage change itself
-- rather than on one function nobody calls, and 062 already proves a trigger on
-- lead_stage works. That is the next migration, deliberately separate: this one
-- is safe and reversible, and 94 families should not wait on a design.
--
-- STAGES DELIBERATELY NOT INCLUDED
--
--   interview_scheduled   (16 families)  no task is defined for it anywhere
--   shadow_day_scheduled  ( 9 families)  no task is defined for it anywhere
--
-- Those two need Jimmy to say what should happen and when — most likely a
-- reminder before the date, as tour_scheduled has. Inventing admissions policy
-- inside a migration is not mine to do.
--
--   tour_scheduled        ( 3 families)  its task is a reminder one day BEFORE
--                                        the tour, read from admissions_tours.
--                                        Backfilling it needs that date, and a
--                                        reminder for a tour already past is
--                                        noise rather than help.
--
--   declined, not_returning, enrolled    closed. No follow-up is correct.
--
-- THE DUE DATE ANCHOR. stage_entered_at — when the family actually entered this
-- stage — which 062's trigger maintains on every write, including the direct
-- ones that caused this. Falling back to inquiry_date then created_at. Dating
-- them today would flatten months of neglect into one indistinguishable pile,
-- which is the mistake 316 explicitly avoided.
--
-- IDEMPOTENT. Guarded on the absence of an open task of that name for that lead.
-- ===========================================================================

begin;

with stage_task (lead_stage, task_name, due_days) as (
  values
    -- Sourced from src/lib/admissions/registry/stages.ts and
    -- STANDARD_AUTOMATED_TASKS in src/lib/admissions/workflow.ts. Not invented
    -- here: if these ever disagree with the code, the code is authority and this
    -- file is the one that is wrong.
    ('new_inquiry',           'Request interest meeting',             2),
    ('information_sent',      'Follow up on information sent',        3),
    ('interest_meeting_held', 'Send application to family',           2),
    ('tour_requested',        'Follow up on tour request',            3),
    ('tour_completed',        'Follow up after tour',                 3),
    ('application_started',   'Follow up on application progress',    7),
    ('records_requested',     'Follow up on records request',         5),
    ('accepted',              'Enrollment follow-up',                 3)
)
insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
select
  l.id,
  st.task_name,
  (coalesce(l.stage_entered_at::date, l.inquiry_date, l.created_at::date)
     + (st.due_days || ' days')::interval)::date,
  'open'
from public.admissions_leads l
join stage_task st on st.lead_stage = l.lead_stage
where l.archived_at is null
  and not exists (
    select 1
      from public.admissions_tasks t
     where t.lead_id = l.id
       and t.task_status = 'open'
       and t.task_name = st.task_name
  );

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. Every campus and stage, and how many families still have nobody. The two
--    stages named above should be all that remains, plus tour_scheduled.
select
  s.name as campus,
  l.lead_stage,
  count(*) as leads,
  count(*) filter (where coalesce(t.open_tasks, 0) = 0) as still_nobody
from public.admissions_leads l
join public.schools s on s.id = l.school_id
left join (
  select lead_id, count(*) filter (where task_status = 'open') as open_tasks
  from public.admissions_tasks group by lead_id
) t on t.lead_id = l.id
where l.archived_at is null
  and l.lead_stage not in ('declined', 'not_returning', 'enrolled')
group by s.name, l.lead_stage
having count(*) filter (where coalesce(t.open_tasks, 0) = 0) > 0
order by still_nobody desc, s.name;

-- 2. The Academy FL specifically, which is where this started. Expect its
--    tour_requested and tour_completed families to now have a task, and only
--    the three tour_scheduled ones left.
select
  s.name as campus,
  l.first_name || ' ' || l.last_name as family,
  l.lead_stage,
  t.task_name,
  t.due_date,
  (current_date - t.due_date) as days_overdue
from public.admissions_leads l
join public.schools s on s.id = l.school_id
left join public.admissions_tasks t
  on t.lead_id = l.id and t.task_status = 'open'
where s.name = 'The Academy FL'
  and l.archived_at is null
  and l.lead_stage not in ('declined', 'not_returning', 'enrolled')
order by t.due_date nulls last;
