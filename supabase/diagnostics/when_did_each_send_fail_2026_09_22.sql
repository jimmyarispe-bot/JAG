/*
  WHEN DID EACH SEND FAIL — read-only. Nothing here writes.

  WHY. theacademyfl.org shows Verified in Resend as of 22 days ago, yet two FL
  sends failed with "domain is not verified". Only the timestamps can say which
  of these is true:

    - the FL failures are OLDER than the verification, in which case FL is
      already healthy and those two families simply need a re-send; or
    - an FL send failed WITHIN the last 22 days, in which case verification is
      not the whole story and FL will fail again tonight.

  Verification times read from Resend on 22 Sep 2026:
      theacademyfl.org    verified 22 days ago  -> about 31 Aug 2026
      theacademyga.org    verified today
      theacademyhs.org    PENDING - not verified
      theacademyvirtual.org PENDING - not verified
      thejag.org          verified about a month ago
      theacademyway.org   verified about two months ago

  WHAT EMPTY MEANS, decided before running it:

  1. failures by day — a row dated ON OR AFTER 2026-08-31 for an FL address is
                       the bad case. Only rows before it mean verification
                       already solved FL.
  2. last success    — the most recent good send per domain. A domain sending
                       fine today is not the one to worry about.
*/

-- 1. Every failure with its date and the domain it was sent FROM.
select
  '1. failures by day' as check,
  to_char(c.created_at, 'YYYY-MM-DD HH24:MI') as detail,
  coalesce(s.name, 'no school')
    || ' | from=' || coalesce(s.admissions_from_email, 'fallback thejag.org')
    || ' | to=' || coalesce(c.sent_to, 'NULL') as extra
from public.admissions_communications c
left join public.admissions_leads l on l.id = c.lead_id
left join public.schools s on s.id = l.school_id
where c.delivery_status = 'failed'

union all

-- 2. The most recent SUCCESSFUL send per campus.
select
  '2. last success',
  coalesce(s.name, 'no school'),
  coalesce(to_char(max(c.created_at), 'YYYY-MM-DD HH24:MI'), 'never')
from public.admissions_communications c
left join public.admissions_leads l on l.id = c.lead_id
left join public.schools s on s.id = l.school_id
where c.delivery_status = 'sent'
group by s.name

order by 1, 2;
