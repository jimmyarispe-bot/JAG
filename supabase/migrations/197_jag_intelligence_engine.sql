-- =========================================
-- RC10: JAG Intelligence Engine
-- Central insight registry, decision feedback,
-- prompts/policies, observability metrics
-- =========================================

create table if not exists public.jag_insights (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  category text not null
    check (category in (
      'risk', 'opportunity', 'anomaly', 'prediction', 'recommendation',
      'correlation', 'health', 'brief', 'context'
    )),
  title text not null,
  summary text not null default '',
  priority integer not null default 50,
  severity text not null default 'info'
    check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  confidence numeric(5, 4) not null default 0.5,
  data_quality numeric(5, 4) not null default 0.5,
  evidence_count integer not null default 0,
  freshness_score numeric(5, 4) not null default 0.5,
  explainability_score numeric(5, 4) not null default 0.5,
  explanation text not null default '',
  source_event_ids jsonb not null default '[]'::jsonb,
  related_entities jsonb not null default '[]'::jsonb,
  recommendation text,
  suggested_actions jsonb not null default '[]'::jsonb,
  status text not null default 'open'
    check (status in (
      'open', 'acknowledged', 'accepted', 'rejected', 'delegated',
      'completed', 'resolved', 'expired'
    )),
  resolution text,
  pipeline_run_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jag_insights_org_status
  on public.jag_insights(organization_id, status, priority desc);

create index if not exists idx_jag_insights_category
  on public.jag_insights(category, created_at desc);

create table if not exists public.jag_decision_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  insight_id uuid references public.jag_insights(id) on delete set null,
  founder_decision_id uuid,
  outcome text not null
    check (outcome in (
      'accepted', 'rejected', 'delegated', 'completed', 'ignored', 'partial'
    )),
  actual_impact text,
  notes text,
  recorded_by uuid references public.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_jag_decision_feedback_insight
  on public.jag_decision_feedback(insight_id, recorded_at desc);

create table if not exists public.jag_knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  relationship text not null,
  weight numeric(8, 4) not null default 1,
  explainability text,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, source_type, source_id, target_type, target_id, relationship)
);

create index if not exists idx_jag_knowledge_edges_source
  on public.jag_knowledge_edges(source_type, source_id);

create index if not exists idx_jag_knowledge_edges_target
  on public.jag_knowledge_edges(target_type, target_id);

create table if not exists public.jag_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists idx_jag_context_org
  on public.jag_context_snapshots(organization_id, captured_at desc);

create table if not exists public.jag_prompt_registry (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version integer not null default 1,
  kind text not null
    check (kind in ('system', 'domain', 'decision_policy', 'guardrail', 'response_template')),
  domain text,
  title text not null,
  body text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (key, version)
);

create table if not exists public.jag_pipeline_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  pipeline_run_id uuid not null,
  stage text not null,
  duration_ms integer not null default 0,
  queue_depth integer,
  error_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_jag_pipeline_metrics_run
  on public.jag_pipeline_metrics(pipeline_run_id, stage);

create table if not exists public.jag_learning_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  insight_id uuid references public.jag_insights(id) on delete set null,
  recommendation_id text,
  accepted boolean,
  ignored boolean,
  outcome text,
  actual_impact text,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- RLS
alter table public.jag_insights enable row level security;
alter table public.jag_decision_feedback enable row level security;
alter table public.jag_knowledge_edges enable row level security;
alter table public.jag_context_snapshots enable row level security;
alter table public.jag_prompt_registry enable row level security;
alter table public.jag_pipeline_metrics enable row level security;
alter table public.jag_learning_records enable row level security;

drop policy if exists jag_insights_access on public.jag_insights;
create policy jag_insights_access on public.jag_insights
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

drop policy if exists jag_decision_feedback_access on public.jag_decision_feedback;
create policy jag_decision_feedback_access on public.jag_decision_feedback
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

drop policy if exists jag_knowledge_edges_access on public.jag_knowledge_edges;
create policy jag_knowledge_edges_access on public.jag_knowledge_edges
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

drop policy if exists jag_context_snapshots_access on public.jag_context_snapshots;
create policy jag_context_snapshots_access on public.jag_context_snapshots
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

drop policy if exists jag_prompt_registry_access on public.jag_prompt_registry;
create policy jag_prompt_registry_access on public.jag_prompt_registry
  for all using (true) with check (true);

drop policy if exists jag_pipeline_metrics_access on public.jag_pipeline_metrics;
create policy jag_pipeline_metrics_access on public.jag_pipeline_metrics
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

drop policy if exists jag_learning_records_access on public.jag_learning_records;
create policy jag_learning_records_access on public.jag_learning_records
  for all using (
    organization_id is null or public.can_access_organization(organization_id)
  ) with check (
    organization_id is null or public.can_access_organization(organization_id)
  );

-- Seed baseline prompts / policies
insert into public.jag_prompt_registry (key, version, kind, domain, title, body, status)
values
  ('jag.system.core', 1, 'system', null, 'JAG System Core',
   'You are the JAG Intelligence Engine. Analyze organizational signals, cite evidence, never invent financial or student facts.',
   'active'),
  ('jag.domain.finance', 1, 'domain', 'finance', 'Finance Domain Prompt',
   'Focus on cash flow, invoices, scholarships, and collection risk. Prefer actionable recommendations.',
   'active'),
  ('jag.domain.hr', 1, 'domain', 'human_capital', 'HCM Domain Prompt',
   'Focus on staffing, certifications, onboarding, and capacity risk.',
   'active'),
  ('jag.policy.approval_required', 1, 'decision_policy', null, 'Approval Required',
   'Insights may not trigger workflows unless explicitly approved by Founder/CEO unless marked automatic.',
   'active'),
  ('jag.guardrail.no_pii_leak', 1, 'guardrail', null, 'PII Guardrail',
   'Do not expose student or family PII in executive summaries beyond role-appropriate scopes.',
   'active'),
  ('jag.template.insight', 1, 'response_template', null, 'Insight Template',
   'Title / Why / Evidence / Confidence / Suggested actions',
   'active')
on conflict (key, version) do nothing;
