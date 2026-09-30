-- Is every table actually protected, or does it only look protected?
--
-- Supabase exposes every table in `public` through PostgREST, and the anon key
-- is in the browser of every family who opens /apply. Row-level security is
-- the only thing between that key and the data. One table without it is not
-- one leaked row - it is that whole table, to anybody who looks.
--
-- THREE WAYS A TABLE CAN BE WRONG, and only the first one is obvious:
--
--   1. RLS OFF                  wide open through the API
--   2. RLS ON, NO POLICIES      nothing can read it, including the app.
--                               Safe, but something is broken and quietly
--                               returning zero rows - the house failure.
--   3. RLS ON, POLICY `true`    reads as protected in every dashboard and
--                               protects nothing. This is the dangerous one,
--                               because it passes a glance.
--
-- Ordered worst first. READ ONLY - nothing is written, nothing is changed.

with t as (
  select c.oid,
         c.relname                                   as table_name,
         c.relrowsecurity                            as rls_on,
         c.relforcerowsecurity                       as rls_forced
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
),
p as (
  select pol.polrelid                                as oid,
         count(*)                                    as policies,
         count(*) filter (where pol.polcmd = 'r')     as select_policies,
         -- A qualifier that is literally true lets every row through.
         count(*) filter (
           where coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') in ('true', '(true)')
         )                                           as wide_open_policies,
         string_agg(distinct pol.polname, ', ' order by pol.polname) as policy_names
    from pg_policy pol
   group by pol.polrelid
)
select t.table_name,
       t.rls_on,
       coalesce(p.policies, 0)            as policies,
       coalesce(p.select_policies, 0)     as read_policies,
       coalesce(p.wide_open_policies, 0)  as policies_that_allow_everything,
       case
         when not t.rls_on
           then '1 - WIDE OPEN: no row-level security, readable through the API'
         when coalesce(p.wide_open_policies, 0) > 0
           then '2 - LOOKS PROTECTED, IS NOT: a policy passes every row'
         when coalesce(p.policies, 0) = 0
           then '3 - LOCKED SHUT: RLS on with no policies, so nothing reads it at all'
         when coalesce(p.select_policies, 0) = 0
           then '4 - no SELECT policy: writable paths exist but nothing can read'
         else 'ok'
       end                                as verdict,
       p.policy_names
  from t
  left join p on p.oid = t.oid
 order by case
            when not t.rls_on then 1
            when coalesce(p.wide_open_policies, 0) > 0 then 2
            when coalesce(p.policies, 0) = 0 then 3
            when coalesce(p.select_policies, 0) = 0 then 4
            else 5
          end,
          t.table_name;
