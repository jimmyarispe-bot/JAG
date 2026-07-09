-- =========================================
-- B-05 PHASE 2: PLATFORM DECISION ENGINE PERSISTENCE (140)
-- Wave 1 — canonical decision store for audit, replay, and intelligence graph
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. PLATFORM DECISION RECORDS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_decision_records (
  id uuid primary key default gen_random_uuid(),
  execution_id text not null,
  decision_type text not null,
  domain text not null,
  engine_mode text not null
    check (engine_mode in ('rule', 'ai_assisted', 'hybrid')),
  entity_type text,
  entity_id text,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  summary text not null default '',
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null,
  collected_evidence jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  confidence jsonb not null default '{}'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  executed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint platform_decision_records_execution_id_key unique (execution_id)
);

create index if not exists idx_platform_decision_records_type_time
  on public.platform_decision_records(decision_type, executed_at desc);

create index if not exists idx_platform_decision_records_entity
  on public.platform_decision_records(entity_type, entity_id, executed_at desc)
  where entity_type is not null and entity_id is not null;

create index if not exists idx_platform_decision_records_school
  on public.platform_decision_records(school_id, executed_at desc)
  where school_id is not null;

create index if not exists idx_platform_decision_records_org
  on public.platform_decision_records(organization_id, executed_at desc)
  where organization_id is not null;

create index if not exists idx_platform_decision_records_executed
  on public.platform_decision_records(executed_at desc);

notify pgrst, 'reload schema';
