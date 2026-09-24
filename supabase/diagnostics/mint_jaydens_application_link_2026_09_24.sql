/*
  MINT JAYDEN ROY'S APPLICATION LINK — 2026-09-24

  THIS ONE WRITES. Every other file in this folder is read-only; this is not.
  It calls mint_application_access_token for exactly one lead,
  66f94d1c-37d9-4ae3-88a4-b1168636e8a2 (Jayden Roy / Lisa Roy), and nothing
  else. The function is idempotent: if a token already exists it is returned
  unchanged, so running this twice cannot break a link already in her inbox.

  WHY BY HAND. The gate mints the token when a school leader answers
  "invite to apply". Lisa was invited on 22 September, before the token column
  existed, so her lead has none. This gives her one without re-sending mail.

  WHAT EMPTY MEANS, decided before running it:

  1. the lead      — zero rows means that id is not in admissions_leads, which
                     would mean the lead was deleted. It does NOT mean the
                     family is gone; look for another Roy row before concluding
                     anything.
  2. the token     — this cannot come back empty. The function always returns
                     64 hex characters. A null here means the function did not
                     run, which is an error, not a finding.
  3. the last link — zero rows means no admissions email has ever carried an
                     apply URL to this family. Rows here show the exact origin
                     production is using, which is the thing being read.
*/

-- 1. The lead, and the token. Minting happens here.
select
  '1. the lead and her token' as check,
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as detail,
  'lead_stage=' || coalesce(l.lead_stage, 'NULL')
    || ' | school_id=' || coalesce(l.school_id::text, 'NULL')
    || ' | token=' || coalesce(
         public.mint_application_access_token(l.id), 'MINT RETURNED NULL')
    as extra
from public.admissions_leads l
where l.id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

union all

/*
  2. The apply URL that production has actually put in her mail. The whole
     communication row is cast to text and the first apply link pulled out of
     it by pattern, so this cannot fail on a column name I guessed wrong.
*/
select
  '2. the last link she was sent',
  to_char(c.created_at, 'YYYY-MM-DD HH24:MI'),
  coalesce(
    substring(to_jsonb(c)::text from 'https?://[^"\\ <>]*/apply[^"\\ <>]*'),
    'no apply url in this message')
from public.admissions_communications c
where c.lead_id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

order by 1, 2;
