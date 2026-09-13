-- ===========================================================================
-- EVERY RLS LOOP OF THE KIND THAT LOCKED PARENTS OUT
-- 13 September 2026. READ ONLY — one SELECT, writes nothing.
-- ===========================================================================
--
-- WHAT WE PROVED TONIGHT. A PARENT account cannot read any row in the JAG.
-- Reading her own rows in user_roles, her own row in users, the lead, the
-- guardians — all six failed with 54001 stack depth exceeded. The one call that
-- survived was has_permission, which is SECURITY DEFINER.
--
-- THE SHAPE OF THE FAULT:
--
--   policy on table T  calls  function F
--   function F is SECURITY INVOKER and reads table T
--   -> reading T evaluates the policy, which calls F, which reads T, forever
--
-- A SECURITY DEFINER function does not loop, because its own reads are not
-- subject to RLS. That is the entire difference between has_permission
-- (answers fine) and has_role (blows the stack).
--
-- WHY STAFF NEVER SAW IT. The policy quals are OR chains that reach has_role
-- only after has_permission has returned false. For staff has_permission
-- returns true and evaluation stops. Only a non-staff account falls through —
-- and Lana is the first non-staff account ever to sign in.
--
-- WHY THIS QUERY EXISTS RATHER THAN A FIX. I found has_role by reading
-- migrations, but this checkout is missing 84 of them (the sequence runs
-- 236 -> 321), so the repo is not authority on what production runs. Fixing the
-- one function I happened to find, and letting the next one surface on a real
-- family, is not good enough. This asks the live database for all of them.
--
-- HOW TO READ IT. Three sections, most serious first:
--
--   1 SELF-LOOP     function guards table T and reads T. This is the fault.
--   2 CROSS-LOOP    invoker function called by a policy, reads some other
--                   RLS-protected table — a loop if that table's policy leads
--                   back. Needs a human eye.
--   3 SAFE          referenced by a policy and already SECURITY DEFINER.
--                   Listed so the contrast is visible.
--
-- Nothing is changed. This is a SELECT.
-- ===========================================================================

with
-- Tables that actually enforce RLS. A function reading a table with RLS off
-- can never loop, so those are not interesting.
rls_tables as (
  select c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
),

-- Every SQL/plpgsql function in public, with its body and its security mode.
fns as (
  select
    p.oid,
    p.proname,
    p.prosecdef,
    p.prosrc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where n.nspname = 'public'
    and p.prokind = 'f'
    and l.lanname in ('sql', 'plpgsql')
),

-- Every policy, with its USING and WITH CHECK text in one string.
pols as (
  select
    tablename,
    policyname,
    cmd,
    coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr
  from pg_policies
  where schemaname = 'public'
),

-- Which functions each policy calls. Matched on "name(" at a word boundary so
-- a mention inside a longer identifier does not count.
refs as (
  select distinct
    f.oid,
    f.proname,
    f.prosecdef,
    f.prosrc,
    pl.tablename,
    pl.policyname,
    pl.cmd
  from pols pl
  join fns f
    on pl.expr ~ ('\m' || f.proname || '\s*\(')
),

-- Which RLS-protected tables each of those functions reads.
reads as (
  select
    r.oid,
    r.proname,
    r.prosecdef,
    r.tablename,
    r.policyname,
    r.cmd,
    t.table_name as reads_table
  from refs r
  join rls_tables t
    on r.prosrc ~ ('\m' || t.table_name || '\M')
)

-- 1. SELF-LOOP: the function guards the table it reads. This is the fault.
select
  1                                                      as section,
  'SELF-LOOP — guards the table it reads'                as finding,
  reads_table                                            as "table",
  policyname                                             as policy,
  cmd                                                    as command,
  proname                                                as function,
  'security INVOKER'                                     as security,
  'Reading this table calls this function, which reads this table.'
                                                         as why
from reads
where not prosecdef
  and reads_table = tablename

union all

-- 2. CROSS-LOOP: invoker function in a policy, reading some other RLS table.
select
  2,
  'CROSS-LOOP — invoker reads another protected table',
  tablename,
  policyname,
  cmd,
  proname,
  'security INVOKER',
  'Reads ' || reads_table || ' under RLS. A loop if that table''s policy leads back here.'
from reads
where not prosecdef
  and reads_table <> tablename

union all

-- 3. SAFE: already definer. Shown for contrast — this is what the fix looks
--    like, and these are the calls that answered cleanly tonight.
select
  3,
  'SAFE — already SECURITY DEFINER',
  tablename,
  policyname,
  cmd,
  proname,
  'SECURITY DEFINER',
  'Its own reads are not subject to RLS, so it cannot re-enter the policy.'
from reads
where prosecdef
  and reads_table = tablename

order by section, "table", function, policy;
