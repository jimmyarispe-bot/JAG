-- 235_schools_update_policy.sql
--
-- `public.schools` has row-level security on and exactly one policy:
-- `schools_access_controlled`, for SELECT. There is no UPDATE policy at all.
--
-- Postgres does not error on that. It silently matches zero rows. So every
-- attempt to edit a school through the application has always written nothing,
-- and would have reported success to the user, because nothing checked the row
-- count. The admissions-contacts editor only surfaced it because its UPDATE
-- carries a .select() and treats zero rows as a failure.
--
-- This adds the missing UPDATE policy, gated on `has_permission()` — the
-- database's own permission function, which already grants FOUNDER, CEO and
-- EXECUTIVE_DIRECTOR unconditionally and otherwise consults
-- platform_role_permissions.
--
-- Deliberately a PERMISSION, not a role list. This codebase has now been bitten
-- three times in one day by role-name checks: the page guard locked out the
-- platform owner, `canManageStudentLifecycle` reads a different role set than
-- the database does, and `can_access_school` recognises nine staff roles but
-- not the one the signed-in account actually holds. `school.configure` is the
-- same key the application checks, so the app and the database now agree on one
-- name instead of disagreeing in two vocabularies.
--
-- Scope note: this grants UPDATE on the whole `schools` row, not only the
-- admissions columns. Column-level grants would be tighter, but partial policies
-- across a table nothing else writes would be more machinery than the risk
-- justifies. Anyone who can configure a school can already rename it through
-- any other admin surface.
--
-- Safe to re-run.

drop policy if exists schools_update_controlled on public.schools;

create policy schools_update_controlled
  on public.schools
  for update
  to authenticated
  using (
    public.is_enterprise_admin()
    or public.has_permission('school.configure')
  )
  with check (
    public.is_enterprise_admin()
    or public.has_permission('school.configure')
  );

comment on policy schools_update_controlled on public.schools is
  'Added Sep 2026. Before this, schools had a SELECT policy and no UPDATE policy, '
  'so every write silently affected zero rows. Gated on the school.configure '
  'permission so the application and the database agree on one name.';

-- What can now be written, and by whom.
select
  policyname,
  cmd,
  qual::text   as using_clause,
  with_check::text
from pg_policies
where schemaname = 'public' and tablename = 'schools'
order by cmd, policyname;
