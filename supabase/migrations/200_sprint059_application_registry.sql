-- =========================================
-- SPRINT 059: APPLICATION REGISTRY & ENABLEMENT
-- Platform architecture track (Phase 1 — metadata only)
--
-- Teaches the platform about Applications:
--   Platform     = JAG
--   Application  = AcademyOS (Application #1)
--   Tenant       = Organization (The Academy Way = Tenant #1)
--   Enablement   = organization_applications
--
-- No UI / navigation / permission behavior changes in this sprint.
-- Idempotent: safe to re-run.
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. Platform application catalog
-- ---------------------------------------------------------------------------

create table if not exists public.platform_applications (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'deprecated')),
  sort_order integer not null default 0,
  home_route text,
  permission_pack_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_applications_key_unique unique (key)
);

drop trigger if exists platform_applications_set_updated_at
  on public.platform_applications;
create trigger platform_applications_set_updated_at
  before update on public.platform_applications
  for each row execute function public.trigger_set_updated_at();

create index if not exists idx_platform_applications_status_sort
  on public.platform_applications (status, sort_order);

comment on table public.platform_applications is
  'JAG platform application registry (AcademyOS, future HealthcareOS, …). Catalog only in Sprint 059.';

-- ---------------------------------------------------------------------------
-- 2. Tenant ↔ application enablement
-- ---------------------------------------------------------------------------

create table if not exists public.organization_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.org_organizations (id) on delete cascade,
  application_id uuid not null
    references public.platform_applications (id) on delete cascade,
  status text not null default 'enabled'
    check (status in ('enabled', 'disabled')),
  enabled_at timestamptz,
  disabled_at timestamptz,
  enabled_by uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_applications_org_app_unique
    unique (organization_id, application_id)
);

drop trigger if exists organization_applications_set_updated_at
  on public.organization_applications;
create trigger organization_applications_set_updated_at
  before update on public.organization_applications
  for each row execute function public.trigger_set_updated_at();

create index if not exists idx_organization_applications_org
  on public.organization_applications (organization_id);

create index if not exists idx_organization_applications_app
  on public.organization_applications (application_id);

create index if not exists idx_organization_applications_enabled
  on public.organization_applications (organization_id, status)
  where status = 'enabled';

comment on table public.organization_applications is
  'Which applications are enabled for a tenant organization. Soft default in app code: missing rows ⇒ academyos enabled.';

-- ---------------------------------------------------------------------------
-- 3. Seed Application #1 = AcademyOS
-- ---------------------------------------------------------------------------

insert into public.platform_applications (
  key,
  name,
  description,
  status,
  sort_order,
  home_route,
  permission_pack_key,
  metadata
)
values (
  'academyos',
  'AcademyOS',
  'School / education operations application on the JAG platform.',
  'active',
  10,
  '/dashboard',
  'ACADEMYOS_ACCESS',
  jsonb_build_object(
    'application_number', 1,
    'vertical', 'education',
    'sprint', '059'
  )
)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order,
  home_route = excluded.home_route,
  permission_pack_key = excluded.permission_pack_key,
  metadata = public.platform_applications.metadata || excluded.metadata,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. Enable AcademyOS for every existing tenant (incl. Tenant #1)
-- ---------------------------------------------------------------------------

insert into public.organization_applications (
  organization_id,
  application_id,
  status,
  enabled_at,
  metadata
)
select
  o.id,
  a.id,
  'enabled',
  now(),
  case
    when o.slug = 'the-academy-way' then jsonb_build_object(
      'tenant_number', 1,
      'tenant_name', 'The Academy Way',
      'sprint', '059'
    )
    else jsonb_build_object('sprint', '059', 'seeded', true)
  end
from public.org_organizations o
cross join public.platform_applications a
where a.key = 'academyos'
on conflict (organization_id, application_id) do update
set
  status = 'enabled',
  enabled_at = coalesce(public.organization_applications.enabled_at, now()),
  disabled_at = null,
  metadata = public.organization_applications.metadata || excluded.metadata,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------

alter table public.platform_applications enable row level security;
alter table public.organization_applications enable row level security;

-- Catalog: readable by authenticated users (like other platform type definitions)
drop policy if exists platform_applications_read on public.platform_applications;
create policy platform_applications_read
  on public.platform_applications
  for select to authenticated
  using (true);

-- Catalog writes: service role / SQL only (no authenticated write policy)

-- Enablement: org members (and platform stewards via can_access_organization) may read
drop policy if exists organization_applications_read
  on public.organization_applications;
create policy organization_applications_read
  on public.organization_applications
  for select to authenticated
  using (public.can_access_organization(organization_id));

-- Enablement manage: org admins only (not wired in UI this sprint)
drop policy if exists organization_applications_manage
  on public.organization_applications;
create policy organization_applications_manage
  on public.organization_applications
  for all to authenticated
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));

-- ---------------------------------------------------------------------------
-- 6. API grants + PostgREST reload
-- ---------------------------------------------------------------------------

grant select on public.platform_applications to authenticated, anon, service_role;
grant select, insert, update, delete on public.organization_applications
  to authenticated, service_role;
grant all on public.platform_applications to service_role;

notify pgrst, 'reload schema';
