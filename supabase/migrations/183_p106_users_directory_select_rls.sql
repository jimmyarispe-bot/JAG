-- =========================================
-- P1.06 — Users directory SELECT for admins
--
-- Create User writes via service role (bypasses RLS), but
-- getAdminUsersDirectory() reads with the session client.
-- Policy "user_self_access" (015) only allowed:
--   id = auth.uid() OR CEO OR SCHOOL_LEADER
-- Founders / users.view / users.manage could create a user and
-- never see them in /dashboard/admin/users.
-- =========================================

drop policy if exists "user_self_access" on public.users;
drop policy if exists user_self_access on public.users;
drop policy if exists users_select_access on public.users;

create policy users_select_access
on public.users
for select
to authenticated
using (
  id = auth.uid()
  or has_permission('users.view')
  or has_permission('users.manage')
  or has_role('FOUNDER')
  or has_role('CEO')
  or has_role('ADMINISTRATOR')
  or has_role('SCHOOL_LEADER')
);
