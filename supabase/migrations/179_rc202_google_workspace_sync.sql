-- =========================================
-- RC-2.02: Google Workspace Synchronization Engine
-- Sync registry, runs, cursors + connection denormalized pointers
-- =========================================

alter table public.integration_connections
  add column if not exists last_sync_at timestamptz;

alter table public.integration_connections
  add column if not exists last_sync_status text
    check (last_sync_status is null or last_sync_status in ('succeeded', 'failed', 'partial', 'running'));

alter table public.integration_connections
  add column if not exists last_sync_error text;

alter table public.integration_connections
  add column if not exists last_sync_duration_ms integer;

alter table public.integration_connections
  add column if not exists last_sync_records integer;

alter table public.integration_connections
  add column if not exists records_imported integer not null default 0;

-- Telemetry history
create table if not exists public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  provider text not null default 'google_workspace',
  job_id text not null,
  mode text not null
    check (mode in ('manual', 'scheduled', 'incremental', 'full', 'retry')),
  status text not null
    check (status in ('running', 'succeeded', 'failed', 'partial', 'cancelled')),
  triggered_by text not null
    check (triggered_by in ('manual', 'scheduler', 'webhook', 'retry', 'install')),
  object_types text[] not null default '{}',
  records_fetched integer not null default 0,
  records_normalized integer not null default 0,
  records_changed integer not null default 0,
  duration_ms integer,
  cursor text,
  error text,
  provider_version text,
  token_expires_at timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists integration_sync_runs_conn_started_idx
  on public.integration_sync_runs (connection_id, started_at desc);

create index if not exists integration_sync_runs_org_idx
  on public.integration_sync_runs (organization_id, started_at desc);

-- Incremental checkpoints per object type
create table if not exists public.integration_sync_cursors (
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  object_type text not null,
  cursor text,
  updated_at timestamptz not null default now(),
  primary key (connection_id, object_type)
);

-- Schedule / enablement registry
create table if not exists public.integration_sync_registry (
  connection_id uuid primary key references public.integration_connections(id) on delete cascade,
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  provider text not null default 'google_workspace',
  enabled boolean not null default true,
  incremental_cron text not null default '0 * * * *',
  full_cron text not null default '0 2 * * *',
  next_incremental_at timestamptz,
  next_full_at timestamptz,
  last_successful_sync_at timestamptz,
  last_attempted_sync_at timestamptz,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists integration_sync_registry_due_inc_idx
  on public.integration_sync_registry (enabled, next_incremental_at)
  where enabled = true;

create index if not exists integration_sync_registry_due_full_idx
  on public.integration_sync_registry (enabled, next_full_at)
  where enabled = true;

alter table public.integration_sync_runs enable row level security;
alter table public.integration_sync_cursors enable row level security;
alter table public.integration_sync_registry enable row level security;

drop policy if exists integration_sync_runs_access on public.integration_sync_runs;
create policy integration_sync_runs_access on public.integration_sync_runs
  for all to authenticated
  using (
    has_permission('integration.view')
    or has_permission('integration.manage')
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

drop policy if exists integration_sync_cursors_access on public.integration_sync_cursors;
create policy integration_sync_cursors_access on public.integration_sync_cursors
  for all to authenticated
  using (
    has_permission('integration.view')
    or has_permission('integration.manage')
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

drop policy if exists integration_sync_registry_access on public.integration_sync_registry;
create policy integration_sync_registry_access on public.integration_sync_registry
  for all to authenticated
  using (
    has_permission('integration.view')
    or has_permission('integration.manage')
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

comment on table public.integration_sync_runs is
  'RC-2.02 — Google Workspace (and future) sync run telemetry.';
comment on table public.integration_sync_registry is
  'RC-2.02 — Scheduled sync enablement (hourly incremental / daily full).';
