-- 299_qbo_unassigned_scope_2026_09_07.sql
--
-- One constraint. Adds 'unassigned' to fi_quickbooks_connections.scope.
--
-- WHY. 298 allowed only 'school' and 'network', which assumes JAG knows which
-- entity a book belongs to at the moment the OAuth callback fires. It does not.
-- The callback receives a realmId chosen on INTUIT'S screen, from a company
-- picker JAG has no control over. Asserting "this is The Academy GA" because
-- that is the button you clicked in JAG is a guess, and a wrong guess files one
-- entity's financials under another while looking entirely confident.
--
-- So a fresh connection lands as 'unassigned' carrying the realmId and the
-- company name Intuit reports, and a human confirms the mapping against what
-- Intuit actually returned. One extra click, and the mapping becomes something
-- checked rather than something assumed.
--
-- The existing coherence check needs no change:
--     check ((scope = 'school') = (school_id is not null))
-- For an unassigned row that reads (false) = (false), which passes. Only the
-- allowed-values check has to widen.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

alter table public.fi_quickbooks_connections
  drop constraint if exists fi_qbo_scope_valid;

alter table public.fi_quickbooks_connections
  add constraint fi_qbo_scope_valid
  check (scope in ('school', 'network', 'unassigned'));

comment on column public.fi_quickbooks_connections.scope is
  'school = mapped to one school. network = the holding entity. unassigned = '
  'connected but not yet mapped; the OAuth callback writes this, a person '
  'resolves it against the company name Intuit returned.';

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

drop table if exists _qbo299;
create temp table _qbo299 (seq integer, item text, value text);

do $$
declare
  v_rows       integer;
  v_unassigned integer;
  v_ok         boolean;
begin
  select count(*), count(*) filter (where scope = 'unassigned')
    into v_rows, v_unassigned
    from public.fi_quickbooks_connections;

  -- Prove the constraint actually accepts the new value rather than trusting
  -- that the ALTER did what it said. Insert, check, roll back to a savepoint.
  begin
    insert into public.fi_quickbooks_connections
      (organization_id, realm_id, scope, status)
    values (gen_random_uuid(), '__constraint_probe__', 'unassigned', 'pending');
    v_ok := true;
    delete from public.fi_quickbooks_connections
     where realm_id = '__constraint_probe__';
  exception when check_violation then
    v_ok := false;
  end;

  insert into _qbo299 values
    (1, 'scope now allows', 'school, network, unassigned'),
    (2, 'Probe: an unassigned row is accepted',
        case when v_ok then 'YES' else 'NO - THE ALTER DID NOT TAKE' end),
    (3, 'Connections in table', v_rows::text),
    (4, 'Of those, unassigned', v_unassigned::text),
    (9, 'Next', 'Intuit app + QUICKBOOKS_CLIENT_ID / _CLIENT_SECRET / _ENVIRONMENT=production in Vercel');
end $$;

commit;

select item, value from _qbo299 order by seq;

-- ---------------------------------------------------------------------------
-- THE MAPPING STEP, once books are connected. Run this to see what Intuit
-- returned and which entity each book still needs pointing at:
--
--   select realm_id, company_name, scope, school_id, status, connected_at
--     from public.fi_quickbooks_connections
--    order by scope, company_name;
--
-- Then, per book, one of:
--
--   update public.fi_quickbooks_connections
--      set scope = 'school', school_id = '<school uuid>'
--    where realm_id = '<realm>';
--
--   update public.fi_quickbooks_connections
--      set scope = 'network', school_id = null
--    where realm_id = '<realm>';
--
-- School ids, confirmed 7 Sept:
--   a1000000-0000-4000-8000-000000000001  The Academy FL
--   a1000000-0000-4000-8000-000000000002  The Academy GA
--   a1000000-0000-4000-8000-000000000003  The Academy HS
--   a1000000-0000-4000-8000-000000000004  The Academy Virtual
--
-- A screen will do this properly later; the SQL is here so the first five
-- connections are not blocked on UI work.
-- ---------------------------------------------------------------------------
