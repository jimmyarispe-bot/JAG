-- 301_quickbooks_financials_2026_09_07.sql
--
-- Where QuickBooks figures land. One row per company file per period.
--
-- WHY A TABLE AND NOT A LIVE CALL PER PAGE VIEW.
--
-- The Founder Morning Brief renders on request. Calling Intuit five times
-- during a page render makes the dashboard as slow and as available as Intuit
-- is, and Intuit rate-limits per realm. Worse, it makes the figure unreproducible:
-- two people opening the page an hour apart see different numbers with no record
-- of why. A stored row has a fetched_at, so a number can always be traced to the
-- moment it was true.
--
-- WHAT REPLACES WHAT. school-financials.ts still carries these:
--     payroll  = revenue * 0.45
--     expenses = payroll + revenue * 0.28
-- Those are not estimates, they are decoration -- they move only when revenue
-- moves, so operatingMargin is 27.0 every day of the year regardless of what
-- the schools actually spend. This table is what retires them.
--
-- RAW PAYLOAD KEPT. Intuit's report shape varies with account configuration,
-- and a parser that guessed wrong should be arguable after the fact rather than
-- re-fetched. raw_profit_and_loss is the evidence behind every parsed column.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

create table if not exists public.fi_quickbooks_financials (
  id                uuid primary key default gen_random_uuid(),
  connection_id     uuid not null
                      references public.fi_quickbooks_connections(id) on delete cascade,
  organization_id   uuid not null,

  -- Denormalised from the connection at write time so a query for "GA's
  -- numbers" does not have to join, and so a later re-mapping of the book
  -- cannot silently rewrite history that was reported under the old mapping.
  school_id         uuid references public.schools(id) on delete set null,
  scope             text not null,

  period_start      date not null,
  period_end        date not null,

  -- P&L. Nullable on purpose: a missing figure and a zero figure are different
  -- claims, and this table must never assert the second when it means the first.
  total_income      numeric(14,2),
  total_cogs        numeric(14,2),
  total_expenses    numeric(14,2),
  net_income        numeric(14,2),

  -- Add-backs for EBITDA. Absent from most small-business charts of accounts,
  -- which is why they are nullable rather than defaulted to 0 -- "we found no
  -- depreciation line" and "depreciation was zero" are not the same finding.
  payroll_expense   numeric(14,2),
  depreciation      numeric(14,2),
  amortization      numeric(14,2),
  interest_expense  numeric(14,2),

  -- Balance sheet. Cash is a point-in-time figure, not a period one; it is the
  -- balance AS OF period_end, which is why it carries its own timestamp.
  cash_balance      numeric(14,2),
  cash_as_of        date,

  raw_profit_and_loss jsonb,
  raw_balance_sheet   jsonb,

  fetched_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint fi_qbo_fin_period_sane check (period_end >= period_start),
  constraint fi_qbo_fin_scope_valid check (scope in ('school','network','unassigned')),
  constraint fi_qbo_fin_unique unique (connection_id, period_start, period_end)
);

comment on table public.fi_quickbooks_financials is
  'Parsed QuickBooks P&L and cash per company file per period. Replaces the '
  'revenue*0.45 payroll and revenue*0.28 expense constants in school-financials.ts.';
comment on column public.fi_quickbooks_financials.cash_balance is
  'Bank + cash accounts as of period_end. Only as current as the last '
  'reconciliation in QuickBooks -- display it with cash_as_of, never as "now".';
comment on column public.fi_quickbooks_financials.payroll_expense is
  'NULL means no payroll line was found, which is a finding, not a zero. '
  'Payroll runs through ADP as of Sept 2026; if it does not post to QBO this '
  'stays NULL and EBITDA must refuse to compute rather than overstate.';

create index if not exists fi_qbo_fin_org_period_idx
  on public.fi_quickbooks_financials (organization_id, period_end desc);

create index if not exists fi_qbo_fin_school_period_idx
  on public.fi_quickbooks_financials (school_id, period_end desc)
  where school_id is not null;

-- ---------------------------------------------------------------------------
-- RLS. Read for authenticated; writes are service-role only, same as 298.
-- ---------------------------------------------------------------------------

alter table public.fi_quickbooks_financials enable row level security;

drop policy if exists fi_quickbooks_financials_read
  on public.fi_quickbooks_financials;
create policy fi_quickbooks_financials_read
  on public.fi_quickbooks_financials
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------

drop table if exists _qbo301;
create temp table _qbo301 (seq integer, item text, value text);

do $$
declare
  v_conns integer;
  v_mapped integer;
  v_fin integer;
begin
  select count(*), count(*) filter (where scope in ('school','network'))
    into v_conns, v_mapped
    from public.fi_quickbooks_connections;
  select count(*) into v_fin from public.fi_quickbooks_financials;

  insert into _qbo301 values
    (1, 'Table created', 'fi_quickbooks_financials'),
    (2, 'QuickBooks connections', v_conns::text),
    (3, 'Of those, mapped to an entity', v_mapped::text || ' (expect 5)'),
    (4, 'Financial periods stored', v_fin::text || ' - the sync writes these, not this migration'),
    (5, 'Nullable figures', 'NULL means not found. Never defaulted to 0.'),
    (6, 'Writes', 'Service role only. No insert/update policy exists.'),
    (9, 'Next', 'POST the sync route, then EBITDA and the two Founder Brief tiles');
end $$;

commit;

select item, value from _qbo301 order by seq;

select realm_id, company_name, scope, status
  from public.fi_quickbooks_connections
 order by scope, company_name;
