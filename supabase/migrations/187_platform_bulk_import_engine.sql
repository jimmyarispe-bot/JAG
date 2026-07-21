-- =========================================
-- RC1: Platform Bulk Import Engine
-- Entity-agnostic import jobs, rows, and rollback transactions
-- =========================================

create table if not exists public.platform_import_jobs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  status text not null default 'uploaded'
    check (status in (
      'uploaded','configured','mapped','validated','preview',
      'importing','completed','failed','rolled_back'
    )),
  source_format text not null default 'csv'
    check (source_format in ('csv','xlsx','xls','google_sheets')),
  file_name text not null,
  file_size_bytes bigint not null default 0,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  program text,
  school_year_id uuid references public.school_years(id) on delete set null,
  import_mode text not null default 'create_only'
    check (import_mode in (
      'create_only','update_existing','skip_duplicates','merge_duplicates','ask_during_preview'
    )),
  mappings jsonb not null default '[]'::jsonb,
  counts jsonb not null default '{}'::jsonb,
  duration_ms integer,
  imported_by uuid references public.users(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  raw_headers jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.platform_import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.platform_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null default '{}'::jsonb,
  mapped_data jsonb,
  status text not null default 'pending',
  issues jsonb not null default '[]'::jsonb,
  preview_action text,
  target_entity_id uuid,
  family_group_key text,
  created_at timestamptz not null default now(),
  unique (job_id, row_number)
);

create table if not exists public.platform_import_transactions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.platform_import_jobs(id) on delete cascade,
  row_id uuid references public.platform_import_rows(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null default 'created'
    check (action in ('created','updated','linked')),
  rolled_back boolean not null default false,
  rolled_back_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_import_jobs_started
  on public.platform_import_jobs(started_at desc);
create index if not exists idx_platform_import_jobs_school
  on public.platform_import_jobs(school_id, started_at desc);
create index if not exists idx_platform_import_jobs_org
  on public.platform_import_jobs(organization_id, started_at desc);
create index if not exists idx_platform_import_rows_job
  on public.platform_import_rows(job_id, row_number);
create index if not exists idx_platform_import_tx_job
  on public.platform_import_transactions(job_id, created_at desc);

alter table public.platform_import_jobs enable row level security;
alter table public.platform_import_rows enable row level security;
alter table public.platform_import_transactions enable row level security;

-- Staff with students.edit (via role helpers) or enterprise admins can manage imports.
-- School-scoped users only see jobs for accessible schools.

drop policy if exists platform_import_jobs_select on public.platform_import_jobs;
create policy platform_import_jobs_select on public.platform_import_jobs
  for select to authenticated
  using (
    public.has_role('CEO')
    or public.has_role('FOUNDER')
    or public.has_role('EXECUTIVE_DIRECTOR')
    or public.has_role('ADMISSIONS')
    or (
      public.has_role('SCHOOL_LEADER')
      and (
        school_id is null
        or public.can_access_school(school_id)
      )
    )
  );

drop policy if exists platform_import_jobs_insert on public.platform_import_jobs;
create policy platform_import_jobs_insert on public.platform_import_jobs
  for insert to authenticated
  with check (
    public.has_role('CEO')
    or public.has_role('FOUNDER')
    or public.has_role('EXECUTIVE_DIRECTOR')
    or public.has_role('ADMISSIONS')
    or public.has_role('SCHOOL_LEADER')
  );

drop policy if exists platform_import_jobs_update on public.platform_import_jobs;
create policy platform_import_jobs_update on public.platform_import_jobs
  for update to authenticated
  using (
    public.has_role('CEO')
    or public.has_role('FOUNDER')
    or public.has_role('EXECUTIVE_DIRECTOR')
    or public.has_role('ADMISSIONS')
    or (
      public.has_role('SCHOOL_LEADER')
      and (school_id is null or public.can_access_school(school_id))
    )
  );

drop policy if exists platform_import_rows_all on public.platform_import_rows;
create policy platform_import_rows_all on public.platform_import_rows
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_import_jobs j
      where j.id = job_id
        and (
          public.has_role('CEO')
          or public.has_role('FOUNDER')
          or public.has_role('EXECUTIVE_DIRECTOR')
          or public.has_role('ADMISSIONS')
          or (
            public.has_role('SCHOOL_LEADER')
            and (j.school_id is null or public.can_access_school(j.school_id))
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_import_jobs j
      where j.id = job_id
        and (
          public.has_role('CEO')
          or public.has_role('FOUNDER')
          or public.has_role('EXECUTIVE_DIRECTOR')
          or public.has_role('ADMISSIONS')
          or public.has_role('SCHOOL_LEADER')
        )
    )
  );

drop policy if exists platform_import_tx_all on public.platform_import_transactions;
create policy platform_import_tx_all on public.platform_import_transactions
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_import_jobs j
      where j.id = job_id
        and (
          public.has_role('CEO')
          or public.has_role('FOUNDER')
          or public.has_role('EXECUTIVE_DIRECTOR')
          or public.has_role('ADMISSIONS')
          or (
            public.has_role('SCHOOL_LEADER')
            and (j.school_id is null or public.can_access_school(j.school_id))
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_import_jobs j
      where j.id = job_id
        and (
          public.has_role('CEO')
          or public.has_role('FOUNDER')
          or public.has_role('EXECUTIVE_DIRECTOR')
          or public.has_role('ADMISSIONS')
          or public.has_role('SCHOOL_LEADER')
        )
    )
  );

grant select, insert, update, delete on public.platform_import_jobs to authenticated;
grant select, insert, update, delete on public.platform_import_rows to authenticated;
grant select, insert, update, delete on public.platform_import_transactions to authenticated;
