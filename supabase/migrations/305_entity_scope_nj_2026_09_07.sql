-- 305_entity_scope_nj_2026_09_07.sql
--
-- Adds scope 'entity' and maps The Academy NJ LLC to it.
--
-- WHY THIS EXISTS. Reconciling 2025 against the filed 1120-S:
--
--     five mapped books        812,554.56
--     The Academy NJ LLC       805,410.34
--     -------------------------------------
--     all six books          1,617,964.90
--     1120-S gross receipts  1,618,415.00
--     difference                  -450.10   (0.028%)
--
-- NJ was not a rounding error. At $805,410 of income and $458,585 of net income
-- it was the largest and most profitable entity in the group -- larger than the
-- four schools combined on the bottom line -- and every consolidated figure
-- produced before this migration excluded it. The "network running at a
-- $43,000 loss" was missing it entirely.
--
-- WHY NOT A SCHOOL ROW. public.schools has no status or closed_at column. NJ
-- ceased operations 31 August 2026, so inserting it would put a closed campus
-- into every roster, enrolment count and dashboard that reads that table, and
-- every one of them would need a filter that does not exist. It is also simply
-- not true: NJ has no students in JAG.
--
-- WHY NOT 'network'. A partial unique index allows exactly one network book per
-- organisation, correctly -- there is one holding company.
--
-- So: 'entity' means a real legal entity whose financials count toward the
-- network total but which is not a JAG school. The existing coherence check
--     check ((scope = 'school') = (school_id is not null))
-- reads (false) = (false) for such a row and passes unchanged. Only the
-- allowed-values check widens, exactly as migration 299 did for 'unassigned'.
--
-- NJ's closure needs no special handling: QuickBooks has no transactions after
-- 31 August 2026, so any period that spans the closure simply returns what
-- happened.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

alter table public.fi_quickbooks_connections
  drop constraint if exists fi_qbo_scope_valid;

alter table public.fi_quickbooks_connections
  add constraint fi_qbo_scope_valid
  check (scope in ('school', 'network', 'unassigned', 'entity'));

comment on column public.fi_quickbooks_connections.scope is
  'school = one JAG school. network = the holding company. entity = a real '
  'legal entity that counts toward network financials but is not a JAG school '
  '(The Academy NJ LLC, closed 31 Aug 2026). unassigned = connected but not yet '
  'mapped; the OAuth callback writes this and a person resolves it.';

update public.fi_quickbooks_connections
   set scope = 'entity', school_id = null, updated_at = now()
 where realm_id = '9341454758422862';

commit;

-- ---------------------------------------------------------------------------
-- Report. Expect 7 rows: 4 school, 1 network, 1 entity (NJ), 1 unassigned
-- (the empty duplicate holding-company file, $1,500 of 2025 income).
-- ---------------------------------------------------------------------------

select
  c.realm_id,
  c.company_name,
  c.scope,
  s.name as mapped_to,
  c.status
from public.fi_quickbooks_connections c
left join public.schools s on s.id = c.school_id
order by
  case c.scope when 'network' then 1 when 'school' then 2
               when 'entity' then 3 else 4 end,
  c.company_name;
