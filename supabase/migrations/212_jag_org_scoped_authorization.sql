-- Sprint 212 — JAG External Pilot Foundation
-- Org-scoped JAG authorization + platform steward vs customer org admin.
-- Forward-only. Does not invite external pilots. Does not build /jag/admin UI.

-- ---------------------------------------------------------------------------
-- 1) Permissions (platform_permissions.permission_key)
-- ---------------------------------------------------------------------------
insert into public.platform_permissions (
  permission_key, name, description, module, category, sort_order
)
values
  (
    'JAG_PLATFORM_ADMIN',
    'JAG Platform Admin',
    'JAG platform control-plane administration across customer organizations.',
    'iam',
    'access',
    11
  ),
  (
    'JAG_ORG_ACCESS',
    'JAG Organization Access',
    'Org-scoped JAG workspace access for a customer organization administrator.',
    'iam',
    'access',
    12
  )
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 2) Roles
-- ---------------------------------------------------------------------------
insert into public.roles (name, display_name, description, is_system, sort_order)
values
  (
    'PLATFORM_OWNER',
    'Platform Owner',
    'JAG platform control-plane steward (not a customer organization admin).',
    true,
    12
  ),
  (
    'JAG_ORG_ADMIN',
    'JAG Organization Admin',
    'Customer organization administrator with org-scoped JAG access.',
    true,
    45
  )
on conflict (name) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  is_system = true,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 3) Role → permission grants (platform_role_permissions)
-- ---------------------------------------------------------------------------
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name = 'PLATFORM_OWNER'
  and p.permission_key in (
    'JAG_ACCESS',
    'JAG_PLATFORM_ADMIN',
    'ACADEMYOS_ACCESS',
    'SYSTEM_ADMIN_ACCESS',
    'USER_MANAGEMENT_ACCESS',
    'AUDIT_ACCESS',
    'REPORTING_ACCESS',
    'org.view',
    'org.manage',
    'users.view',
    'users.manage',
    'mission_control.access',
    'executive.dashboard',
    'executive.intelligence',
    'search.global'
  )
on conflict (role_id, permission_key) do nothing;

-- Customer org admin — never JAG_ACCESS / JAG_PLATFORM_ADMIN / founder.*
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name = 'JAG_ORG_ADMIN'
  and p.permission_key in (
    'JAG_ORG_ACCESS',
    'ACADEMYOS_ACCESS',
    'REPORTING_ACCESS',
    'org.view',
    'directory.view',
    'mission_control.access',
    'executive.dashboard',
    'executive.intelligence',
    'executive.risk_view',
    'search.global'
  )
on conflict (role_id, permission_key) do nothing;

-- Ensure FOUNDER retains the new catalog keys (already granted all via historical seed).
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name = 'FOUNDER'
  and p.permission_key in ('JAG_PLATFORM_ADMIN', 'JAG_ORG_ACCESS')
on conflict (role_id, permission_key) do nothing;

-- ---------------------------------------------------------------------------
-- 4) Platform steward helper (FOUNDER or PLATFORM_OWNER)
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_steward(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = check_user_id
      and r.name in ('FOUNDER', 'PLATFORM_OWNER')
  );
$$;

comment on function public.is_platform_steward(uuid) is
  'JAG/platform control-plane steward. Not granted to customer organization admins.';

-- ---------------------------------------------------------------------------
-- 5) Org access: stewards OR membership OR owner — CEO no longer global
-- ---------------------------------------------------------------------------
create or replace function public.user_can_access_organization(
  check_user_id uuid,
  check_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_steward(check_user_id)
    or exists (
      select 1
      from public.user_organization_memberships m
      where m.organization_id = check_organization_id
        and m.user_id = check_user_id
        and m.status = 'active'
    )
    or exists (
      select 1
      from public.org_organizations o
      where o.id = check_organization_id
        and o.owner_user_id = check_user_id
    );
$$;

comment on function public.user_can_access_organization(uuid, uuid) is
  'Organization access: platform steward (FOUNDER/PLATFORM_OWNER), active membership, or org owner. CEO is not globally privileged.';

-- ---------------------------------------------------------------------------
-- 6) Enterprise admin scoped to an organization
-- ---------------------------------------------------------------------------
create or replace function public.is_enterprise_admin_for_organization(
  check_organization_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_steward(check_user_id)
    or (
      public.user_can_access_organization(check_user_id, check_organization_id)
      and exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = check_user_id
          and r.name in (
            'FOUNDER',
            'CEO',
            'EXECUTIVE_DIRECTOR',
            'JAG_ORG_ADMIN',
            'PLATFORM_OWNER'
          )
      )
    );
$$;

comment on function public.is_enterprise_admin_for_organization(uuid, uuid) is
  'Enterprise admin rights only within an accessible organization (or platform steward globally).';

-- Narrow legacy is_enterprise_admin: platform steward only (remove global CEO/ED).
create or replace function public.is_enterprise_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_steward(auth.uid());
$$;

comment on function public.is_enterprise_admin() is
  'Global enterprise admin = platform steward only. CEO/ED must use org/school-scoped paths.';

-- ---------------------------------------------------------------------------
-- 7) Document auth provisioning contract for external pilots
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.auth_provisioning_config') is not null then
    comment on table public.auth_provisioning_config is
      'Auth user provisioning defaults. External pilot invites should set user_metadata.invite_organization_id or skip_default_org_membership=true to avoid auto-joining the-academy-way.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 8) Users directory: stewards see all; others see self + co-members
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.users') is null then
    return;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_select_access'
  ) then
    drop policy users_select_access on public.users;

    create policy users_select_access on public.users
      for select
      to authenticated
      using (
        public.is_platform_steward(auth.uid())
        or id = auth.uid()
        or exists (
          select 1
          from public.user_organization_memberships mine
          join public.user_organization_memberships theirs
            on theirs.organization_id = mine.organization_id
          where mine.user_id = auth.uid()
            and mine.status = 'active'
            and theirs.user_id = users.id
            and theirs.status = 'active'
        )
      );
  end if;
exception
  when undefined_table then null;
  when undefined_object then null;
  when insufficient_privilege then null;
end $$;

notify pgrst, 'reload schema';
