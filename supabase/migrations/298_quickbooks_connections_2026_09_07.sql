-- 298_quickbooks_connections_2026_09_07.sql
--
-- Persisted QuickBooks connections. Five company files: four schools plus the
-- network entity.
--
-- WHY A NEW TABLE AND NOT integration_connections.
--
-- integration_connections is upserted with onConflict "organization_id,provider"
-- -- a unique index on exactly those two columns. Google Workspace is ONE
-- connection for the whole organisation and that shape fits it. QuickBooks is
-- FIVE company files, each with its own Intuit realmId, each needing its own
-- tokens and its own refresh cycle. One row per provider cannot hold that.
--
-- Widening that constraint to three columns would break Google's and
-- Microsoft's upserts the moment the index changed -- both name the two-column
-- conflict target explicitly -- and Google Classroom is live and working. Not
-- worth risking a working integration to save a table.
--
-- So: same proven mechanics (encryptCredentialSecret / decryptCredentialSecret
-- from lib/connectors/credentials, refresh-on-expiry, status goes to 'error'
-- WITH a reason), different cardinality.
--
-- WHAT REPLACES WHAT. lib/connectors/store.ts keeps installations, credentials
-- and sync jobs in `globalThis.__jagConnectorStore` -- in memory, wiped on every
-- Vercel cold start, and not shared between lambda instances. That is why a
-- QuickBooks connection appears to succeed and is silently gone later. This
-- table is where that state belongs.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

create table if not exists public.fi_quickbooks_connections (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null,

  -- Intuit's company identifier, returned on the OAuth callback as `realmId`.
  -- THIS is the identity of a connection, not the school -- a company file can
  -- be re-pointed at a different school, but it is always the same book.
  realm_id          text not null,
  company_name      text,

  -- Four schools plus one network/holding entity, which has no row in `schools`
  -- and must not be forced to invent one. The CHECK below makes the pairing
  -- unambiguous rather than leaving "school_id is null" to mean either
  -- "network" or "nobody filled this in".
  scope             text not null,
  school_id         uuid references public.schools(id) on delete restrict,

  status            text not null default 'pending',

  -- CIPHERTEXT. Written only via encryptCredentialSecret(). Nothing should ever
  -- put a raw Intuit token in these columns.
  access_token      text,
  refresh_token     text,
  expires_at        timestamptz,

  -- Intuit's refresh token has its own expiry (x_refresh_token_expires_in,
  -- which the token exchange already parses). A connection nobody syncs can
  -- therefore die on its own with no error and no warning -- storing the date
  -- is what makes "this will stop working on the 14th" answerable in advance.
  refresh_token_expires_at timestamptz,

  connected_by_user_id uuid references auth.users(id) on delete set null,
  connected_at      timestamptz,
  last_sync_at      timestamptz,
  last_sync_error   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint fi_qbo_realm_unique
    unique (organization_id, realm_id),
  constraint fi_qbo_scope_valid
    check (scope in ('school', 'network')),
  -- A school connection names a school; a network connection does not. Both
  -- directions, so neither state can drift into the other.
  constraint fi_qbo_scope_coherent
    check ((scope = 'school') = (school_id is not null)),
  constraint fi_qbo_status_valid
    check (status in ('pending', 'connected', 'disconnected', 'error')),
  -- "Connected" without tokens is the lie this whole table exists to prevent.
  constraint fi_qbo_connected_has_tokens
    check (status <> 'connected'
           or (access_token is not null and refresh_token is not null)),
  -- An error that does not say what went wrong sends you to the logs, and the
  -- logs are where the last three of these hid.
  constraint fi_qbo_error_has_reason
    check (status <> 'error' or last_sync_error is not null)
);

comment on table public.fi_quickbooks_connections is
  'One row per QuickBooks company file. Five expected: four schools plus the '
  'network entity. Tokens are stored encrypted; realm_id is the identity.';
comment on column public.fi_quickbooks_connections.realm_id is
  'Intuit company id from the OAuth callback. Stable across re-authorisation.';
