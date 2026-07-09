-- =========================================
-- B-04 PHASE 2: PLATFORM WORKFLOW PERSISTENCE (136)
-- Canonical workflow engine tables
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. WORKFLOW DEFINITIONS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  domain text not null,
  entity_type text not null,
  name text not null,
  description text,
  school_id uuid references public.schools(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_workflow_definitions_key_scope unique (workflow_key, school_id)
);

create index if not exists idx_platform_workflow_definitions_domain
  on public.platform_workflow_definitions(domain, status);

drop trigger if exists platform_workflow_definitions_set_updated_at on public.platform_workflow_definitions;
create trigger platform_workflow_definitions_set_updated_at
  before update on public.platform_workflow_definitions
  for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. WORKFLOW VERSIONS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_versions (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.platform_workflow_definitions(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  definition_snapshot jsonb not null,
  initial_state_key text not null,
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint platform_workflow_versions_def_version unique (definition_id, version_number)
);

create index if not exists idx_platform_workflow_versions_status
  on public.platform_workflow_versions(definition_id, status, version_number desc);

-- ---------------------------------------------------------------------------
-- 3. WORKFLOW INSTANCES
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_instances (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.platform_workflow_versions(id) on delete restrict,
  workflow_key text not null,
  domain text not null,
  entity_type text not null,
  entity_id uuid not null,
  school_id uuid references public.schools(id) on delete set null,
  organization_id uuid references public.org_organizations(id) on delete set null,
  current_state_key text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  facts jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  started_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_workflow_instances_entity
  on public.platform_workflow_instances(domain, entity_type, entity_id);

create index if not exists idx_platform_workflow_instances_active
  on public.platform_workflow_instances(workflow_key, status)
  where status = 'active';

create unique index if not exists idx_platform_workflow_instances_active_entity
  on public.platform_workflow_instances(domain, entity_type, entity_id)
  where status = 'active';

drop trigger if exists platform_workflow_instances_set_updated_at on public.platform_workflow_instances;
create trigger platform_workflow_instances_set_updated_at
  before update on public.platform_workflow_instances
  for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. STATE HISTORY (includes audit trail)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_state_history (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.platform_workflow_instances(id) on delete cascade,
  version_id uuid not null references public.platform_workflow_versions(id) on delete restrict,
  event_type text not null,
  from_state_key text,
  to_state_key text not null,
  transition_key text,
  actor_user_id uuid references public.users(id) on delete set null,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_platform_workflow_state_history_instance
  on public.platform_workflow_state_history(instance_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 5. WORKFLOW TASKS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.platform_workflow_instances(id) on delete cascade,
  state_key text,
  transition_key text,
  action_key text,
  task_name text not null,
  task_status text not null default 'open'
    check (task_status in ('open', 'completed', 'cancelled')),
  due_at timestamptz,
  assigned_roles text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_platform_workflow_tasks_instance
  on public.platform_workflow_tasks(instance_id, task_status);

-- ---------------------------------------------------------------------------
-- 6. WORKFLOW APPROVALS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.platform_workflow_instances(id) on delete cascade,
  transition_key text not null,
  gate_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'escalated')),
  requested_by uuid references public.users(id) on delete set null,
  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  decision_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_workflow_approvals_instance
  on public.platform_workflow_approvals(instance_id, status);

-- ---------------------------------------------------------------------------
-- 7. WORKFLOW TIMERS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_workflow_timers (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.platform_workflow_instances(id) on delete cascade,
  timer_key text not null,
  state_key text,
  status text not null default 'pending'
    check (status in ('pending', 'fired', 'cancelled')),
  fires_at timestamptz not null,
  fired_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_workflow_timers_pending
  on public.platform_workflow_timers(status, fires_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 8. SEED: ADMISSIONS CASE PIPELINE (published v1)
-- ---------------------------------------------------------------------------

insert into public.platform_workflow_definitions
  (workflow_key, domain, entity_type, name, description, school_id, status, sort_order, tags)
values
  (
    'admissions_case_pipeline',
    'admissions',
    'admissions_lead',
    'Admissions Case Pipeline',
    'Orchestrates admissions case pipeline stages for lead/case entities',
    null,
    'published',
    10,
    array['admissions', 'case', 'pipeline']
  )
on conflict (workflow_key, school_id) do update
  set
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    updated_at = now();

insert into public.platform_workflow_versions
  (definition_id, version_number, status, definition_snapshot, initial_state_key, published_at)
select
  d.id,
  1,
  'published',
  '{
    "workflowKey": "admissions_case_pipeline",
    "name": "Admissions Case Pipeline",
    "domain": "admissions",
    "version": 1,
    "status": "published",
    "entityType": "admissions_lead",
    "initialStateKey": "inquiry",
    "states": [
      {"key": "inquiry", "label": "Inquiry", "stateType": "initial", "sortOrder": 0},
      {"key": "information_requested", "label": "Information Requested", "stateType": "intermediate", "sortOrder": 10},
      {"key": "application_started", "label": "Application Started", "stateType": "intermediate", "sortOrder": 20},
      {"key": "application_submitted", "label": "Application Submitted", "stateType": "intermediate", "sortOrder": 30},
      {"key": "documents_pending", "label": "Documents Pending", "stateType": "intermediate", "sortOrder": 40},
      {"key": "documents_complete", "label": "Documents Complete", "stateType": "intermediate", "sortOrder": 50},
      {"key": "interview_scheduled", "label": "Interview Scheduled", "stateType": "intermediate", "sortOrder": 60},
      {"key": "assessment_scheduled", "label": "Assessment Scheduled", "stateType": "intermediate", "sortOrder": 70},
      {"key": "assessment_complete", "label": "Assessment Complete", "stateType": "intermediate", "sortOrder": 80},
      {"key": "committee_review", "label": "Committee Review", "stateType": "intermediate", "sortOrder": 90},
      {"key": "accepted", "label": "Accepted", "stateType": "terminal", "sortOrder": 100},
      {"key": "waitlisted", "label": "Waitlisted", "stateType": "terminal", "sortOrder": 110},
      {"key": "declined", "label": "Declined", "stateType": "terminal", "sortOrder": 120},
      {"key": "enrollment_complete", "label": "Enrollment Complete", "stateType": "terminal", "sortOrder": 130}
    ],
    "transitions": [],
    "triggers": [
      {"key": "manual", "label": "Manual", "triggerType": "manual"},
      {"key": "stage_change", "label": "Stage Change", "triggerType": "event", "eventKey": "admissions.stage_changed"}
    ]
  }'::jsonb,
  'inquiry',
  now()
from public.platform_workflow_definitions d
where d.workflow_key = 'admissions_case_pipeline'
  and d.school_id is null
  and not exists (
    select 1
    from public.platform_workflow_versions v
    where v.definition_id = d.id
      and v.version_number = 1
  );
