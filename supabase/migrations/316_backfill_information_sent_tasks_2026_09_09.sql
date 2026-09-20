-- 316_backfill_information_sent_tasks_2026_09_09.sql
--
-- 113 families are parked at lead_stage = 'information_sent' with NO open task
-- between them. Not one, across three campuses, going back to 2 February 2026.
-- This creates the follow-up task the workflow was always supposed to create.
--
--     The Academy Virtual   85   oldest 2026-02-03   newest 2026-09-03
--     The Academy HS        18   oldest 2026-02-05   newest 2026-09-03
--     The Academy GA        10   oldest 2026-02-02   newest 2026-06-23
--
-- WHY THERE ARE NONE
--
-- src/lib/admissions/workflow.ts DOES define the task:
--
--     information_sent: { taskName: "Follow up on information sent", dueDays: 3 }
--
-- but createStageAutomatedTasks() runs only from transitionLeadStage(), i.e.
-- only when a lead MOVES into the stage. Checked against
-- admissions_lead_stage_history: of the 113, **zero** have a history row for
-- new_stage = 'information_sent'. None of them ever transitioned. Their
-- lead_stage was written directly - by the import path, or by hand-written SQL
-- like 302 - which never calls the workflow.
--
-- So this is not a broken feature. It is a feature that has never been reached.
--
-- A SEPARATE BUG, NOT THE CAUSE HERE, BUT FIX IT ANYWAY
--
-- workflow.ts:72 inserts the task and discards the result entirely - no
-- `const { error } =`, while actions.ts:179 does exactly the same insert and
-- checks. transitionLeadStage then returns { success: true } regardless. Had
-- the path ever run and been refused, it would have reported success and
-- nobody would have known. That is the sixth instance of the pattern recorded
-- in open-items.md. It needs a code ship; it is not what this migration fixes.
--
-- THE DUE DATE IS DELIBERATE
--
-- Each task is dated inquiry_date + 3 days - the date the workflow WOULD have
-- set had it run. Every one is therefore already overdue, which is true, and
-- sorting by due date puts the longest-neglected family first. Dating them all
-- "today" would flatten seven months of difference into one indistinguishable
-- pile.
--
-- WHAT THIS DOES TO THE DASHBOARD. "Waiting on you" goes from 3 open tasks to
-- 116. That is not the migration breaking something - it is 113 families who
-- have had no next step, becoming visible. The widget takes the first 12.
--
-- IDEMPOTENT. Guarded on the absence of an open task of this name per lead.

begin;

insert into public.admissions_tasks (lead_id, task_name, due_date, task_status)
select
  l.id,
  'Follow up on information sent',
  -- inquiry_date is the honest anchor. Where it is missing, created_at is the
  -- next best thing; coalescing to today would silently make the oldest
  -- families look like the newest.
  (coalesce(l.inquiry_date, l.created_at::date) + interval '3 days')::date,
  'open'
from public.admissions_leads l
where l.lead_stage = 'information_sent'
  and not exists (
    select 1
      from public.admissions_tasks t
     where t.lead_id = l.id
       and t.task_status = 'open'
       and t.task_name = 'Follow up on information sent'
  );

commit;

-- ---------------------------------------------------------------------------
-- Verification. Expect 113 tasks across three campuses, every one overdue,
-- Virtual carrying 85 of them.
--
--   The Academy Virtual   85
--   The Academy HS        18
--   The Academy GA        10
--
-- days_overdue on the oldest should be roughly 215 (early February).
-- ---------------------------------------------------------------------------

select
  s.name                                   as campus,
  count(*)                                 as tasks_open,
  min(t.due_date)                          as oldest_due,
  max(t.due_date)                          as newest_due,
  (current_date - min(t.due_date))         as days_overdue_worst
from public.admissions_tasks t
join public.admissions_leads l on l.id = t.lead_id
join public.schools s          on s.id = l.school_id
where t.task_status = 'open'
  and t.task_name = 'Follow up on information sent'
group by s.name
order by count(*) desc;
