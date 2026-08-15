-- Sprint 223 — Admissions Interest Form Phase 1
-- Organization-scoped published Interest Form + versioned submissions/answers.
-- Org-scoped public school listing + durable public eligibility on schools.
-- Forward-only. Does not change lead stages or email automation.

-- ---------------------------------------------------------------------------
-- 1) School public eligibility (durable; not name-based)
--    DEFAULT false: new schools are NOT publicly selectable until enabled.
--    schools has no lifecycle/status column; eligibility is explicit config.
-- ---------------------------------------------------------------------------
alter table public.schools
  add column if not exists admissions_interest_public boolean not null default false;

comment on column public.schools.admissions_interest_public is
  'When false, school is omitted from the public Express Interest form. Explicit config; not name-based. Default false (fail closed).';

-- If the column already existed from a prior attempt with a different default,
-- force the column default to false going forward.
alter table public.schools
  alter column admissions_interest_public set default false;

-- Safe initial state: all schools non-public, then explicitly enable known
-- active admissions campuses by durable seed UUID (056_phase1_org_seed).
-- Closed campuses (including any school not listed here) remain false.
update public.schools
set admissions_interest_public = false;

update public.schools
set admissions_interest_public = true
where id in (
  'a1000000-0000-4000-8000-000000000001', -- The Academy FL
  'a1000000-0000-4000-8000-000000000002', -- The Academy GA
  'a1000000-0000-4000-8000-000000000003', -- The Academy HS
  'a1000000-0000-4000-8000-000000000004'  -- Academy Virtual
);

-- ---------------------------------------------------------------------------
-- 2) Interest form header (one per organization)
-- ---------------------------------------------------------------------------
create table if not exists public.admissions_interest_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  title text not null default 'Express Interest',
  draft_version_id uuid null,
  published_version_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admissions_interest_forms_organization_unique unique (organization_id)
);

create index if not exists idx_admissions_interest_forms_org
  on public.admissions_interest_forms (organization_id);

-- ---------------------------------------------------------------------------
-- 3) Immutable versions (draft / published / archived)
-- ---------------------------------------------------------------------------
create table if not exists public.admissions_interest_form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.admissions_interest_forms(id) on delete cascade,
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  lifecycle text not null check (lifecycle in ('draft', 'published', 'archived')),
  schema_version text not null default 'interest_form.v1',
  definition jsonb not null,
  content_hash text not null,
  published_at timestamptz null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admissions_interest_form_versions_form_number_unique
    unique (form_id, version_number)
);

create unique index if not exists idx_admissions_interest_form_one_published
  on public.admissions_interest_form_versions (form_id)
  where lifecycle = 'published';

create index if not exists idx_admissions_interest_form_versions_org
  on public.admissions_interest_form_versions (organization_id);

alter table public.admissions_interest_forms
  drop constraint if exists admissions_interest_forms_published_version_fkey;
alter table public.admissions_interest_forms
  add constraint admissions_interest_forms_published_version_fkey
  foreign key (published_version_id)
  references public.admissions_interest_form_versions(id)
  on delete set null;

alter table public.admissions_interest_forms
  drop constraint if exists admissions_interest_forms_draft_version_fkey;
alter table public.admissions_interest_forms
  add constraint admissions_interest_forms_draft_version_fkey
  foreign key (draft_version_id)
  references public.admissions_interest_form_versions(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- 4) Submission header + answers
-- ---------------------------------------------------------------------------
create table if not exists public.admissions_interest_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  lead_id uuid not null references public.admissions_leads(id) on delete cascade,
  form_id uuid not null references public.admissions_interest_forms(id) on delete restrict,
  form_version_id uuid not null references public.admissions_interest_form_versions(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  source text null,
  referral_source text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admissions_interest_submissions_org
  on public.admissions_interest_submissions (organization_id);
create index if not exists idx_admissions_interest_submissions_lead
  on public.admissions_interest_submissions (lead_id);
create index if not exists idx_admissions_interest_submissions_version
  on public.admissions_interest_submissions (form_version_id);

create table if not exists public.admissions_interest_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.admissions_interest_submissions(id) on delete cascade,
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  form_version_id uuid not null references public.admissions_interest_form_versions(id) on delete restrict,
  question_key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  constraint admissions_interest_answers_submission_key_unique
    unique (submission_id, question_key)
);

create index if not exists idx_admissions_interest_answers_submission
  on public.admissions_interest_answers (submission_id);
create index if not exists idx_admissions_interest_answers_org
  on public.admissions_interest_answers (organization_id);

