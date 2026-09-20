-- 306_financials_entity_scope_2026_09_07.sql
--
-- One statement. Adds 'entity' to fi_quickbooks_FINANCIALS.scope.
--
-- Migration 305 widened fi_qbo_scope_valid on fi_quickbooks_CONNECTIONS and
-- stopped there. fi_quickbooks_financials carries its own scope column with its
-- own check, created by migration 301, and the two constraints have almost the
-- same name -- fi_qbo_scope_valid and fi_qbo_fin_scope_valid.
--
-- The result: The Academy NJ and Enrichmentsdotorg were read from Intuit
-- correctly and rejected at the write. The sync reported "of": 7, "synced": 5
-- and named the constraint in each error, which is the only reason this took
-- one look rather than an evening.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

alter table public.fi_quickbooks_financials
  drop constraint if exists fi_qbo_fin_scope_valid;

alter table public.fi_quickbooks_financials
  add constraint fi_qbo_fin_scope_valid
  check (scope in ('school', 'network', 'unassigned', 'entity'));

commit;

-- ---------------------------------------------------------------------------
-- Report. Both scope checks should now allow the same four values.
-- ---------------------------------------------------------------------------

select
  conrelid::regclass::text as table_name,
  conname                  as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in ('fi_qbo_scope_valid', 'fi_qbo_fin_scope_valid')
order by table_name;
