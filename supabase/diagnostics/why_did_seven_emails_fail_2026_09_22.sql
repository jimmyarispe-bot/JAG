/*
  WHY DID SEVEN EMAILS FAIL — read-only. Nothing here writes.

  CONTEXT. admissions_communications says: 55 sent, 7 failed, 1 logged. Two of
  the seven failures are Jayden Roy's, both trigger_event = decision_gate_opened
  and both is_staff_notification.

  WHERE THE REASON LIVES. engine.ts computes `deliveryError` from the Resend
  result but never writes it to admissions_communications - there is no
  delivery_error column in that insert. So the reason is NOT in the mail row.
  On a production failure it goes to Mission Control instead:

      createMissionControlItem(... title 'Admissions email delivery failed',
                                   body: deliveryError ...)

  That item is the only durable record of why a send was rejected.

  WHAT EMPTY MEANS, decided before running it:

  1. failed mail   — these are the seven. sent_to is the address Resend
                     rejected; read it before assuming the provider is at
                     fault. A malformed or missing recipient fails here too.
  2. the reason    — zero rows means the failures happened before the Mission
                     Control branch existed, or outside production (that branch
                     is guarded by NODE_ENV === 'production'). It does NOT mean
                     there was no error.
  3. who it was to — zero rows is impossible if section 1 returned rows; if it
                     is empty, sent_to is null on those rows, which is itself
                     the likely cause of the failure.
*/

-- 1. The seven failures, most recent first.
select
  '1. failed mail' as check,
  coalesce(trigger_event, 'no trigger')
    || ' | staff=' || coalesce(is_staff_notification::text, 'NULL')
    || ' | to=' || coalesce(sent_to, 'NULL') as detail,
  coalesce(subject, 'no subject') as extra
from public.admissions_communications
where delivery_status = 'failed'

union all

-- 2. The recorded reason, from Mission Control.
select
  '2. the reason',
  coalesce(title, 'no title'),
  coalesce(body, 'no body')
from public.platform_mission_control_items
where title ilike '%email delivery failed%'

union all

-- 3. Every distinct recipient address that has ever failed.
select
  '3. who it was to',
  coalesce(sent_to, 'NULL ADDRESS'),
  count(*)::text || ' failure(s)'
from public.admissions_communications
where delivery_status = 'failed'
group by sent_to

order by 1, 2;