-- ---------------------------------------------------------------------------
-- 5) RLS — org staff read; writes via service role / SECURITY DEFINER only
-- ---------------------------------------------------------------------------
alter table public.admissions_interest_forms enable row level security;
alter table public.admissions_interest_form_versions enable row level security;
alter table public.admissions_interest_submissions enable row level security;
alter table public.admissions_interest_answers enable row level security;

drop policy if exists admissions_interest_forms_select on public.admissions_interest_forms;
create policy admissions_interest_forms_select
  on public.admissions_interest_forms
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists admissions_interest_form_versions_select on public.admissions_interest_form_versions;
create policy admissions_interest_form_versions_select
  on public.admissions_interest_form_versions
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists admissions_interest_submissions_select on public.admissions_interest_submissions;
create policy admissions_interest_submissions_select
  on public.admissions_interest_submissions
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists admissions_interest_answers_select on public.admissions_interest_answers;
create policy admissions_interest_answers_select
  on public.admissions_interest_answers
  for select to authenticated
  using (public.can_access_organization(organization_id));

-- No authenticated INSERT/UPDATE/DELETE — public submit uses service role after app authz.

-- ---------------------------------------------------------------------------
-- 5b) Published versions are immutable
-- ---------------------------------------------------------------------------
create or replace function public.admissions_interest_form_version_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.lifecycle = 'published' then
    if new.definition is distinct from old.definition
       or new.content_hash is distinct from old.content_hash
       or new.schema_version is distinct from old.schema_version
       or new.version_number is distinct from old.version_number
       or new.form_id is distinct from old.form_id
       or new.organization_id is distinct from old.organization_id
    then
      raise exception 'Published interest form versions are immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists admissions_interest_form_version_immutable_trg
  on public.admissions_interest_form_versions;
create trigger admissions_interest_form_version_immutable_trg
  before update on public.admissions_interest_form_versions
  for each row
  execute function public.admissions_interest_form_version_immutable();

-- ---------------------------------------------------------------------------
-- 6) Org-scoped public school list (replaces global listing)
-- ---------------------------------------------------------------------------
create or replace function public.list_schools_for_public_inquiry(p_organization_id uuid)
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name
  from public.schools s
  where s.organization_id = p_organization_id
    and s.admissions_interest_public is true
  order by s.name;
$$;

comment on function public.list_schools_for_public_inquiry(uuid) is
  'Anon-safe org-scoped school list for /apply. Only admissions_interest_public schools.';

revoke all on function public.list_schools_for_public_inquiry(uuid) from public;
grant execute on function public.list_schools_for_public_inquiry(uuid)
  to anon, authenticated, service_role;

-- Keep zero-arg overload for backward compatibility but return empty
-- (forces callers to migrate to org-scoped). Prefer not to leak all schools.
create or replace function public.list_schools_for_public_inquiry()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name
  from public.schools s
  where false;
$$;

revoke all on function public.list_schools_for_public_inquiry() from public;
grant execute on function public.list_schools_for_public_inquiry()
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7) Org-scoped public programs for a school
-- ---------------------------------------------------------------------------
create or replace function public.list_programs_for_public_inquiry(
  p_organization_id uuid,
  p_school_id uuid
)
returns table (code text, name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.code, p.name
  from public.org_programs p
  join public.schools s on s.id = p.school_id
  where s.organization_id = p_organization_id
    and s.id = p_school_id
    and s.admissions_interest_public is true
    and coalesce(p.status, 'active') = 'active'
  order by p.name;
$$;

revoke all on function public.list_programs_for_public_inquiry(uuid, uuid) from public;
grant execute on function public.list_programs_for_public_inquiry(uuid, uuid)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8) Seed published Interest Form for active orgs that have schools
--     Definition mirrors current ParentInquiryForm fields (no new questions).
-- ---------------------------------------------------------------------------
do $$
declare
  org record;
  form_id uuid;
  version_id uuid;
  definition jsonb;
  content_hash text;
