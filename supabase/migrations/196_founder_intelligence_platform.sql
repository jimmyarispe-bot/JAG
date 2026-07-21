-- =========================================
-- RC9: Founder Intelligence Platform
-- Insights, decisions, memory, health snapshots
-- Consumes Executive Intelligence events; does not
-- duplicate operational module event generation.
-- =========================================

create table if not exists public.founder_insights (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  insight_type text not null
    check (insight_type in (
      'brief_item', 'health', 'risk', 'opportunity', 'prediction',
      'recommendation', 'correlation', 'priority'
    )),
  domain text not null default 'organization',
  title text not null,
  summary text not null default '',
  severity text not null default 'info'
    check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  priority integer not null default 50,
  probability numeric(5, 2),
  impact numeric(5, 2),
  confidence numeric(5, 2) not null default 0.7,
  score numeric(5, 2),
  trend text check (trend is null or trend in ('up', 'down', 'stable')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'acted', 'dismissed', 'resolved', 'expired')),
  explanation text not null default '',
  supporting_factors jsonb not null default '[]'::jsonb,
  related_event_ids jsonb not null default '[]'::jsonb,
  related_entities jsonb not null default '[]'::jsonb,
  suggested_actions jsonb not null default '[]'::jsonb,
  prediction_low numeric(14, 2),
  prediction_mid numeric(14, 2),
  prediction_high numeric(14, 2),
  prediction_unit text,
  payload jsonb not null default '{}'::jsonb,
  last_analyzed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_founder_insights_org
  on public.founder_insights(organization_id, insight_type, status, priority desc);

create index if not exists idx_founder_insights_severity
  on public.founder_insights(severity, last_analyzed_at desc);

create table if not exists public.founder_decisions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  insight_id uuid references public.founder_insights(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'pending'
    check (status in (
      'pending', 'approved', 'dismissed', 'delegated', 'scheduled', 'tracking', 'resolved'
    )),
  priority integer not null default 50,
  impact text,
  confidence numeric(5, 2) not null default 0.7,
  delegated_to text,
  scheduled_for timestamptz,
  resolution_notes text,
  related_entities jsonb not null default '[]'::jsonb,
  suggested_actions jsonb not null default '[]'::jsonb,
  workflow_trigger_key text,
  decided_by uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_founder_decisions_org
  on public.founder_decisions(organization_id, status, priority desc);

create table if not exists public.founder_memory_items (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  memory_type text not null
    check (memory_type in (
      'pinned_priority', 'strategic_initiative', 'long_term_goal',
      'delegated_item', 'open_decision', 'resolved_decision', 'note'
    )),
  title text not null,
  body text not null default '',
  status text not null default 'active'
    check (status in ('active', 'archived', 'completed')),
  related_decision_id uuid references public.founder_decisions(id) on delete set null,
  related_insight_id uuid references public.founder_insights(id) on delete set null,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_founder_memory_org
  on public.founder_memory_items(organization_id, memory_type, status);

create table if not exists public.founder_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  domain text not null,
  score numeric(5, 2) not null,
  trend text not null default 'stable'
    check (trend in ('up', 'down', 'stable')),
  confidence numeric(5, 2) not null default 0.7,
  factors jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists idx_founder_health_org
  on public.founder_health_snapshots(organization_id, domain, captured_at desc);

-- RLS
alter table public.founder_insights enable row level security;
alter table public.founder_decisions enable row level security;
alter table public.founder_memory_items enable row level security;
alter table public.founder_health_snapshots enable row level security;

drop policy if exists founder_insights_access on public.founder_insights;
create policy founder_insights_access on public.founder_insights
  for all using (
    organization_id is null
    or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null
    or public.can_access_organization(organization_id)
  );

drop policy if exists founder_decisions_access on public.founder_decisions;
create policy founder_decisions_access on public.founder_decisions
  for all using (
    organization_id is null
    or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null
    or public.can_access_organization(organization_id)
  );

drop policy if exists founder_memory_access on public.founder_memory_items;
create policy founder_memory_access on public.founder_memory_items
  for all using (
    organization_id is null
    or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null
    or public.can_access_organization(organization_id)
  );

drop policy if exists founder_health_access on public.founder_health_snapshots;
create policy founder_health_access on public.founder_health_snapshots
  for all using (
    organization_id is null
    or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null
    or public.can_access_organization(organization_id)
  );
