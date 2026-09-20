-- 300_user_google_connections_2026_09_07.sql
--
-- Per-user Google connections. The foundation for JAG as a staff workspace.
--
-- THE MODEL, decided 7 September. Each staff member connects their own Google
-- account once. Their tokens, their data: JAG shows YOU your inbox because YOU
-- authorised it.
--
-- REJECTED: domain-wide delegation. A service account impersonating any user
-- would mean JAG permanently holds the ability to read every staff member's
-- mail, calendar and Drive without their individual consent. Same result for
-- the person using it, vastly more concentrated risk -- and no way for one
-- person to revoke their own access. Per-user degrades gracefully: someone
-- disconnecting breaks only their own view.
--
-- WHAT STAYS ORG-LEVEL. `integration_connections` keeps the single
-- organisation-wide grant, and should: the directory and the Classroom course
-- list are legitimately organisational reads. This table is for the personal
-- surfaces -- mail, calendar, personal Drive -- where "whose data is this"
-- has exactly one right answer.
--
-- MODELLED ON fi_quickbooks_connections (298/299), with one deliberate
-- difference in the RLS. See part 3.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

create table if not exists public.user_google_connections (
  id                uuid primary key default gen_random_uuid(),

  -- One Google account per JAG user. The consent screen is INTERNAL, so only
  -- @theacademyway.org accounts can authorise at all -- there is no personal
  -- vs work ambiguity to model.
  user_id           uuid not null unique
                      references auth.users(id) on delete cascade,
  organization_id   uuid not null,

  -- Which Google account this actually is, as Google reports it. Stored so a
  -- person can see what they connected, and so a mismatch between the JAG
  -- login and the Google account is visible rather than silent.
  google_email      text,
  google_sub        text,

  status            text not null default 'pending',

  -- WHAT GOOGLE ACTUALLY GRANTED, not what we asked for.
  --
  -- Google may grant a subset of the requested scopes. A feature that needs
  -- gmail.readonly and finds only gmail.metadata should be able to say
  -- "reconnect to enable this" instead of returning empty results that look
  -- like an empty inbox. This column is what makes that answerable.
  granted_scopes    text[] not null default '{}',

  -- CIPHERTEXT. Written only via encryptCredentialSecret(). Nothing should ever
  -- put a raw Google token in these columns.
  access_token      text,
  refresh_token     text,
  expires_at        timestamptz,

  connected_at      timestamptz,
  last_refreshed_at timestamptz,
  last_used_at      timestamptz,
  last_error        text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint user_google_status_valid
    check (status in ('pending', 'connected', 'disconnected', 'error')),
  -- "Connected" without tokens is the lie this table exists to prevent. Same
  -- constraint as the QuickBooks one, for the same reason.
  constraint user_google_connected_has_tokens
    check (status <> 'connected'
           or (access_token is not null and refresh_token is not null)),
  -- An error that does not say what went wrong sends you to the logs.
  constraint user_google_error_has_reason
    check (status <> 'error' or last_error is not null)
);

comment on table public.user_google_connections is
  'One row per staff member who has connected their own Google account. '
  'Personal surfaces only -- mail, calendar, personal Drive. Org-wide reads '
  '(directory, Classroom catalogue) stay on integration_connections.';
comment on column public.user_google_connections.granted_scopes is
  'What Google actually granted, which may be a subset of what was requested. '
  'A feature short of a scope should say so rather than return empty results.';

-- Refresh sweeps read this. Partial: expired-and-disconnected is not interesting.
create index if not exists user_google_expiry_idx
  on public.user_google_connections (expires_at)
  where status = 'connected';

create index if not exists user_google_org_status_idx
  on public.user_google_connections (organization_id, status);

-- ---------------------------------------------------------------------------
-- 3. RLS -- AND THIS IS WHERE IT DIFFERS FROM THE QUICKBOOKS TABLE.
--
-- fi_quickbooks_connections is readable by any authenticated user: a company
-- book is organisational, and everyone who can see finance can see that it is
-- connected.
--
-- This table is NOT that. These are individual people's mail and calendar
-- credentials. A teacher has no business reading another teacher's connection
-- row, even though the tokens in it are encrypted -- google_email, scopes and
-- last_used_at are still personal facts about a colleague.
--
-- So: you can read YOUR OWN row and no one else's. Writes are service-role
-- only, as with every other credential table here.
-- ---------------------------------------------------------------------------

alter table public.user_google_connections enable row level security;

drop policy if exists user_google_connections_read_own
  on public.user_google_connections;
create policy user_google_connections_read_own
  on public.user_google_connections
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Report
-- ---------------------------------------------------------------------------

drop table if exists _ugc_report;
create temp table _ugc_report (seq integer, item text, value text);

do $$
declare
  v_members integer;
  v_rows    integer;
  v_orgconn integer;
begin
  select count(*) into v_members
    from public.user_organization_memberships
   where status = 'active';

  select count(*) into v_rows from public.user_google_connections;

  select count(*) into v_orgconn
    from public.integration_connections
   where provider like 'google%';

  insert into _ugc_report values
    (1, 'Table created', 'user_google_connections'),
    (2, 'Active org memberships (the denominator)', v_members::text),
    (3, 'Per-user connections now', v_rows::text || ' - the connect flow creates these'),
    (4, 'Org-level Google connections (unchanged)', v_orgconn::text),
    (5, 'RLS', 'read YOUR OWN row only. Writes service-role only.'),
    (6, 'Tokens', 'ENCRYPTED. Nothing writes plaintext.'),
    (9, 'Next', 'The connect flow: one button, one consent, one row.');
end $$;

commit;

select item, value from _ugc_report order by seq;

-- ---------------------------------------------------------------------------
-- WHAT THIS DOES NOT DO
--
-- No connection is created. This is where the per-user OAuth callback will
-- write. Still to build:
--
--   1. A staff connect flow -- one button, one consent, one row. Service role,
--      returned error checked. Store granted_scopes from Google's response,
--      not the requested list.
--   2. Refresh-on-expiry, modelled on
--      google-workspace/sync/token-bridge.ts: decrypt, refresh, re-encrypt,
--      status to 'error' WITH a reason on failure.
--   3. A per-user client factory, so a feature asks for "this user's Google
--      client" and gets either a working one or a clear reason why not.
--
-- THE CHECK THAT MATTERS, once people start connecting:
--
--   select google_email, status, granted_scopes, expires_at, last_error
--     from public.user_google_connections
--    where user_id = auth.uid();
--
-- Not a badge. A row that says which account, which scopes, and when it dies.
-- ---------------------------------------------------------------------------
