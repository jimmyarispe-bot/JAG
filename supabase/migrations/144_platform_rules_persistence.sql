-- =========================================
-- B-10 PHASE 1: THE JAG RULES ENGINE PERSISTENCE (144)
-- Wave 1 — canonical rule evaluation store
-- Idempotent: safe to re-run
-- =========================================

create table if not exists public.platform_rule_evaluation_records (
  id uuid primary key default gen_random_uuid(),
  evaluation_id text not null,
  rule_set_key text not null,
  domain text not null,
  evaluation_mode text not null
    check (evaluation_mode in ('first_match', 'all_match', 'weighted')),
  entity_type text,
  entity_id text,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  summary text not null default '',
  facts jsonb not null default '{}'::jsonb,
  matched_rule_keys text[] not null default '{}'::text[],
  primary_outcome_key text,
  outcome_effects jsonb,
  rule_results jsonb not null default '[]'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  result jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint platform_rule_evaluation_records_evaluation_id_key unique (evaluation_id)
);

create index if not exists idx_platform_rule_eval_rule_set_time
  on public.platform_rule_evaluation_records(rule_set_key, evaluated_at desc);

create index if not exists idx_platform_rule_eval_domain_time
  on public.platform_rule_evaluation_records(domain, evaluated_at desc);

create index if not exists idx_platform_rule_eval_entity
  on public.platform_rule_evaluation_records(entity_type, entity_id, evaluated_at desc)
  where entity_type is not null and entity_id is not null;

create index if not exists idx_platform_rule_eval_school
  on public.platform_rule_evaluation_records(school_id, evaluated_at desc)
  where school_id is not null;

create index if not exists idx_platform_rule_eval_evaluated
  on public.platform_rule_evaluation_records(evaluated_at desc);

notify pgrst, 'reload schema';
