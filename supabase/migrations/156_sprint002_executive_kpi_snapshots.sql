-- =========================================
-- Sprint 002 Task 2: Executive KPI Snapshot Engine
-- Extends executive_kpi_snapshots for aggregate metrics contract
-- =========================================

-- Drop legacy FK so metric ids from executive-metrics (e.g. enrollment.active_enrollments)
-- can persist without requiring executive_kpi_definitions rows.
alter table public.executive_kpi_snapshots
  drop constraint if exists executive_kpi_snapshots_kpi_key_fkey;

-- Drop legacy unique (NULLs in school_id/campus_id/program break duplicate detection).
alter table public.executive_kpi_snapshots
  drop constraint if exists executive_kpi_snapshots_school_id_campus_id_program_kpi_key_snapshot_date_key;

alter table public.executive_kpi_snapshots
  alter column actual_value drop not null;

alter table public.executive_kpi_snapshots
  add column if not exists organization_id uuid references public.org_organizations(id) on delete set null,
  add column if not exists region_id uuid references public.org_regions(id) on delete set null,
  add column if not exists metric_name text,
  add column if not exists status text,
  add column if not exists trend_direction text,
  add column if not exists trend_pct numeric(14, 4),
  add column if not exists confidence text,
  add column if not exists source text,
  add column if not exists captured_at timestamptz not null default now(),
  add column if not exists capture_mode text not null default 'manual'
    check (capture_mode in ('daily', 'manual', 'backfill'));

-- Backfill metric_name from kpi_key where missing.
update public.executive_kpi_snapshots
set metric_name = coalesce(metric_name, kpi_key)
where metric_name is null;

alter table public.executive_kpi_snapshots
  alter column metric_name set default '';

-- Period-scoped duplicate prevention across nullable hierarchy dimensions.
create unique index if not exists idx_executive_kpi_snapshots_period_unique
  on public.executive_kpi_snapshots (
    coalesce(organization_id::text, ''),
    coalesce(region_id::text, ''),
    coalesce(school_id::text, ''),
    coalesce(campus_id::text, ''),
    coalesce(program, ''),
    kpi_key,
    snapshot_date
  );

create index if not exists idx_executive_kpi_snapshots_org_date
  on public.executive_kpi_snapshots(organization_id, snapshot_date desc);

create index if not exists idx_executive_kpi_snapshots_captured
  on public.executive_kpi_snapshots(captured_at desc);

comment on table public.executive_kpi_snapshots is
  'Daily/manual/backfill executive metric snapshots — written by platform kpi-snapshots from getExecutiveAggregateMetrics only';
