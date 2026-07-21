-- =========================================
-- RC4: Workflow & Automation Engine
-- Configurable event-driven workflows with
-- execution history, retry, and audit trail
-- =========================================

create table if not exists public.platform_workflows (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'general'
    check (category in (
      'admissions', 'students', 'families', 'communications',
      'scholarships', 'billing', 'attendance', 'hr', 'system', 'general'
    )),
  trigger_key text not null,
  definition jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  version integer not null default 1,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  last_run_at timestamptz,
  run_count integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  max_retries integer not null default 3,
  retry_backoff_ms integer not null default 1000
);

create index if not exists idx_platform_workflows_trigger
  on public.platform_workflows(trigger_key)
  where enabled = true and status = 'active';
create index if not exists idx_platform_workflows_org
  on public.platform_workflows(organization_id, status);
create index if not exists idx_platform_workflows_school
  on public.platform_workflows(school_id, status);
create index if not exists idx_platform_workflows_category
  on public.platform_workflows(category);

create table if not exists public.platform_workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.platform_workflows(id) on delete cascade,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  trigger_key text not null,
  trigger_event_id text,
  dedupe_key text,
  status text not null default 'pending'
    check (status in (
      'pending', 'running', 'completed', 'failed', 'skipped',
      'retrying', 'dead_letter', 'cancelled'
    )),
  attempt integer not null default 1,
  max_attempts integer not null default 3,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  error_message text,
  error_details jsonb,
  context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_platform_workflow_exec_dedupe
  on public.platform_workflow_executions(workflow_id, dedupe_key)
  where dedupe_key is not null
    and status in ('pending', 'running', 'completed', 'retrying');

create index if not exists idx_platform_workflow_exec_workflow
  on public.platform_workflow_executions(workflow_id, created_at desc);
create index if not exists idx_platform_workflow_exec_status
  on public.platform_workflow_executions(status, created_at desc);
create index if not exists idx_platform_workflow_exec_dead
  on public.platform_workflow_executions(status)
  where status = 'dead_letter';

create table if not exists public.platform_workflow_execution_steps (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.platform_workflow_executions(id) on delete cascade,
  node_id text not null,
  node_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_workflow_exec_steps
  on public.platform_workflow_execution_steps(execution_id);

-- RLS
alter table public.platform_workflows enable row level security;
alter table public.platform_workflow_executions enable row level security;
alter table public.platform_workflow_execution_steps enable row level security;

drop policy if exists platform_workflows_staff on public.platform_workflows;
create policy platform_workflows_staff on public.platform_workflows
  for all using (
    school_id is null or public.can_access_school(school_id)
  )
  with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_workflow_exec_staff on public.platform_workflow_executions;
create policy platform_workflow_exec_staff on public.platform_workflow_executions
  for all using (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_workflow_exec_steps_staff on public.platform_workflow_execution_steps;
create policy platform_workflow_exec_steps_staff on public.platform_workflow_execution_steps
  for all using (
    exists (
      select 1 from public.platform_workflow_executions e
      where e.id = execution_id
        and (e.school_id is null or public.can_access_school(e.school_id))
    )
  );

comment on table public.platform_workflows is 'RC4 configurable event-driven workflows';
comment on column public.platform_workflows.definition is 'JSON graph: nodes (trigger/condition/action/delay/branch/end) + edges';
comment on table public.platform_workflow_executions is 'Workflow run history with retry and dead-letter support';
