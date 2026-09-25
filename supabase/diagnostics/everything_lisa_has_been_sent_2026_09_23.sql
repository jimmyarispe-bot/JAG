/*
  EVERYTHING LISA ROY HAS BEEN SENT — read-only. Nothing here writes.

  THE QUESTION. Has Lisa received what she needs to act? Three different
  messages are in play and they are easy to conflate:

    1. application_invited   the invitation with the /apply/portal link.
                             Sent 22 Sep 15:11 and confirmed delivered - she
                             forwarded it.
    2. the portal invite     the set-password letter from
                             inviteProspectGuardians(). An account EXISTING and
                             a parent having RECEIVED a working invitation are
                             different claims. This does not write to
                             admissions_communications, so section 3 is how to
                             see it.
    3. shadow_days_invited   cannot have been sent. It requires the lead at
                             application_submitted and a school leader
                             answering invite_to_shadow_days. Jayden's case
                             reads "No applications started".

  WHAT EMPTY MEANS, decided before running it:

  1. her mail     — one application_invited row, status 'sent'. A row for
                    shadow_days_invited would mean I am wrong about the order.
  2. her gates    — invite_to_apply answered; invite_to_shadow_days should NOT
                    exist yet. If it does, an application was submitted.
  3. her account  — a row means the account exists. last_sign_in_at NULL means
                    she has never signed in, so whatever invitation was sent
                    has not yet been acted on. That is the number that says
                    whether she is stuck.
*/

-- 1. Every admissions email ever created for this lead.
select
  '1. her mail' as check,
  to_char(c.created_at, 'YYYY-MM-DD HH24:MI') as detail,
  coalesce(c.trigger_event, 'no trigger')
    || ' | ' || coalesce(c.delivery_status, 'no status')
    || ' | to=' || coalesce(c.sent_to, 'NULL')
    || ' | staff=' || coalesce(c.is_staff_notification::text, 'NULL') as extra
from public.admissions_communications c
where c.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

-- 2. Where her decisions stand.
select
  '2. her gates',
  g.gate_key,
  g.status
    || coalesce(' | answer=' || g.answer, '')
    || ' | opened ' || to_char(g.created_at, 'YYYY-MM-DD HH24:MI')
from public.admissions_decision_gates g
where g.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

-- 3. Does she have an account, and has she ever used it.
select
  '3. her account',
  u.email,
  'created ' || to_char(u.created_at, 'YYYY-MM-DD HH24:MI')
    || ' | last signed in: '
    || coalesce(to_char(u.last_sign_in_at, 'YYYY-MM-DD HH24:MI'), 'NEVER')
from auth.users u
where lower(u.email) = 'lisinda1974@gmail.com'

order by 1, 2;
