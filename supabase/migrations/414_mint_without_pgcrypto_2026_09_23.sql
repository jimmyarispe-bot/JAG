/*
  414 — MINT THE TOKEN WITHOUT PGCRYPTO

  WHAT BROKE. 412's function used encode(gen_random_bytes(32), 'hex').
  gen_random_bytes comes from pgcrypto, which is not installed here, so the
  first call failed with 42883 "function gen_random_bytes(integer) does not
  exist". Nothing was written and no token exists yet.

  WHY NOT JUST INSTALL PGCRYPTO. It would work, but the function pins
  `search_path = public` for safety and Supabase puts extensions in their own
  schema, so it would then need a qualified call or a widened search_path -
  a second thing to get right for no gain. gen_random_uuid() is built into
  Postgres 13+ and needs nothing.

  THE SHAPE IS UNCHANGED: still exactly 64 lowercase hex characters, which is
  what token-access.ts checks before it will touch the database. Two v4 UUIDs
  with their dashes removed are 32 hex characters each. That is 244 bits of
  randomness rather than 256 - the difference is not meaningful to anyone
  trying to guess one.

  It still does not LOOK like a uuid, which was the point of not using one
  bare: a value shaped like an id invites being pasted somewhere ids get
  logged, and this one is a secret.

  IDEMPOTENT, as before: an existing token is returned rather than replaced, so
  a link already in a family's inbox keeps working.
*/

create or replace function public.mint_application_access_token(p_lead_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  select application_access_token into v_token
  from public.admissions_leads
  where id = p_lead_id;

  if v_token is not null then
    return v_token;
  end if;

  v_token :=
    replace(gen_random_uuid()::text, '-', '') ||
    replace(gen_random_uuid()::text, '-', '');

  update public.admissions_leads
  set application_access_token = v_token,
      application_access_token_issued_at = now()
  where id = p_lead_id;

  return v_token;
end;
$$;

revoke all on function public.mint_application_access_token(uuid) from public;
grant execute on function public.mint_application_access_token(uuid) to authenticated;

/*
  Now mint Jayden's and print it. Open the URL in a PRIVATE WINDOW - a normal
  window may carry your staff session, and the whole claim being tested is that
  this works with no account at all.

  DO NOT PRESS SUBMIT. That marks his application received, moves his stage and
  emails Lisa the shadow-days invitation for real. Type into a field, press
  "Save and finish later", reload, and check it is still there.

  The length check below should read 64. If it does not, stop - token-access.ts
  will reject the token and the page will say the link is no longer active.
*/
select
  'Open in a private window' as instruction,
  'https://apply.theacademyway.org/apply/start/' || t.token as url,
  length(t.token) as token_length_should_be_64
from (
  select public.mint_application_access_token('66f94d1c-37d9-4ae3-88a4-b1168636e8a2') as token
) t;
