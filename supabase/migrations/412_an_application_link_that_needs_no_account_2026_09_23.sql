/*
  412 — AN APPLICATION LINK THAT NEEDS NO ACCOUNT

  WHAT IS WRONG TODAY. The invitation to apply links to /apply/portal, and both
  that page and /apply/portal/[applicationId] begin with:

      const sessionUser = await getSessionUser();
      if (!sessionUser) redirect("/login?next=...");

  So a family cannot open the application without an account. Lisa Roy received
  a correct invitation on 22 Sep and landed on a password box.

  WHY AN ACCOUNT IS THE WRONG ANSWER, in Jimmy's words, 23 Sep:
  "we can't/shouldn't ask a parent to create an account without being an
  accepted student to our school." An account belongs to a family OF the
  school. A family invited to apply is not that yet and may never be.

  SO THE LINK CARRIES ITS OWN AUTHORITY. A token unique to the lead, minted
  when the family is invited, embedded in the URL. It proves the holder was
  sent the invitation, which is exactly the claim the page needs, and nothing
  more.

  WHAT A TOKEN LETS SOMEBODY DO, stated plainly because this is an
  unauthenticated door onto a child's record: open that one lead's application,
  see what the family themselves told us on the inquiry, and complete it. It
  reaches one household. It cannot list leads, cannot reach another family, and
  carries no role.

  WHY IT IS NOT A UUID. gen_random_uuid() is 122 bits of randomness and would
  do, but it is also the shape of every id in this database, and a value that
  looks like an id invites being pasted somewhere ids are logged. 32 random
  bytes, hex encoded, looks like a secret and is one.

  EXPIRY. issued_at is recorded but nothing expires on it yet. A token that
  stops working silently is the failure this whole week has been about, so the
  rule belongs in code where it can say so, not in a nightly job that empties
  a column. Recorded now so the decision has a date to reason from later.

  REVOCABLE. Clearing the column invalidates the link. That is the whole
  mechanism - no session to terminate, nothing cached.
*/

alter table public.admissions_leads
  add column if not exists application_access_token text,
  add column if not exists application_access_token_issued_at timestamptz;

/*
  Unique where present. Two leads must never share a token; many leads have
  none, which a plain unique index would reject on the second null in some
  configurations, so it is partial.
*/
create unique index if not exists admissions_leads_application_access_token_key
  on public.admissions_leads (application_access_token)
  where application_access_token is not null;

/*
  Mint one, idempotently. Called when the family is invited; returns the
  existing token if there is one, so re-sending an invitation does not
  invalidate the link already sitting in the family's inbox.

  SECURITY DEFINER because the caller is a school leader answering a gate, and
  minting a token is not a permission we want to hand out separately. The
  function does one thing to one row.
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

  v_token := encode(gen_random_bytes(32), 'hex');

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
  VERIFY. Expect the two columns, the unique index and the function.
*/
select
  'columns' as check,
  string_agg(column_name, ', ' order by column_name) as detail
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admissions_leads'
  and column_name like 'application_access_token%'

union all

select
  'function',
  coalesce(
    (select 'mint_application_access_token exists'
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'mint_application_access_token'
     limit 1),
    'MISSING'
  );
