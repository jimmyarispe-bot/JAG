-- =========================================
-- P1.03 — User Management RLS
-- Admins with users.view / users.manage can read and assign roles.
-- Ensures CEO/EMPLOYEE catalog roles exist for onboarding dropdowns.
-- =========================================

-- Directory: managers need to see role assignments across the org
drop policy if exists "user_roles_read_own_or_ceo" on public.user_roles;
drop policy if exists user_roles_read_own_or_ceo on public.user_roles;
drop policy if exists user_roles_select_access on public.user_roles;

create policy user_roles_select_access
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or has_permission('users.view')
  or has_permission('users.manage')
  or has_role('CEO')
  or has_role('FOUNDER')
);

drop policy if exists user_roles_manage_access on public.user_roles;
create policy user_roles_manage_access
on public.user_roles
for all
to authenticated
using (
  has_permission('users.manage')
  or has_role('FOUNDER')
  or has_role('CEO')
)
with check (
  has_permission('users.manage')
  or has_role('FOUNDER')
  or has_role('CEO')
);

-- Catalog roles used by P1.03 onboarding (additive)
insert into public.roles (name, display_name, description, is_system, sort_order)
values
  ('CEO', 'CEO', 'Chief executive leadership across the organization.', true, 15),
  ('EMPLOYEE', 'Employee', 'General staff access without platform administration.', true, 85)
on conflict (name) do update
set
  display_name = excluded.display_name,
  description = coalesce(public.roles.description, excluded.description);

update public.roles
set display_name = 'Executive Director of Schools'
where name = 'EXECUTIVE_DIRECTOR'
  and (display_name is null or display_name in ('Executive Director', 'EXECUTIVE_DIRECTOR'));
