/*
  WERE THOSE TEN GATES WRONG WHEN THEY OPENED — read-only. Nothing writes.

  THE QUESTION. Ten pending gates sit on leads whose CURRENT stage cannot open
  them. That has two very different causes and the audit cannot tell them apart:

    A. The gate opened at a stage that never should have opened it.
       -> the gate is illegitimate. Withdraw it.

    B. The gate opened correctly, and the lead was moved BACKWARDS afterwards.
       -> the gate is legitimate and the STAGE is the thing that moved.
          Withdrawing it would delete a real question.

  invite_to_apply may only open at `tour_completed` or `interest_meeting_held`.

  HOW THIS TELLS THEM APART. For each gate it finds the lead's stage as it was
  at the moment the gate was created, by taking the most recent stage-history
  entry on or before the gate's created_at.

  WHAT EMPTY MEANS, decided before running it:

  1. stage when opened — one row per wrong-stage gate. "stage at open" is the
                         verdict. If it reads tour_completed or
                         interest_meeting_held, the gate was LEGITIMATE and the
                         lead moved later: case B, do not withdraw.
                         Anything else is case A.
                         'no history before gate' means the lead has no
                         recorded stage move before the gate existed - that is
                         itself case A, since nothing put them at a gate stage.

  2. moved after       — every stage move that happened AFTER the gate opened.
                         Zero rows for a lead means nobody moved them, so their
                         current stage IS the stage at open and case B is
                         ruled out.
*/

with wrong_stage_gates as (
  select
    g.id as gate_id,
    g.lead_id,
    g.gate_key,
    g.created_at as gate_opened,
    l.lead_stage as stage_now,
    coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as who
  from public.admissions_decision_gates g
  join public.admissions_leads l on l.id = g.lead_id
  where g.status = 'pending'
    and g.gate_key = 'invite_to_apply'
    and l.lead_stage not in ('tour_completed', 'interest_meeting_held')
)

-- 1. What stage was the lead at when the gate opened?
select
  '1. stage when opened' as check,
  w.who as detail,
  'now=' || w.stage_now
    || ' | at open=' || coalesce(
         (
           select h.new_stage
           from public.admissions_lead_stage_history h
           where h.lead_id = w.lead_id
             and h.changed_at <= w.gate_opened
           order by h.changed_at desc
           limit 1
         ),
         'no history before gate'
       )
    || ' | opened ' || to_char(w.gate_opened, 'YYYY-MM-DD') as extra
from wrong_stage_gates w

union all

-- 2. Stage moves that happened after the gate opened.
select
  '2. moved after',
  w.who,
  to_char(h.changed_at, 'YYYY-MM-DD HH24:MI')
    || ' | ' || coalesce(h.previous_stage, 'NULL') || ' -> ' || coalesce(h.new_stage, 'NULL')
from wrong_stage_gates w
join public.admissions_lead_stage_history h on h.lead_id = w.lead_id
where h.changed_at > w.gate_opened

order by 1, 2, 3;
