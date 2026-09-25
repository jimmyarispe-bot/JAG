/*
  THE TEST FAMILY'S APPLICATION LINK — 2026-09-24

  THIS ONE WRITES, and only this: it calls mint_application_access_token for
  the newest lead at The Academy GA whose guardian email is
  jimmy.arispe@gmail.com - the inquiry submitted from the public form a few
  minutes ago. The function is idempotent, so running it twice returns the
  same token rather than breaking a link.

  WHY. The invited-application route shipped last night and has never once run
  to completion. Lisa Roy is the only family who has tried and both her
  attempts were refused by the validator. This walks the same path on a lead
  that belongs to nobody, so the second half of the chain - submit, stage moves
  to application_submitted, shadow-days invitation sends with the campus's
  Google booking link - is watched rather than assumed.

  WHAT EMPTY MEANS, decided before running it:

  1. zero rows means no GA lead carries that guardian email, so the inquiry
     did not create the lead we think it did. Widen the search before
     concluding anything - do NOT assume the form failed.
  2. a url ending in "/apply/start/" with nothing after it means the mint
     returned null, which is an error and not a finding.
*/

select
  'https://apply.theacademyway.org/apply/start/'
    || coalesce(public.mint_application_access_token(l.id), '') as testy_application_url,
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as who,
  coalesce(l.lead_stage, 'NO STAGE') as stage_now,
  to_char(l.created_at, 'YYYY-MM-DD HH24:MI') as created
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where lower(coalesce(l.guardian_email, '')) = 'jimmy.arispe@gmail.com'
  and s.name ilike '%Academy GA%'
order by l.created_at desc
limit 1;
