-- 285: open the invite-to-apply gate for the families who never got one.
--
-- THE PROBLEM, stated exactly.
--
-- A gate opens inside `transitionCaseStage` — a lead is asked about when it
-- MOVES INTO an opening stage. That is the right design: a question tied to one
-- code path silently fails to open on the others, which is why migration 246
-- derived the opening map from the definitions instead.
--
-- But it means the feature shipped on 3 September with an empty starting
-- position. Every lead already sitting at `tour_completed` or
-- `interest_meeting_held` had arrived there BEFORE the gates existed, and none
-- has moved since. No transition, no gate.
--
--   gates ever opened:     1
--   gates ever answered:   0
--   leads at those stages: 32
--
-- Thirty-two families met a school leader, told them about their child, and are
-- sitting in a system that has no question waiting about them. They are not
-- stalled in the process. They are invisible to it.
--
-- WHY THIS SENDS NO EMAIL.
--
-- `openDecisionGate` normally fires a staff notification. This migration
-- deliberately does not: opening thirty-two gates at once would put thirty-two
-- separate "a decision is waiting" emails in one inbox in one second, and the
-- reliable result of that is a filter rule. The gates appear on the decisions
-- page, which is where they get answered anyway, and `notified_at` is left null
-- so it is honest about never having been sent.
--
-- WHAT IT WILL NOT DO.
--
--   * Re-ask a question already asked. Any lead with an invite_to_apply gate of
--     ANY status is skipped, answered or not.
--   * Touch an archived lead.
--   * Move any stage. An opened question is not progress; the stage moves when
--     the family actually does something.
--
-- IDEMPOTENT.

begin;

insert into public.admissions_decision_gates (lead_id, gate_key, status, notify_count)
select l.id, 'invite_to_apply', 'pending', 0
from public.admissions_leads l
where l.lead_stage in ('tour_completed', 'interest_meeting_held')
  and l.archived_at is null
  and not exists (
    select 1
    from public.admissions_decision_gates g
    where g.lead_id = l.id
      and g.gate_key = 'invite_to_apply'
  )
on conflict do nothing;

commit;

-- What is now waiting, by school and by how long the family has been sitting
-- there. The oldest rows are the ones to call first: these are families who
-- met a school leader and then heard nothing.
select coalesce(sc.name, '(no school)')                    as school,
       l.first_name || ' ' || l.last_name                  as student,
       l.guardian_first_name || ' ' || l.guardian_last_name as guardian,
       l.guardian_email,
       l.lead_stage,
       l.created_at::date                                  as lead_created,
       (current_date - l.created_at::date)                  as days_waiting
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
left join public.schools sc on sc.id = l.school_id
where g.gate_key = 'invite_to_apply'
  and g.status = 'pending'
order by l.created_at;