comment on column public.fi_quickbooks_connections.refresh_token_expires_at is
  'Intuit refresh tokens expire. A book nobody syncs goes dead quietly; this '
  'column is what lets a check say so before it happens.';

-- Two books must not claim the same school, and there is only one network.
-- Partial indexes so disconnected rows do not block a fresh connection.
create unique index if not exists fi_qbo_one_book_per_school
  on public.fi_quickbooks_connections (school_id)
  where school_id is not null and status <> 'disconnected';

create unique index if not exists fi_qbo_one_network_book
  on public.fi_quickbooks_connections (organization_id)
  where scope = 'network' and status <> 'disconnected';

create index if not exists fi_qbo_org_status_idx
  on public.fi_quickbooks_connections (organization_id, status);

-- Refresh sweeps read this. Partial, because expired-and-disconnected is not
-- interesting.
create index if not exists fi_qbo_expiry_idx
  on public.fi_quickbooks_connections (expires_at)
  where status = 'connected';

-- ---------------------------------------------------------------------------
-- RLS.
--
-- READ for authenticated. NO write policies: connect, refresh and disconnect
-- all run server-side under the service role.
--
-- THIS IS DELIBERATE AND IT MATTERS. On 6 September the same table shape was
-- given a read policy and no insert policy, and then written with a COOKIE
-- client from a dashboard page. supabase-js does not throw on an RLS refusal --
-- it resolves with { error } -- so every insert was silently dropped and the
-- table looked like the job had never run. The OAuth callback route MUST use
-- createServiceRoleClient(), and MUST check the returned error.
-- ---------------------------------------------------------------------------

alter table public.fi_quickbooks_connections enable row level security;

drop policy if exists fi_quickbooks_connections_read
  on public.fi_quickbooks_connections;
create policy fi_quickbooks_connections_read
  on public.fi_quickbooks_connections
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

drop table if exists _qbo_report;
create temp table _qbo_report (seq integer, item text, value text);

do $$
declare
  v_schools integer;
  v_rows    integer;
begin
  select count(*) into v_schools from public.schools;
  select count(*) into v_rows from public.fi_quickbooks_connections;

  insert into _qbo_report values
    (1, 'Table created',  'fi_quickbooks_connections'),
    (2, 'Schools in JAG', v_schools::text),
    (3, 'Connections expected', (v_schools + 1)::text || ' (' || v_schools::text || ' schools + 1 network)'),
    (4, 'Connections now',  v_rows::text || ' - the OAuth flow creates these, not this migration'),
    (5, 'Tokens',           'Stored ENCRYPTED. Nothing writes plaintext.'),
    (6, 'Writes',           'Service role only. No insert/update policy exists.'),
    (9, 'Blocked on',       'QUICKBOOKS_CLIENT_ID / _CLIENT_SECRET / _ENVIRONMENT in Vercel');
end $$;

commit;

select item, value from _qbo_report order by seq;

select id, name from public.schools order by name;

-- ---------------------------------------------------------------------------
-- WHAT THIS DOES NOT DO
--
-- No connection is created. This is the place the OAuth callback will write to.
-- Still to build, in order:
--
--   1. Intuit app + three env vars in Vercel.        <- Jimmy, and it blocks all of it
--   2. Connect/callback writing HERE instead of globalThis, service role,
--      error checked. Kill the createDemoQuickBooksTokens fallback -- it is the
--      same "connected in demo mode" fault Google had until 2 September, and it
--      was never fixed for QuickBooks.
--   3. Refresh-on-expiry, modelled on the Google token bridge.
--   4. A screen showing all five books, their status and last sync.
--   5. The sync itself: parse the P&L into rows in a real table, instead of
--      dumping report text into an in-memory evidence store.
--   6. A schedule of its own. NOT the nightly runner -- that is at 55s of a
--      60s ceiling already.
--
-- NOTE ON ENVIRONMENT: quickbooksClientConfig() reads QUICKBOOKS_ENVIRONMENT
-- and falls back to "sandbox" for any value other than the literal
-- "production". Miss that variable and everything connects, works, and reports
-- figures from Intuit's test companies.
-- ---------------------------------------------------------------------------
