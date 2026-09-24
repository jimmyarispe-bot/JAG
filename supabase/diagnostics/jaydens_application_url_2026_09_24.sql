/*
  JAYDEN ROY'S APPLICATION URL — 2026-09-24

  One row, one column, nothing truncated. The token was already minted by
  mint_jaydens_application_link_2026_09_24.sql; the function is idempotent, so
  this returns the same token rather than issuing a new one.

  The origin is the one production actually used in the 22 September email to
  Lisa: https://apply.theacademyway.org

  WHAT EMPTY MEANS: zero rows means that lead id is not in admissions_leads.
  A row whose url ends in "/apply/start/" with nothing after it means the token
  column is null, which would mean the mint never ran.
*/

select
  'https://apply.theacademyway.org/apply/start/'
    || coalesce(public.mint_application_access_token(id), '') as jaydens_application_url
from public.admissions_leads
where id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2';
