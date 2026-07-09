-- =========================================
-- B-09 PHASE 1: KNOWLEDGE & EVIDENCE ENGINE (KEE) PERSISTENCE (142)
-- Wave 1 — canonical evidence store per Evidence Standard (Doc 27)
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. PLATFORM EVIDENCE RECORDS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_evidence_records (
  id uuid primary key default gen_random_uuid(),
  evidence_type_key text not null,
  skill_keys text[] not null default '{}'::text[],
  competency_keys text[] not null default '{}'::text[],
  student_id uuid not null references public.students(id) on delete cascade,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  captured_at timestamptz not null,
  captured_by_role text not null
    check (captured_by_role in ('teacher', 'student', 'parent', 'system', 'ai', 'mentor')),
  captured_by_user_id uuid references public.users(id) on delete set null,
  source_context jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  jurisdiction_keys text[] not null default '{}'::text[],
  artifact_refs jsonb not null default '[]'::jsonb,
  scores jsonb not null default '[]'::jsonb,
  narrative text,
  accommodations_applied text[] not null default '{}'::text[],
  evidence_confidence numeric(4, 3) not null
    check (evidence_confidence >= 0 and evidence_confidence <= 1),
  evidence_quality numeric(4, 3) not null
    check (evidence_quality >= 0 and evidence_quality <= 1),
  expires_at timestamptz,
  relationships jsonb not null default '[]'::jsonb,
  supersedes_evidence_id uuid references public.platform_evidence_records(id) on delete set null,
  ai_assisted boolean not null default false,
  ai_validation_status text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'superseded', 'expired')),
  recorded_at timestamptz not null default now(),
  constraint platform_evidence_records_linkage_check check (
    cardinality(skill_keys) > 0 or cardinality(competency_keys) > 0
  )
);

create index if not exists idx_platform_evidence_records_student_time
  on public.platform_evidence_records(student_id, captured_at desc);

create index if not exists idx_platform_evidence_records_type_time
  on public.platform_evidence_records(evidence_type_key, captured_at desc);

create index if not exists idx_platform_evidence_records_school
  on public.platform_evidence_records(school_id, captured_at desc)
  where school_id is not null;

create index if not exists idx_platform_evidence_records_competency
  on public.platform_evidence_records using gin (competency_keys);

create index if not exists idx_platform_evidence_records_skill
  on public.platform_evidence_records using gin (skill_keys);

create index if not exists idx_platform_evidence_records_status
  on public.platform_evidence_records(status, captured_at desc);

notify pgrst, 'reload schema';
