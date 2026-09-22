/*
  DID JAYDEN'S EMAIL ACTUALLY SEND — read-only. Nothing here writes.

  CORRECTION. An earlier check counted `platform_communications` and found 0,
  and I read that as "the platform has never sent an email". That was the wrong
  table. Admissions email does not go through the platform Communications
  module at all — it has its own tables and its own real sender:

      src/lib/admissions/communications/engine.ts
        -> sendTransactionalEmail()  ->  Resend

  So `platform_communications` = 0 means the SEPARATE platform Communications
  module has never been used. It says nothing about admissions email, which is
  what a stage change actually fires. These tables are the real record.

  WHAT EMPTY MEANS, decided before running it:

  1. jayden's mail  — zero rows means no admissions email was ever created for
                      this lead, by any trigger, ever. The send never got as far
                      as being attempted.
  2. his queue      — zero rows means nothing is waiting to go out for him
                      either. Rows with a pending status mean it is queued but
                      the queue has not been processed.
  3. tour_completed — zero rows ACROSS ALL LEADS means no tour_completed mail
                      has ever been sent to anybody, which would point at
                      configuration rather than at Jayden.
  4. delivery       — this is the one that matters. 'sent' means Resend accepted
                      it. 'failed' means it was attempted and rejected, and
                      deliveryError will say why. 'pending' means it was written
                      but the send never ran.
  5. workflows      — zero rows for trigger tour_completed means no workflow is
                      configured for that stage, so runWorkflowEngine returns
                      false. LEGACY_EVENT_MAP in automation/dispatch.ts has no
                      tour_completed entry either, so the fallback sends nothing.
                      That combination is silence by configuration, not a fault.
*/

-- 1. Every admissions email ever created for Jayden's lead.
select
  '1. jaydens mail' as check,
  coalesce(c.trigger_event, 'no trigger')
    || ' | ' || coalesce(c.delivery_status, 'no status') as detail,
  to_jsonb(c)::text as extra
from public.admissions_communications c
where c.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

-- 2. Anything queued for him and not yet sent.
select
  '2. his queue',
  'queued row',
  to_jsonb(q)::text
from public.admissions_communication_queue q
where q.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

-- 3. Has tour_completed mail ever gone to anybody.
select
  '3. tour_completed',
  'rows in admissions_communications with trigger_event = tour_completed',
  count(*)::text
from public.admissions_communications
where trigger_event = 'tour_completed'

union all

-- 4. Delivery outcomes across every admissions email ever sent.
select
  '4. delivery',
  coalesce(delivery_status, 'NULL'),
  count(*)::text
from public.admissions_communications
group by delivery_status

union all

-- 5. Is any workflow configured for the tour_completed trigger.
select
  '5. workflows',
  'workflows on tour_completed',
  count(*)::text
from public.admissions_workflows
where to_jsonb(admissions_workflows)::text like '%tour_completed%'

order by 1, 2;
