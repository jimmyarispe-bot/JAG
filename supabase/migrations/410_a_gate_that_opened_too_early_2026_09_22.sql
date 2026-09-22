/*
  410 — A GATE THAT OPENED TOO EARLY

  WHAT. Jayden Roy (lead 66f94d1c-37d9-4ae3-88a4-b1168636e8a2, The Academy GA)
  has an `accept_or_deny` gate sitting pending while his lead_stage is
  `tour_completed`.

  WHY THAT IS WRONG. GATES in src/lib/admissions/gates/definitions.ts says
  accept_or_deny opens at `shadow_day_completed` only. Jayden has not applied
  and has not attended a shadow day. Answering that gate "yes" would accept a
  student who has not been through the process, and would send his family an
  acceptance out of sequence.

  His other gate, `invite_to_apply`, is CORRECT for tour_completed and is left
  alone. That is the real question waiting for Nina: should this family be
  invited to apply?

  WITHDRAWN, NOT DELETED. The app's own withdrawDecisionGate sets status to
  'withdrawn' and writes a reason into answer_notes. This mirrors that exactly.
  The row survives, because a gate opening at the wrong stage is evidence about
  whatever went wrong on 6 September, and deleting it would destroy that.

  SAFE TO RE-RUN. The update is guarded on status = 'pending', so a second run
  matches nothing rather than re-stamping a row someone has since answered.

  SCOPE. One gate, one lead. The other ten wrong-stage gates found in the
  22 Sep audit are deliberately NOT touched here - they are still awaiting a
  decision from Jimmy.
*/

update public.admissions_decision_gates
set
  status = 'withdrawn',
  answer_notes = 'Withdrawn by migration 410 on 2026-09-22: opened at lead_stage '
    || 'tour_completed, but accept_or_deny opens only at shadow_day_completed. '
    || 'Student has not applied or attended a shadow day. Withdrawn so it cannot '
    || 'be answered out of sequence. The invite_to_apply gate for this lead '
    || 'remains open and is the correct question.'
where lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'
  and gate_key = 'accept_or_deny'
  and status = 'pending';

/*
  VERIFY. Expect exactly two rows for Jayden:
    invite_to_apply  -> pending      (kept, this is the real question)
    accept_or_deny   -> withdrawn    (this migration)

  If accept_or_deny still reads 'pending', the update matched nothing - check
  the lead id before running anything else.
*/
select
  gate_key,
  status,
  coalesce(answer_notes, '(no notes)') as answer_notes
from public.admissions_decision_gates
where lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'
order by gate_key;
