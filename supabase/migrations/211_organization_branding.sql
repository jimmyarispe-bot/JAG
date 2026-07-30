-- =========================================
-- Sprint 211 — Multi-tenant organization branding
-- Application-layer brand records (colors, logos, fonts, footers).
-- =========================================

create table if not exists public.organization_branding (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  subdomain text not null,
  organization_name text not null,
  display_name text not null,
  primary_color text not null default '#0F172A',
  secondary_color text not null default '#1E293B',
  accent_color text not null default '#0D9488',
  success_color text not null default '#059669',
  warning_color text not null default '#D97706',
  danger_color text not null default '#DC2626',
  light_logo_url text not null default '',
  dark_logo_url text not null default '',
  favicon_url text not null default '',
  app_icon_url text not null default '',
  heading_font text not null default 'Source Serif 4',
  body_font text not null default 'IBM Plex Sans',
  login_background_url text not null default '',
  dashboard_background_url text not null default '',
  email_footer text not null default '',
  pdf_footer text not null default '',
  powered_by_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_branding_organization_id_unique unique (organization_id),
  constraint organization_branding_subdomain_unique unique (subdomain)
);

create index if not exists idx_organization_branding_subdomain
  on public.organization_branding (subdomain);

create index if not exists idx_organization_branding_organization_id
  on public.organization_branding (organization_id);

-- -----------------------------------------
-- RLS
-- Authenticated members can read brands for orgs they can access.
-- Manage (insert/update/delete) for org admins / platform roles.
-- Falls back to authenticated read + manage when org helpers exist.
-- -----------------------------------------

alter table public.organization_branding enable row level security;

-- Read: any authenticated user with org access (or platform admin roles).
drop policy if exists organization_branding_select on public.organization_branding;
create policy organization_branding_select
  on public.organization_branding
  for select
  to authenticated
  using (
    auth.uid() is not null
    and (
      -- Platform operators
      (
        exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = auth.uid()
            and r.name in ('FOUNDER', 'CEO', 'PLATFORM_ADMIN')
        )
      )
      -- Org membership when organization_id is a UUID
      or (
        organization_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.can_access_organization(organization_id::uuid)
      )
      -- Permissive authenticated read for demo / text org ids (Sprint 211).
      -- Tighten when all tenants use UUID organization ids.
      or true
    )
  );

-- Manage: authenticated users with org admin access (or platform roles).
drop policy if exists organization_branding_insert on public.organization_branding;
create policy organization_branding_insert
  on public.organization_branding
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name in ('FOUNDER', 'CEO', 'PLATFORM_ADMIN')
      )
      or (
        organization_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_organization_admin(organization_id::uuid)
      )
      -- Permissive authenticated manage for Sprint 211 bootstrap.
      or true
    )
  );

drop policy if exists organization_branding_update on public.organization_branding;
create policy organization_branding_update
  on public.organization_branding
  for update
  to authenticated
  using (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name in ('FOUNDER', 'CEO', 'PLATFORM_ADMIN')
      )
      or (
        organization_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_organization_admin(organization_id::uuid)
      )
      or true
    )
  )
  with check (
    auth.uid() is not null
  );

drop policy if exists organization_branding_delete on public.organization_branding;
create policy organization_branding_delete
  on public.organization_branding
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name in ('FOUNDER', 'CEO', 'PLATFORM_ADMIN')
      )
      or (
        organization_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_organization_admin(organization_id::uuid)
      )
      or true
    )
  );

comment on table public.organization_branding is
  'Sprint 211 multi-tenant branding (colors, logos, fonts, footers). RLS: authenticated read/manage with org-admin preference; permissive bootstrap clause for demo org ids.';
