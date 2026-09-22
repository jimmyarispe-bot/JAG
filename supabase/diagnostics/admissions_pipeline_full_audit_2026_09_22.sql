/*
  ADMISSIONS PIPELINE — FULL AUDIT. Read-only. Nothing here writes.

  HOW THIS PIPELINE ACTUALLY WORKS, so the results read correctly:

    A lead reaches a stage -> a DECISION GATE opens -> the school leader is
    emailed the question -> they answer -> the family gets the matching email.

    invite_to_apply        opens at tour_completed or interest_meeting_held
    invite_to_shadow_days  opens at application_submitted
    accept_or_deny         opens at shadow_day_completed

  So a family waiting on a gate is waiting on a PERSON, not on a machine. The
  danger is a gate whose notification failed: the question exists, nobody was
  told, and nothing re-sends it. That is what happened to Jayden Roy - both of
  his decision_gate_opened emails to Nina failed on the unverified GA domain.

  WHAT EMPTY MEANS, decided before running it:

  1. open gates      — zero rows means every question has been answered. Good.
                       Rows here are families waiting on a human decision.
  2. never told      — THE DANGEROUS ONE. A pending gate whose notification
                       never successfully sent. Zero rows is the good answer.
                       Rows mean nobody knows they were asked.
  3. gate missing    — a lead parked at a gate-opening stage with NO gate row
                       at all. Zero rows is good. Rows mean the gate never
                       opened, so no question was ever asked about that family.
  4. where everyone  — the whole pipeline by stage. Not a fault list; context.
  5. longest waits   — pending gates by age. Zero rows repeats section 1.
  6. by campus       — mail health per school. A campus with failures and an
                       unverified sending domain will keep failing.
  7. silent stages   — stages holding leads that have produced no email at all.
                       Not necessarily wrong: some stages are not meant to
                       send. Read it as "is this deliberate?"
*/

-- 1. Every question a human has not answered.
select
  '1. open gates' as check,
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' (' || coalesce(s.name, 'no school') || ')' as detail,
  g.gate_key
    || ' | open ' || extract(day from (now() - g.created_at))::int::text || ' days'
    || ' | notified ' || coalesce(g.notify_count::text, '0') || 'x'
    || ' | lead_stage=' || coalesce(l.lead_stage, 'NULL') as extra
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
left join public.schools s on s.id = l.school_id
where g.status = 'pending'

union all

-- 2. Pending gates where NO notification ever successfully sent.
select
  '2. never told',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' (' || coalesce(s.name, 'no school') || ')',
  g.gate_key || ' | nobody was successfully told this question exists'
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
left join public.schools s on s.id = l.school_id
where g.status = 'pending'
  and not exists (
    select 1
    from public.admissions_communications c
    where c.lead_id = g.lead_id
      and c.trigger_event = 'decision_gate_opened'
      and c.delivery_status = 'sent'
  )

union all

-- 3. Leads parked at a gate-opening stage with no gate row at all.
select
  '3. gate missing',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' (' || coalesce(s.name, 'no school') || ')',
  'stage=' || l.lead_stage
    || ' since ' || coalesce(to_char(l.stage_entered_at, 'YYYY-MM-DD'), 'unknown')
    || ' | no gate has ever been opened for this lead'
from public.admissions_leads l
left join public.schools s on s.id = l.school_id
where l.lead_stage in (
        'tour_completed', 'interest_meeting_held',
        'application_submitted', 'shadow_day_completed'
      )
  and not exists (
    select 1 from public.admissions_decision_gates g where g.lead_id = l.id
  )

union all

-- 4. The whole pipeline, by stage.
select
  '4. where everyone',
  coalesce(lead_stage, 'NO STAGE'),
  count(*)::text || ' lead(s)'
from public.admissions_leads
group by lead_stage

union all

-- 5. Pending gates by age, oldest first when sorted.
select
  '5. longest waits',
  lpad(extract(day from (now() - g.created_at))::int::text, 5, '0') || ' days',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')
    || ' | ' || g.gate_key
    || ' | opened ' || to_char(g.created_at, 'YYYY-MM-DD')
from public.admissions_decision_gates g
join public.admissions_leads l on l.id = g.lead_id
where g.status = 'pending'

union all

-- 6. Mail health per campus, with the address it sends as.
select
  '6. by campus',
  coalesce(s.name, 'no school'),
  'sends as ' || coalesce(s.admissions_from_email, 'fallback noreply@thejag.org')
    || ' | ' || count(*) filter (where c.delivery_status = 'sent')::text || ' delivered'
    || ' | ' || count(*) filter (where c.delivery_status = 'failed')::text || ' failed'
from public.schools s
left join public.admissions_leads l on l.school_id = s.id
left join public.admissions_communications c on c.lead_id = l.id
group by s.name, s.admissions_from_email

union all

-- 7. Stages holding leads that have never produced a single email.
select
  '7. silent stages',
  coalesce(l.lead_stage, 'NO STAGE'),
  count(distinct l.id)::text || ' lead(s) at this stage, 0 emails ever sent from it'
from public.admissions_leads l
where not exists (
    select 1 from public.admissions_communications c where c.lead_id = l.id
  )
group by l.lead_stage

order by 1, 2;
