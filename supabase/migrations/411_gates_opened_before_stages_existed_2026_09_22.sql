/*
  411 — GATES THAT OPENED BEFORE THE STAGES EXISTED

  WHAT HAPPENED, established by diagnostic
  were_those_ten_gates_wrong_when_they_opened_2026_09_22.sql:

    6 Sep 2026   Thirty invite_to_apply gates were created. The affected leads
                 had NO stage history at all at that moment - "no history
                 before gate" for every one of the ten below. So whatever
                 created them did not consult lead_stage, because there was no
                 lead_stage to consult. No notification was attempted either:
                 notify_count is still 0.

    10 Sep 14:37 The Monday import wrote those leads' first stage entries, all
                 ten with previous_stage = NULL, all at the same timestamp.

  Wherever a lead landed somewhere other than tour_completed or
  interest_meeting_held, its gate became a question that does not apply. The
  gates still sitting at interest_meeting_held are correct by coincidence, not
  by design, and are deliberately left alone.

  WHY THESE TEN MUST GO. invite_to_apply asks "should we invite this family to
  complete an application?" - a question that only means something after the
  family has met the school. Seven of these leads are at information_sent and
  have never met anyone. One is at tour_requested, where the tour has not
  happened. Two are already declined, where the question is moot.

  WITHDRAWN, NOT DELETED, mirroring withdrawDecisionGate: status becomes
  'withdrawn' and the reason goes into answer_notes. The rows survive because
  they are the evidence of what ran on 6 September, which is still unexplained.

  TARGETING. Matched by CONDITION, not by name, so the statement cannot
  mis-target a lead through a spelling. Pinned to gates created on 2026-09-06
  so it can only ever affect that backfill, never a gate opened legitimately
  later.

  SAFE TO RE-RUN. Guarded on status = 'pending'.

  NOT ADDRESSED HERE, still open:
    - what created the 6 Sep gates, and whether it can run again
    - Emmett Lahti, James Clubb, Kendahl Norman: at interest_meeting_held since
      10 Sep with no gate, because the backfill had already run
    - the ~20 legitimate pending gates nobody was ever notified about
*/

update public.admissions_decision_gates g
set
  status = 'withdrawn',
  answer_notes = 'Withdrawn by migration 411 on 2026-09-22: opened 2026-09-06 '
    || 'before this lead had any stage, then the 2026-09-10 import placed them '
    || 'at a stage that does not open invite_to_apply. The question does not '
    || 'apply to this family at their actual position. Not a decision - a '
    || 'correction.'
from public.admissions_leads l
where l.id = g.lead_id
  and g.status = 'pending'
  and g.gate_key = 'invite_to_apply'
  and g.created_at::date = date '2026-09-06'
  and l.lead_stage not in ('tour_completed', 'interest_meeting_held');

/*
  VERIFY. Expect ten rows, every one 'withdrawn'. If a row still reads
  'pending', its lead_stage is one of the two valid stages and it was correctly
  left alone - check the stage column before assuming the update failed.
*/
select
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as who,
  l.lead_stage,
  g.status
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
where g.gate_key = 'invite_to_apply'
  and g.created_at::date = date '2026-09-06'
  and l.lead_stage not in ('tour_completed', 'interest_meeting_held')
order by who;