begin
  definition := $json$
  {
    "schemaVersion": "interest_form.v1",
    "title": "Express Interest",
    "sections": [
      {
        "key": "student",
        "title": "Student Information",
        "description": "Tell us about the student you would like to enroll.",
        "order": 0,
        "questionKeys": [
          "first_name",
          "last_name",
          "preferred_name",
          "date_of_birth",
          "current_grade",
          "applying_for_grade"
        ]
      },
      {
        "key": "program_school",
        "title": "Program & School",
        "order": 1,
        "questionKeys": [
          "school_id",
          "program",
          "funding_sources",
          "referral_source",
          "learning_concerns"
        ]
      },
      {
        "key": "guardian",
        "title": "Parent / Guardian Contact",
        "description": "Use the email you will sign in with to access your admissions portal.",
        "order": 2,
        "questionKeys": [
          "guardian_first_name",
          "guardian_last_name",
          "guardian_email",
          "guardian_phone",
          "preferred_contact_method"
        ]
      }
    ],
    "questions": [
      {
        "key": "first_name",
        "type": "text",
        "label": "First Name",
        "required": true,
        "order": 0,
        "systemBinding": "lead.first_name"
      },
      {
        "key": "last_name",
        "type": "text",
        "label": "Last Name",
        "required": true,
        "order": 1,
        "systemBinding": "lead.last_name"
      },
      {
        "key": "preferred_name",
        "type": "text",
        "label": "Preferred Name",
        "required": false,
        "order": 2,
        "systemBinding": "lead.preferred_name"
      },
      {
        "key": "date_of_birth",
        "type": "date",
        "label": "Date of Birth",
        "required": false,
        "order": 3,
        "systemBinding": "lead.date_of_birth"
      },
      {
        "key": "current_grade",
        "type": "select",
        "label": "Current Grade",
        "required": false,
        "order": 4,
        "systemBinding": "lead.current_grade",
        "optionSource": "grades"
      },
      {
        "key": "applying_for_grade",
        "type": "select",
        "label": "Applying For Grade",
        "required": false,
        "order": 5,
        "systemBinding": "lead.applying_for_grade",
        "optionSource": "grades"
      },
      {
        "key": "school_id",
        "type": "school_selector",
        "label": "School",
        "required": true,
        "order": 6,
        "systemBinding": "lead.school_id"
      },
      {
        "key": "program",
        "type": "program_selector",
        "label": "Program",
        "required": false,
        "order": 7,
        "systemBinding": "lead.program"
      },
      {
        "key": "funding_sources",
        "type": "multiselect",
        "label": "Funding sources",
        "required": false,
        "order": 8,
        "systemBinding": "lead.funding_sources",
        "optionSource": "funding_sources"
      },
      {
        "key": "referral_source",
        "type": "text",
        "label": "Referral source",
        "required": false,
        "order": 9,
        "systemBinding": "lead.referral_source",
        "placeholder": "How did you hear about us?"
      },
      {
        "key": "learning_concerns",
        "type": "rich_text",
        "label": "Learning concerns",
        "required": false,
        "order": 10,
        "systemBinding": null,
        "placeholder": "Optional — learning, social, or support needs"
      },
      {
        "key": "guardian_first_name",
        "type": "text",
        "label": "First Name",
        "required": false,
        "order": 11,
        "systemBinding": "lead.guardian_first_name"
      },
      {
        "key": "guardian_last_name",
        "type": "text",
        "label": "Last Name",
        "required": false,
        "order": 12,
        "systemBinding": "lead.guardian_last_name"
      },
      {
        "key": "guardian_email",
        "type": "email",
        "label": "Email",
        "required": true,
        "order": 13,
        "systemBinding": "lead.guardian_email"
      },
      {
        "key": "guardian_phone",
        "type": "phone",
        "label": "Phone",
        "required": false,
        "order": 14,
        "systemBinding": "lead.guardian_phone"
      },
      {
        "key": "preferred_contact_method",
        "type": "select",
        "label": "Preferred contact method",
        "required": false,
        "order": 15,
        "systemBinding": null,
        "options": [
          { "value": "email", "label": "Email" },
          { "value": "phone", "label": "Phone" },
          { "value": "text", "label": "Text" }
        ],
        "defaultValue": "email"
      }
    ]
  }
  $json$::jsonb;

  content_hash := encode(sha256(convert_to(definition::text, 'UTF8')), 'hex');

  for org in
    select o.id
    from public.org_organizations o
    where o.status = 'active'
      and exists (
        select 1 from public.schools s where s.organization_id = o.id
      )
  loop
    if exists (
      select 1 from public.admissions_interest_forms f where f.organization_id = org.id
    ) then
      continue;
    end if;

    insert into public.admissions_interest_forms (organization_id, title)
    values (org.id, 'Express Interest')
    returning id into form_id;

    insert into public.admissions_interest_form_versions (
      form_id,
      organization_id,
      version_number,
      lifecycle,
      schema_version,
      definition,
      content_hash,
      published_at
    )
    values (
      form_id,
      org.id,
      1,
      'published',
      'interest_form.v1',
      definition,
      content_hash,
      now()
    )
    returning id into version_id;

    update public.admissions_interest_forms
    set published_version_id = version_id,
        updated_at = now()
    where id = form_id;
  end loop;
end $$;
