-- =========================================
-- RC6: Document & Records Management Platform
-- First-class documents with versions, relations,
-- templates, and e-signature extension readiness
-- =========================================

create table if not exists public.platform_documents (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'other'
    check (category in (
      'admissions', 'enrollment', 'medical', 'iep', 'evaluation', 'behavior',
      'scholarship', 'billing', 'financial', 'employee', 'hr', 'contracts',
      'policies', 'meeting_notes', 'communications', 'other'
    )),
  document_type text not null default 'file',
  status text not null default 'active'
    check (status in ('draft', 'active', 'pending_review', 'approved', 'rejected', 'archived')),
  current_version integer not null default 1,
  mime_type text,
  file_name text,
  storage_path text,
  file_url text,
  file_size_bytes bigint,
  tags text[] not null default '{}',
  owner_user_id uuid references public.users(id) on delete set null,
  uploaded_by uuid references public.users(id) on delete set null,
  template_id uuid,
  workflow_id uuid,
  requires_signature boolean not null default false,
  signature_status text
    check (signature_status is null or signature_status in (
      'none', 'requested', 'partial', 'completed', 'declined', 'expired'
    )),
  signature_provider text,
  signature_external_id text,
  policy_locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_platform_documents_school_status
  on public.platform_documents(school_id, status, updated_at desc);
create index if not exists idx_platform_documents_category
  on public.platform_documents(category, created_at desc);
create index if not exists idx_platform_documents_owner
  on public.platform_documents(owner_user_id);
create index if not exists idx_platform_documents_tags
  on public.platform_documents using gin(tags);

create table if not exists public.platform_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.platform_documents(id) on delete cascade,
  version_number integer not null,
  title text not null,
  description text not null default '',
  mime_type text,
  file_name text,
  storage_path text,
  file_url text,
  file_size_bytes bigint,
  change_summary text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists idx_platform_document_versions_doc
  on public.platform_document_versions(document_id, version_number desc);

create table if not exists public.platform_document_relations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.platform_documents(id) on delete cascade,
  entity_type text not null
    check (entity_type in (
      'student', 'family', 'employee', 'school', 'workflow',
      'scholarship', 'invoice', 'meeting', 'communication', 'other'
    )),
  entity_id uuid not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (document_id, entity_type, entity_id)
);

create index if not exists idx_platform_document_relations_entity
  on public.platform_document_relations(entity_type, entity_id);
create index if not exists idx_platform_document_relations_doc
  on public.platform_document_relations(document_id);

create table if not exists public.platform_document_templates (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  name text not null,
  description text not null default '',
  category text not null default 'other',
  template_key text not null,
  body_text text,
  file_url text,
  mime_type text,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_key)
);

create index if not exists idx_platform_document_templates_active
  on public.platform_document_templates(organization_id, is_active);

alter table public.platform_documents
  drop constraint if exists platform_documents_template_id_fkey;
alter table public.platform_documents
  add constraint platform_documents_template_id_fkey
  foreign key (template_id) references public.platform_document_templates(id) on delete set null;

-- Seed common templates
insert into public.platform_document_templates (
  organization_id, name, description, category, template_key, body_text
)
select
  o.id,
  t.name,
  t.description,
  t.category,
  t.template_key,
  t.body_text
from public.org_organizations o
cross join (
  values
    ('Enrollment Agreement', 'Standard enrollment agreement', 'enrollment', 'enrollment_agreement', 'Enrollment Agreement for {{StudentName}}'),
    ('Scholarship Form', 'Scholarship application form', 'scholarship', 'scholarship_form', 'Scholarship Form'),
    ('Behavior Report', 'Student behavior report', 'behavior', 'behavior_report', 'Behavior Report'),
    ('Medical Authorization', 'Medical treatment authorization', 'medical', 'medical_authorization', 'Medical Authorization'),
    ('Employment Contract', 'Employee contract template', 'employee', 'employment_contract', 'Employment Contract'),
    ('Incident Report', 'Incident documentation', 'other', 'incident_report', 'Incident Report'),
    ('IEP Cover Sheet', 'IEP cover sheet', 'iep', 'iep_cover_sheet', 'IEP Cover Sheet')
) as t(name, description, category, template_key, body_text)
where not exists (
  select 1 from public.platform_document_templates existing
  where existing.organization_id = o.id and existing.template_key = t.template_key
);

alter table public.platform_documents enable row level security;
alter table public.platform_document_versions enable row level security;
alter table public.platform_document_relations enable row level security;
alter table public.platform_document_templates enable row level security;

drop policy if exists platform_documents_staff on public.platform_documents;
create policy platform_documents_staff on public.platform_documents
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_document_versions_staff on public.platform_document_versions;
create policy platform_document_versions_staff on public.platform_document_versions
  for all using (
    exists (
      select 1 from public.platform_documents d
      where d.id = document_id
        and (d.school_id is null or public.can_access_school(d.school_id))
    )
  ) with check (
    exists (
      select 1 from public.platform_documents d
      where d.id = document_id
        and (d.school_id is null or public.can_access_school(d.school_id))
    )
  );

drop policy if exists platform_document_relations_staff on public.platform_document_relations;
create policy platform_document_relations_staff on public.platform_document_relations
  for all using (
    exists (
      select 1 from public.platform_documents d
      where d.id = document_id
        and (d.school_id is null or public.can_access_school(d.school_id))
    )
  ) with check (
    exists (
      select 1 from public.platform_documents d
      where d.id = document_id
        and (d.school_id is null or public.can_access_school(d.school_id))
    )
  );

drop policy if exists platform_document_templates_staff on public.platform_document_templates;
create policy platform_document_templates_staff on public.platform_document_templates
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );
