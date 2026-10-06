-- ============================================================================
-- IS THE BACKGROUND CHECK DATA LOCKED DOWN?
-- 6 October 2026 — read-only. ONE statement, ONE grid.
--
-- Migrations 510 and 511 both put their security checks in plain SELECTs, and
-- the Supabase editor shows only the last result - so twice the checks that
-- matter most were the ones that never displayed. These are all of them, in
-- one statement.
--
-- WHAT GOOD LOOKS LIKE: five rows, every verdict reading 'ok'.
--
--   1 no full ssn column     the table holds ssn_last4 and nothing wider
--   2 table rls enabled      row level security is on
--   3 table zero policies    no authenticated session can read it
--   4 bucket is private      no URL reaches a staff signature
--   5 bucket zero policies   only the service role reads the documents
-- ============================================================================

select  1                                                   as ord,
        'no full ssn column'                                 as check_name,
        coalesce(string_agg(column_name, ', '), '(none)')    as detail,
        case when count(*) = 0 then 'ok'
             else '*** A FULL SSN COLUMN EXISTS - READ MIGRATION 510 ***'
        end                                                  as verdict
   from information_schema.columns
  where table_schema = 'public'
    and table_name = 'employee_background_checks'
    and column_name in ('ssn', 'ssn_full', 'social_security_number',
                        'ssn_encrypted', 'ssn_hash')

union all

select  2,
        'table rls enabled',
        case when c.relrowsecurity then 'true' else 'FALSE' end,
        case when c.relrowsecurity then 'ok'
             else '*** RLS IS OFF - THIS TABLE IS READABLE ***'
        end
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'employee_background_checks'

union all

select  3,
        'table zero policies',
        coalesce(string_agg(p.policyname || ' (' || p.cmd || ')', ', '),
                 'none - service role only'),
        case when count(*) = 0 then 'ok'
             else '*** A POLICY EXISTS - SOMEBODY CAN READ STAFF DOBs ***'
        end
   from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'employee_background_checks'

union all

select  4,
        'bucket is private',
        b.id || ' — limit ' || coalesce(b.file_size_limit::text, 'none')
             || ', public=' || b.public::text,
        case when b.public
             then '*** BUCKET IS PUBLIC - ANY URL READS A SIGNATURE ***'
             else 'ok'
        end
   from storage.buckets b
  where b.id = 'employee-documents'

union all

select  5,
        'bucket zero policies',
        coalesce(string_agg(p.policyname, ', '), 'none - service role only'),
        case when count(*) = 0 then 'ok'
             else '*** A STORAGE POLICY NAMES THIS BUCKET - CHECK WHO READS IT ***'
        end
   from pg_policies p
  where p.schemaname = 'storage'
    and p.tablename = 'objects'
    and coalesce(p.qual, '') || coalesce(p.with_check, '') like '%employee-documents%'

order by ord;
