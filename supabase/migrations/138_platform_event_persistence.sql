-- =========================================
-- B-06 PHASE 2: PLATFORM EVENT ENGINE PERSISTENCE (138)
-- Wave 1 — canonical event store for replay, audit, and intelligence graph
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. PLATFORM EVENT RECORDS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_event_records (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  audit_id text,
  event_type text not null,
  domain text not null,
  dispatch_mode text not null
    check (dispatch_mode in ('sync', 'async')),
  scope text not null
    check (scope in ('internal', 'external_webhook')),
  entity_type text not null,
  entity_id text not null,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  correlation_id text not null,
  causation_id text,
  envelope_version integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  envelope jsonb not null,
  subscriber_results jsonb not null default '[]'::jsonb,
  summary text not null default '',
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint platform_event_records_event_id_key unique (event_id)
);

create index if not exists idx_platform_event_records_type_time
  on public.platform_event_records(event_type, occurred_at desc);

create index if not exists idx_platform_event_records_entity
  on public.platform_event_records(entity_type, entity_id, occurred_at desc);

create index if not exists idx_platform_event_records_correlation
  on public.platform_event_records(correlation_id, occurred_at desc);

create index if not exists idx_platform_event_records_school
  on public.platform_event_records(school_id, occurred_at desc)
  where school_id is not null;

create index if not exists idx_platform_event_records_org
  on public.platform_event_records(organization_id, occurred_at desc)
  where organization_id is not null;

create index if not exists idx_platform_event_records_occurred
  on public.platform_event_records(occurred_at desc);

notify pgrst, 'reload schema';
