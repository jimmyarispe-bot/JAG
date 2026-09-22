/*
  WERE DOMINIC AND DEIDRA INVITED, THEN DECLINED — read-only. Nothing writes.

  THE CLAIM TO TEST. Both have an ANSWERED invite_to_apply gate and both now
  sit at lead_stage 'declined'. Both had an application_invited email FAIL on
  15 Sep 2026 on the unverified theacademyfl.org domain.

  If the order is:
        gate answered YES  ->  invite email failed  ->  lead later declined
  then two families were invited to The Academy FL, never found out, and were
  written off for not responding to a message they never received.

  But 'declined' is also what the gate's own NO branch sets. So the same two
  facts fit an innocent reading: answered NO, stage set to declined by the
  gate itself, and the failed email was something else entirely.

  Only the ANSWER and the ORDER can tell these apart. That is what this reads.

  WHAT EMPTY MEANS, decided before running it:

  1. the answer   — the gate row in full. If gate_answer is 'yes' the family
                    was invited. If 'no' they were turned down deliberately
                    and there is no harm here. Zero rows would mean the gate
                    is not where the verification query said it was.
  2. their mail   — every email ever attempted for these two. A FAILED
                    application_invited is the invitation that never arrived.
  3. their stages — every stage move, in order. The decisive row is when
                    'declined' was set and whether that came BEFORE or AFTER
                    the gate was answered. Declined BEFORE the answer is
                    innocent. Declined AFTER a yes is the bad case.
*/

-- 1. The gate, answer and all.
select
  '1. the answer' as check,
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as detail,
  to_jsonb(g)::text as extra
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
where lower(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, ''))
      in ('dominic anders', 'deidra williams')

union all

-- 2. Every email ever attempted for these two.
select
  '2. their mail',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' | ' || to_char(c.created_at, 'YYYY-MM-DD HH24:MI'),
  coalesce(c.trigger_event, 'no trigger')
    || ' | ' || coalesce(c.delivery_status, 'no status')
    || ' | to=' || coalesce(c.sent_to, 'NULL')
from public.admissions_communications c
join public.admissions_leads l on l.id = c.lead_id
where lower(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, ''))
      in ('dominic anders', 'deidra williams')

union all

-- 3. Every stage move, in order.
select
  '3. their stages',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' | ' || to_char(h.changed_at, 'YYYY-MM-DD HH24:MI'),
  coalesce(h.previous_stage, 'NULL') || ' -> ' || coalesce(h.new_stage, 'NULL')
from public.admissions_lead_stage_history h
join public.admissions_leads l on l.id = h.lead_id
where lower(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, ''))
      in ('dominic anders', 'deidra williams')

order by 1, 2;
