-- ===========================================================================
-- 350. THE THREE FUNCTIONS THAT LOCKED EVERY PARENT OUT OF THE JAG
-- 13 September 2026
-- ===========================================================================
--
-- WHAT WAS BROKEN. A PARENT account could not read a single row anywhere in the
-- product. Not their child's enquiry, not the guardian record carrying their own
-- name, not even their own row in public.users. Reproduced against production on
-- 13 September as Lana Robinson, the first non-staff account ever to sign in:
--
--   1. auth.uid()                       OK
--   2. select from roles                OK    26 rows
--   3. select own rows from user_roles  FAIL  54001 stack depth limit exceeded
--   4. has_role('PARENT')               FAIL  54001
--   5. has_permission('users.view')     OK    f          <-- the one that works
--   6. read own row in users            FAIL  54001
--   7. read the lead                    FAIL  54001
--   8. is_guardian_of_lead(lead)        FAIL  54001
--   9. read admissions_lead_guardians   FAIL  54001
--  10. the portal's own shape           FAIL  54001
--
-- THE FAULT:
--
--     policy on table T calls function F
--     F is SECURITY INVOKER and reads table T
--     -> reading T evaluates the policy, which calls F, which reads T, forever
--
-- Step 5 is the proof. has_permission answers cleanly for the same account in
-- the same transaction, and the only thing different about it is that it is
-- SECURITY DEFINER, so its own reads are not subject to RLS and it cannot
-- re-enter the policy that called it.
--
-- WHY THIS SURVIVED A YEAR IN PRODUCTION. The policy quals are OR chains:
--
--     user_id = auth.uid()
--     or has_permission('users.view')     <-- staff stop here, true
--     or has_permission('users.manage')
--     or has_role('CEO')                  <-- a parent falls through to here
--     or has_role('FOUNDER')
--
-- OR short-circuits left to right. For staff, has_permission returns true and
-- has_role is never called. For a parent both has_permission branches return
-- false, evaluation reaches has_role, and the floor gives way. The bug needed a
-- non-staff account to exist before it could be seen, and until tonight none
-- ever had.
--
-- WHICH FUNCTIONS. Asked of the live database rather than the repo, because this
-- checkout is missing 84 migrations (the sequence runs 236 -> 321) and is not
-- authority on what production runs. Of 1,135 policy/function pairs, exactly
-- seven are a function guarding the table it reads, across three functions:
--
--   has_role             user_roles [ALL], user_roles [SELECT], roles [UPDATE]
--   is_guardian_of_lead  admissions_lead_guardians [INSERT], [SELECT]
--   can_access_school    students [INSERT], students [UPDATE]
--
-- can_access_school is referenced by 865 policies. That is why the damage is the
-- whole product and not one screen.
--
-- ---------------------------------------------------------------------------
-- WHY ALTER FUNCTION AND NOT CREATE OR REPLACE.
--
-- Retyping a body from this checkout would silently revert whatever those 84
-- missing migrations did to it. ALTER FUNCTION changes the security mode and
-- nothing else: production keeps the exact logic it has today. If that logic is
-- wrong, this migration does not make it wronger.
-- ---------------------------------------------------------------------------
--
-- DOES THIS LET ANYONE SEE MORE THAN THEY SHOULD? No, and this is the question
-- that matters most, so it is answered function by function:
--
--   has_role(text)              reads user_roles where user_id = auth.uid()
--   can_access_school(uuid)     every branch is scoped to auth.uid()
--   is_guardian_of_lead(uuid)   matches lower(lg.email) = lower(u.email)
--                               where u.id = auth.uid()
--
-- All three answer a question about the caller and nobody else. There is no
-- argument by which a caller can ask about another person. SECURITY DEFINER
-- changes only whether RLS applies to the function's OWN internal reads — and
-- those reads are already restricted to the caller's rows by their WHERE
-- clauses. So the set of people each function returns true for is unchanged.
-- What changes is that it returns an answer at all instead of crashing.
--
-- The one behavioural difference: where RLS was previously hiding the caller's
-- own rows FROM the caller, these now see them. That is the bug being fixed, not
-- a widening of access.
--
-- search_path is pinned on each, because a SECURITY DEFINER function without one
-- can be hijacked by a caller who controls the search path.
--
-- STILL OUTSTANDING after this migration — none of it is access control, and
-- none of it blocks a parent signing in, but it is written down so it is not
-- forgotten:
--   - the portal swallows a failed read and renders it as "No inquiries found",
--     so this crash looked like an empty list for a whole day
--   - that empty state offers an invited parent a button back to the interest
--     form they already filled in
-- ===========================================================================

do $$
declare
  f record;
  n_changed int := 0;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.proname in ('has_role', 'can_access_school', 'is_guardian_of_lead')
      and p.prokind = 'f'
      and not p.prosecdef
    order by p.proname
  loop
    execute format('alter function %s security definer', f.sig);
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
    n_changed := n_changed + 1;
    raise notice 'converted % to SECURITY DEFINER', f.sig;
  end loop;

  raise notice '% function(s) converted', n_changed;
end $$;

-- ---------------------------------------------------------------------------
-- Refuse to be believed. If any of the three is still invoker, this migration
-- did not do its job and should fail loudly rather than report success.
-- ---------------------------------------------------------------------------
do $$
declare
  still_invoker text;
begin
  select string_agg(p.oid::regprocedure::text, ', ' order by p.proname)
    into still_invoker
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
    and p.proname in ('has_role', 'can_access_school', 'is_guardian_of_lead')
    and p.prokind = 'f'
    and not p.prosecdef;

  if still_invoker is not null then
    raise exception 'Still SECURITY INVOKER after migration 350: %', still_invoker;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- VERIFICATION. Run after. Every row must read SECURITY DEFINER, and the
-- search_path column must not be empty.
--
--   select p.proname,
--          case when p.prosecdef then 'SECURITY DEFINER' else 'security INVOKER' end as security,
--          coalesce(array_to_string(p.proconfig, ', '), '(no search_path)') as settings
--   from pg_proc p
--   join pg_namespace ns on ns.oid = p.pronamespace
--   where ns.nspname = 'public'
--     and p.proname in ('has_role', 'can_access_school', 'is_guardian_of_lead')
--   order by p.proname;
--
-- Then re-run supabase/diagnostics/has_role_recursion_isolate_2026_09_13.sql.
-- Steps 1 to 10 must all read OK. Anything still FAIL means a fourth loop
-- exists and this migration is incomplete.
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
