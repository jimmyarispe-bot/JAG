-- Did migration 291 actually run, and is the table it changed protected?
--
-- 291 added the application-fee columns on 6 September. 417 was written on the
-- 25th, committed, and never executed - "a file on disk is not a migration
-- that ran" - so the columns are checked here rather than assumed.
--
-- 291 also raised a question it could not answer: whether row-level security is
-- on for admissions_applications. New columns inherit the table's policies, so
-- if the table has none, neither do they - and these hold what a family paid.
--
-- READ ONLY.

-- 1. Are the columns there?
select 'columns' as check_name,
       count(*) filter (where column_name = 'application_fee_cents')          as fee_cents,
       count(*) filter (where column_name = 'application_fee_status')         as status,
       count(*) filter (where column_name = 'application_fee_paid_at')        as paid_at,
       count(*) filter (where column_name = 'application_fee_reference')      as reference,
       count(*) filter (where column_name = 'application_fee_waived_by_user_id') as waived_by,
       count(*) filter (where column_name = 'application_fee_waiver_reason')  as waiver_reason,
       case when count(*) filter (where column_name like 'application_fee%') = 6
              then '291 ran'
            when count(*) filter (where column_name like 'application_fee%') = 0
              then '291 NEVER RAN - the columns do not exist'
            else 'PARTIAL - some columns missing'
       end as verdict
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'admissions_applications';

-- 2. Is the table protected, and what do the fee rows say?
select 'protection and state' as check_name,
       (select c.relrowsecurity
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relname = 'admissions_applications')   as rls_on,
       (select count(*) from pg_policies
         where schemaname = 'public' and tablename = 'admissions_applications')  as policies,
       count(*)                                                                  as applications,
       count(*) filter (where application_fee_status = 'unknown')                as unknown,
       count(*) filter (where application_fee_status = 'unpaid')                 as unpaid,
       count(*) filter (where application_fee_status = 'paid')                   as paid,
       count(*) filter (where application_fee_status = 'waived')                 as waived,
       count(*) filter (where application_status = 'submitted'
                          and application_fee_status not in ('paid','waived'))   as submitted_without_paying
  from public.admissions_applications;
