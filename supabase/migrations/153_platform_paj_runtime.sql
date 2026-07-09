-- =========================================
-- PERSONAL LEARNING JOURNEY (PAJ) RUNTIME (153)
-- Doc 3 — Student Learning Journey Model
-- Idempotent: safe to re-run
-- =========================================

create table if not exists public.platform_paj_journeys (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  program_track text not null default 'virtual'
    check (program_track in ('virtual', 'hs', 'hybrid')),
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'transitioning')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_platform_paj_journeys_one_active_student
  on public.platform_paj_journeys(student_id)
  where status = 'active';

create index if not exists idx_platform_paj_journeys_student
  on public.platform_paj_journeys(student_id, created_at desc);

create table if not exists public.platform_paj_domain_enrollments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.platform_paj_journeys(id) on delete cascade,
  domain_key text not null,
  pathway_key text not null,
  library_key text not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  active_competency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_paj_domain_enrollments_journey_domain_key unique (journey_id, domain_key)
);

create index if not exists idx_platform_paj_domain_enrollments_journey
  on public.platform_paj_domain_enrollments(journey_id);

create table if not exists public.platform_paj_placements (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.platform_paj_journeys(id) on delete cascade,
  domain_key text not null,
  recommended_competency_key text not null,
  placed_competency_key text not null,
  placement_evidence_ids uuid[] not null default '{}'::uuid[],
  placed_by_user_id uuid references public.users(id) on delete set null,
  review_date timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_paj_placements_journey
  on public.platform_paj_placements(journey_id, created_at desc);

create table if not exists public.platform_paj_competency_progress (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.platform_paj_journeys(id) on delete cascade,
  domain_key text not null,
  competency_key text not null,
  mastery_level integer not null default 0
    check (mastery_level >= 0 and mastery_level <= 4),
  evidence_count integer not null default 0,
  evidence_type_keys text[] not null default '{}'::text[],
  last_evidence_id uuid,
  educator_confirmed_at timestamptz,
  educator_confirmed_by uuid references public.users(id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'proficient', 'review', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_paj_competency_progress_journey_competency_key unique (journey_id, competency_key)
);

create index if not exists idx_platform_paj_competency_progress_journey
  on public.platform_paj_competency_progress(journey_id, updated_at desc);

create index if not exists idx_platform_paj_competency_progress_competency
  on public.platform_paj_competency_progress(competency_key);

create table if not exists public.platform_paj_skill_progress (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.platform_paj_journeys(id) on delete cascade,
  competency_key text not null,
  skill_key text not null,
  mastery_level integer not null default 0
    check (mastery_level >= 0 and mastery_level <= 4),
  evidence_count integer not null default 0,
  last_evidence_id uuid,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'proficient', 'review', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_paj_skill_progress_journey_skill_key unique (journey_id, skill_key)
);

create index if not exists idx_platform_paj_skill_progress_journey
  on public.platform_paj_skill_progress(journey_id, competency_key);

notify pgrst, 'reload schema';
