/*
  WHICH TRIGGERS CAN ACTUALLY REACH A FAMILY — read-only. Nothing here writes.

  WHY. tour_completed sends nothing: no workflow is configured for it, and
  dispatch.ts's LEGACY_EVENT_MAP has no entry for it either. That combination
  is silence with no error anywhere. This asks which OTHER triggers are in the
  same state before another family finds out for us.

  HOW A TRIGGER REACHES A PARENT. Two routes, and it only needs one:
    1. a row in admissions_workflows for that trigger, OR
    2. an entry in LEGACY_EVENT_MAP (code) plus a matching template.
  Route 2 is code, so it is listed below rather than queried.

  THE EIGHT TRIGGERS WITH NO CODE FALLBACK (LEGACY_EVENT_MAP, dispatch.ts):
    tour_completed, interview_completed, inquiry_updated, application_saved,
    state_funding_selected, award_letter_uploaded, financial_aid_requested,
    enrollment_packet_sent
  For these eight, a workflow row is the ONLY route. No workflow = silence.

  WHAT EMPTY MEANS, decided before running it:

  1. templates    — a trigger absent here has no message to send even if it
                    fires. Present with is_active false is the same as absent.
  2. workflows    — a trigger absent here falls back to code. For the eight
                    above there is no code to fall back to, so absent = dead.
  3. what fires   — triggers that have actually produced mail. A trigger with
                    a template AND a workflow but zero rows here has never
                    once fired in production, which is worth knowing before
                    trusting it.
*/

-- 1. Templates that exist, by trigger.
select
  '1. templates' as check,
  coalesce(trigger_event, 'NO TRIGGER') as detail,
  count(*)::text || ' template(s)' as extra
from public.admissions_communication_templates
group by trigger_event

union all

-- 2. Workflows that exist, by the trigger they listen for.
--    Rendered from the row so this cannot fail on a guessed column name.
select
  '2. workflows',
  coalesce(
    (to_jsonb(w) ->> 'trigger_event'),
    (to_jsonb(w) ->> 'trigger'),
    'trigger column not named trigger_event or trigger'
  ),
  count(*)::text || ' workflow(s)'
from public.admissions_workflows w
group by 2

union all

-- 3. Which triggers have ever actually produced an email.
select
  '3. what fires',
  coalesce(trigger_event, 'NO TRIGGER'),
  count(*)::text || ' sent, '
    || count(*) filter (where delivery_status = 'failed')::text || ' failed'
from public.admissions_communications
group by trigger_event

order by 1, 2;
