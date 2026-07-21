-- =========================================
-- RC2: Family Management Platform
-- First-class family fields, status filters, archive columns
-- =========================================

-- Expand family status for Incomplete / Prospective filters
alter table public.families drop constraint if exists families_status_check;
alter table public.families
  add constraint families_status_check
  check (status in ('active', 'inactive', 'archived', 'incomplete', 'prospective'));

alter table public.families
  add column if not exists household_name text;

alter table public.families
  add column if not exists preferred_name text;

alter table public.families
  add column if not exists preferred_language text;

alter table public.families
  add column if not exists preferred_communication_method text;

alter table public.families
  add column if not exists timezone text;

alter table public.families
  add column if not exists notes text;

alter table public.families
  add column if not exists previous_status text;

alter table public.families
  add column if not exists archived_at timestamptz;

alter table public.families
  add column if not exists archived_by uuid references public.users(id) on delete set null;

-- Guardian management fields (idempotent)
alter table public.guardians
  add column if not exists employer text;

alter table public.guardians
  add column if not exists occupation text;

alter table public.guardians
  add column if not exists legal_guardian boolean not null default false;

alter table public.guardians
  add column if not exists lives_with_student boolean not null default false;

alter table public.guardians
  add column if not exists receives_emergency_alerts boolean not null default true;

alter table public.guardians
  add column if not exists portal_access_enabled boolean not null default false;

alter table public.guardians
  add column if not exists is_active boolean not null default true;

create index if not exists idx_families_status on public.families(status);
create index if not exists idx_families_school_status on public.families(school_id, status);
create index if not exists idx_families_name_trgm on public.families(family_name);

comment on column public.families.household_name is 'Optional household / preferred household label';
comment on column public.families.previous_status is 'Status prior to archive; used by restore';
