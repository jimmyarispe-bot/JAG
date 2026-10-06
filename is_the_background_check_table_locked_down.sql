-- ============================================================================
-- IS THE BACKGROUND CHECK TABLE LOCKED DOWN?
-- 6 October 2026 — read-only. ONE statement, ONE grid.
--
-- Migration 510's sections 1 and 2 are plain SELECTs, and the Supabase editor
-- shows only the last result - so the two checks that matter most were the two
-- that never displayed. These are them, in one statement.
--
-- WHAT GOOD LOOKS LIKE: three rows, every verdict reading 'ok'.
--
--   no full ssn column   the table holds ssn_last4 and nothing wider
--   rls enabled          row level security is on
--   zero policies        no authenticated session can read, insert or update;
--                        only the service role that writes the submission
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
        'rls enabled',
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
        'zero policies',
        coalesce(string_agg(p.policyname || ' (' || p.cmd || ')', ', '),
                 'none - service role only'),
        case when count(*) = 0 then 'ok'
             else '*** A POLICY EXISTS - SOMEBODY CAN READ STAFF DOBs ***'
        end
   from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'employee_background_checks'

order by ord;
