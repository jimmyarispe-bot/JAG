-- =========================================
-- RC-2.01: Google Workspace OAuth Installation
-- integration_connections — org-scoped connector installs
-- =========================================

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'error', 'pending')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  connected_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create index if not exists integration_connections_org_idx
  on public.integration_connections (organization_id);

create index if not exists integration_connections_provider_idx
  on public.integration_connections (provider);

alter table public.integration_connections enable row level security;

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select on public.integration_connections
  for select to authenticated
  using (
    has_permission('integration.view')
    or has_permission('integration.manage')
    or has_permission('integration.admin')
    or has_permission('configuration.manage')
    or has_permission('configuration.admin')
  );

drop policy if exists integration_connections_write on public.integration_connections;
create policy integration_connections_write on public.integration_connections
  for all to authenticated
  using (
    has_permission('integration.manage')
    or has_permission('integration.admin')
    or has_permission('configuration.manage')
    or has_permission('configuration.admin')
  )
  with check (
    has_permission('integration.manage')
    or has_permission('integration.admin')
    or has_permission('configuration.manage')
    or has_permission('configuration.admin')
  );

comment on table public.integration_connections is
  'RC-2.01 — OAuth connection state for Integration Platform providers (tokens encrypted at rest).';
