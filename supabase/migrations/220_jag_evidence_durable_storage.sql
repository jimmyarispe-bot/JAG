-- Sprint 220 — JAG Evidence Phase 1: durable storage foundation
-- Private bucket + org-scoped document/version tables + RLS.
-- Forward-only. Does not implement upload APIs or UI.
-- Does not modify platform_documents, admissions, student, or jag-learn-media buckets.
--
-- Access model:
--   - Bucket jag-evidence-documents is private (public = false).
--   - No authenticated storage.objects policies (signed URLs in Phase 2).
--   - Table RLS uses public.can_access_organization(organization_id)
--     (= user_can_access_organization(auth.uid(), organization_id)).
--   - Never uses school_id IS NULL as an access condition.

-- ---------------------------------------------------------------------------
-- 1) Private storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jag-evidence-documents',
  'jag-evidence-documents',
  false,
  20971520, -- 20 MiB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/plain'
  ]::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Explicitly drop any accidental open policies if re-applied.
drop policy if exists jag_evidence_documents_authenticated_all on storage.objects;
drop policy if exists jag_evidence_documents_authenticated_select on storage.objects;
drop policy if exists jag_evidence_documents_authenticated_insert on storage.objects;
drop policy if exists jag_evidence_documents_public_select on storage.objects;

-- No authenticated/anon SELECT/INSERT/UPDATE/DELETE policies on this bucket.
-- Service role (Phase 2 signed-URL minting) bypasses RLS.

-- ---------------------------------------------------------------------------
-- 2) Documents
-- ---------------------------------------------------------------------------
create table if not exists public.jag_evidence_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  name text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  storage_path text not null default '',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lifecycle_status text not null default 'UPLOADING'
    check (lifecycle_status in (
      'UPLOADING', 'UPLOADED', 'AVAILABLE', 'FAILED', 'ARCHIVED'
    )),
  current_version integer not null default 1 check (current_version >= 1),
  -- Evidence Center domain metadata
  domain text not null default 'General'
    check (domain in (
      'Financial Intelligence',
      'People Intelligence',
      'Operations Intelligence',
      'Governance Intelligence',
      'Academic Intelligence',
      'Technology Intelligence',
      'General'
    )),
  evidence_type text not null default 'Other'
    check (evidence_type in (
      'Financial Statement',
      'Bank Statement',
      'Budget',
      'Payroll',
      'Policy',
      'Procedure',
      'Board Minutes',
      'Contract',
      'Strategic Plan',
      'Research',
      'Presentation',
      'Spreadsheet',
      'Other'
    )),
  description text not null default '',
  tags text[] not null default '{}',
  reporting_period_kind text not null default 'Custom'
    check (reporting_period_kind in ('Monthly', 'Quarterly', 'Annual', 'Custom')),
  reporting_period_label text not null default '',
  business_unit text not null default 'Corporate',
  department text not null default '',
  location text not null default '',
  owner text not null default '',
  source text not null default 'Uploaded'
    check (source in (
      'Uploaded',
      'QuickBooks',
      'Google Workspace',
      'Microsoft 365',
      'Salesforce',
      'HubSpot',
      'Manual',
      'Other'
    )),
  confidentiality text not null default 'Internal'
    check (confidentiality in (
      'Public', 'Internal', 'Confidential', 'Highly Confidential'
    ))
);

create index if not exists idx_jag_evidence_documents_org_created
  on public.jag_evidence_documents(organization_id, created_at desc);

create index if not exists idx_jag_evidence_documents_org_lifecycle
  on public.jag_evidence_documents(organization_id, lifecycle_status);

create index if not exists idx_jag_evidence_documents_org_domain
  on public.jag_evidence_documents(organization_id, domain);

-- ---------------------------------------------------------------------------
-- 3) Versions (organization_id denormalized; must match parent document)
-- ---------------------------------------------------------------------------
create table if not exists public.jag_evidence_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.jag_evidence_documents(id) on delete cascade,
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  storage_path text not null default '',
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'UPLOADING'
    check (status in ('UPLOADING', 'UPLOADED', 'AVAILABLE', 'FAILED')),
  unique (document_id, version_number)
);

create index if not exists idx_jag_evidence_versions_doc
  on public.jag_evidence_document_versions(document_id, version_number desc);

create index if not exists idx_jag_evidence_versions_org
  on public.jag_evidence_document_versions(organization_id, created_at desc);

create or replace function public.jag_evidence_version_org_matches_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  doc_org uuid;
begin
  select d.organization_id into doc_org
  from public.jag_evidence_documents d
  where d.id = new.document_id;

  if doc_org is null then
    raise exception 'jag_evidence_document_versions: document % not found', new.document_id;
  end if;

  if new.organization_id is distinct from doc_org then
    raise exception
      'jag_evidence_document_versions: organization_id must match parent document';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jag_evidence_version_org_match
  on public.jag_evidence_document_versions;
create trigger trg_jag_evidence_version_org_match
  before insert or update of organization_id, document_id
  on public.jag_evidence_document_versions
  for each row
  execute function public.jag_evidence_version_org_matches_document();

-- ---------------------------------------------------------------------------
-- 4) RLS — organization scoped (no school_id IS NULL pattern)
-- ---------------------------------------------------------------------------
alter table public.jag_evidence_documents enable row level security;
alter table public.jag_evidence_document_versions enable row level security;

drop policy if exists jag_evidence_documents_select on public.jag_evidence_documents;
create policy jag_evidence_documents_select on public.jag_evidence_documents
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_documents_insert on public.jag_evidence_documents;
create policy jag_evidence_documents_insert on public.jag_evidence_documents
  for insert to authenticated
  with check (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_documents_update on public.jag_evidence_documents;
create policy jag_evidence_documents_update on public.jag_evidence_documents
  for update to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_documents_delete on public.jag_evidence_documents;
create policy jag_evidence_documents_delete on public.jag_evidence_documents
  for delete to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_versions_select on public.jag_evidence_document_versions;
create policy jag_evidence_versions_select on public.jag_evidence_document_versions
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_versions_insert on public.jag_evidence_document_versions;
create policy jag_evidence_versions_insert on public.jag_evidence_document_versions
  for insert to authenticated
  with check (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_versions_update on public.jag_evidence_document_versions;
create policy jag_evidence_versions_update on public.jag_evidence_document_versions
  for update to authenticated
  using (public.can_access_organization(organization_id))
  with check (public.can_access_organization(organization_id));

drop policy if exists jag_evidence_versions_delete on public.jag_evidence_document_versions;
create policy jag_evidence_versions_delete on public.jag_evidence_document_versions
  for delete to authenticated
  using (public.can_access_organization(organization_id));

comment on table public.jag_evidence_documents is
  'JAG Evidence Center durable documents. Org-scoped. Byte upload APIs land in Phase 2.';

comment on table public.jag_evidence_document_versions is
  'JAG Evidence document versions. organization_id must match parent document.';

comment on function public.jag_evidence_version_org_matches_document() is
  'Prevents version rows from referencing a different organization than their document.';
