-- =========================================
-- WAVE 2: UNIVERSAL LEARNING REGISTRY (ULR) FOUNDATION (148)
-- Canonical learning model — single source of truth
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. LEARNING DOMAINS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_domains (
  id uuid primary key default gen_random_uuid(),
  domain_key text not null,
  domain_code text not null,
  title text not null,
  description text not null default '',
  version text not null default '1.0.0',
  status text not null default 'published'
    check (status in ('draft', 'published', 'deprecated', 'archived')),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_domains_domain_key_key unique (domain_key)
);

-- ---------------------------------------------------------------------------
-- 2. STRANDS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_strands (
  id uuid primary key default gen_random_uuid(),
  strand_key text not null,
  domain_key text not null references public.platform_ulr_domains(domain_key) on delete cascade,
  title text not null,
  description text not null default '',
  version text not null default '1.0.0',
  status text not null default 'published'
    check (status in ('draft', 'published', 'deprecated', 'archived')),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_strands_strand_key_key unique (strand_key)
);

create index if not exists idx_platform_ulr_strands_domain
  on public.platform_ulr_strands(domain_key, sort_order);

-- ---------------------------------------------------------------------------
-- 3. SUB-STRANDS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_sub_strands (
  id uuid primary key default gen_random_uuid(),
  sub_strand_key text not null,
  strand_key text not null references public.platform_ulr_strands(strand_key) on delete cascade,
  domain_key text not null references public.platform_ulr_domains(domain_key) on delete cascade,
  title text not null,
  description text not null default '',
  version text not null default '1.0.0',
  status text not null default 'published'
    check (status in ('draft', 'published', 'deprecated', 'archived')),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_sub_strands_sub_strand_key_key unique (sub_strand_key)
);

create index if not exists idx_platform_ulr_sub_strands_strand
  on public.platform_ulr_sub_strands(strand_key, sort_order);

-- ---------------------------------------------------------------------------
-- 4. COMPETENCIES
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_competencies (
  id uuid primary key default gen_random_uuid(),
  competency_key text not null,
  domain_key text not null references public.platform_ulr_domains(domain_key) on delete cascade,
  strand_key text not null references public.platform_ulr_strands(strand_key) on delete cascade,
  sub_strand_key text not null references public.platform_ulr_sub_strands(sub_strand_key) on delete cascade,
  title text not null,
  version text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'published', 'deprecated', 'archived')),
  definition jsonb not null,
  ai_metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published_at timestamptz,
  superseded_by text,
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_competencies_competency_key_key unique (competency_key)
);

create index if not exists idx_platform_ulr_competencies_domain
  on public.platform_ulr_competencies(domain_key, status, sort_order);

create index if not exists idx_platform_ulr_competencies_strand
  on public.platform_ulr_competencies(strand_key, status);

-- ---------------------------------------------------------------------------
-- 5. ATOMIC SKILLS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_atomic_skills (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null,
  competency_key text not null references public.platform_ulr_competencies(competency_key) on delete cascade,
  domain_key text not null references public.platform_ulr_domains(domain_key) on delete cascade,
  title text not null,
  version text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'deprecated', 'archived')),
  definition jsonb not null,
  ai_metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published_at timestamptz,
  superseded_by text,
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_atomic_skills_skill_key_key unique (skill_key)
);

create index if not exists idx_platform_ulr_atomic_skills_competency
  on public.platform_ulr_atomic_skills(competency_key, status, sort_order);

-- ---------------------------------------------------------------------------
-- 6. REGISTRY RELATIONSHIPS
-- ---------------------------------------------------------------------------

create table if not exists public.platform_ulr_relationships (
  id uuid primary key default gen_random_uuid(),
  relationship_type text not null,
  source_key text not null,
  source_kind text not null
    check (source_kind in ('domain', 'strand', 'sub_strand', 'competency', 'skill')),
  target_key text not null,
  target_kind text not null
    check (target_kind in ('domain', 'strand', 'sub_strand', 'competency', 'skill', 'evidence_type', 'assessment_method', 'resource', 'rule_set', 'decision_type')),
  weight numeric(8, 3) not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  recorded_at timestamptz not null default now(),
  constraint platform_ulr_relationships_unique_link
    unique (relationship_type, source_key, target_key)
);

create index if not exists idx_platform_ulr_relationships_source
  on public.platform_ulr_relationships(source_key, relationship_type)
  where status = 'active';

create index if not exists idx_platform_ulr_relationships_target
  on public.platform_ulr_relationships(target_key, relationship_type)
  where status = 'active';

notify pgrst, 'reload schema';
