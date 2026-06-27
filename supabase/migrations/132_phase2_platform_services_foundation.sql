-- =========================================
-- PHASE 2: PLATFORM SERVICES FOUNDATION (132)
-- Activity Engine, Relationship Engine, Tagging, Notes
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. GLOBAL ACTIVITY ENGINE
-- ---------------------------------------------------------------------------

create table if not exists public.platform_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  module_key text not null,
  event_type text not null,
  event_version text not null default '1.0',
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  summary text not null default '',
  body text not null default '',
  actor_user_id uuid references public.users(id) on delete set null,
  actor_type text not null default 'user'
    check (actor_type in ('user', 'system', 'automation', 'integration')),
  occurred_at timestamptz not null default now(),
  student_id uuid references public.students(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  classification text not null default 'operational'
    check (classification in ('operational', 'communication', 'audit', 'system')),
  visibility text not null default 'staff'
    check (visibility in ('staff', 'parent', 'student', 'internal')),
  severity text check (severity in ('info', 'warning', 'critical')),
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  source_table text,
  source_id uuid,
  searchable_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_activity_student
  on public.platform_activity_events(student_id, occurred_at desc)
  where student_id is not null;

create index if not exists idx_platform_activity_entity
  on public.platform_activity_events(entity_type, entity_id, occurred_at desc);

create index if not exists idx_platform_activity_org
  on public.platform_activity_events(organization_id, occurred_at desc)
  where organization_id is not null;

create index if not exists idx_platform_activity_school
  on public.platform_activity_events(school_id, occurred_at desc)
  where school_id is not null;

create index if not exists idx_platform_activity_classification
  on public.platform_activity_events(classification, occurred_at desc);

create index if not exists idx_platform_activity_search
  on public.platform_activity_events using gin (to_tsvector('english', coalesce(searchable_text, '')));

-- ---------------------------------------------------------------------------
-- 2. PLATFORM RELATIONSHIP ENGINE
-- ---------------------------------------------------------------------------

create table if not exists public.platform_relationship_type_definitions (
  type_key text primary key,
  label text not null,
  from_entity_type text not null,
  to_entity_type text not null,
  description text,
  is_system boolean not null default true,
  sort_order integer not null default 0
);

insert into public.platform_relationship_type_definitions
  (type_key, label, from_entity_type, to_entity_type, description, sort_order)
values
  ('student.family', 'Student → Family', 'student', 'family', 'Primary family unit', 10),
  ('student.guardian', 'Student → Guardian', 'student', 'guardian', 'Legal or custodial guardian', 20),
  ('student.school', 'Student → School', 'student', 'school', 'Enrollment school', 30),
  ('student.campus', 'Student → Campus', 'student', 'campus', 'Physical or primary campus', 40),
  ('student.teacher', 'Student → Teacher', 'student', 'employee', 'Assigned classroom teacher', 50),
  ('student.advisor', 'Student → Advisor', 'student', 'employee', 'Academic or success advisor', 60),
  ('student.therapist', 'Student → Therapist', 'student', 'employee', 'Therapy provider', 70),
  ('student.case_manager', 'Student → Case Manager', 'student', 'employee', 'Case manager or social worker', 80),
  ('student.transportation_route', 'Student → Transportation Route', 'student', 'transportation_route', 'Assigned route', 90),
  ('student.scholarship', 'Student → Scholarship', 'student', 'scholarship', 'Scholarship award', 100),
  ('student.grant', 'Student → Grant', 'student', 'grant', 'Grant funding', 110),
  ('student.document', 'Student → Document', 'student', 'document', 'Linked document', 120),
  ('student.enrollment', 'Student → Enrollment', 'student', 'enrollment', 'Program enrollment record', 130),
  ('student.class', 'Student → Class', 'student', 'class', 'Class or section enrollment', 140),
  ('student.assessment', 'Student → Assessment', 'student', 'assessment', 'Assessment record', 150),
  ('employee.school', 'Employee → School', 'employee', 'school', 'Primary school assignment', 200),
  ('employee.department', 'Employee → Department', 'employee', 'department', 'Department membership', 210),
  ('employee.supervisor', 'Employee → Supervisor', 'employee', 'employee', 'Reporting relationship', 220),
  ('school.organization', 'School → Organization', 'school', 'organization', 'Org hierarchy', 300),
  ('school.campus', 'School → Campus', 'school', 'campus', 'Campus under school', 310)
on conflict (type_key) do update set
  label = excluded.label,
  from_entity_type = excluded.from_entity_type,
  to_entity_type = excluded.to_entity_type,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.platform_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  relationship_type text not null references public.platform_relationship_type_definitions(type_key),
  from_entity_type text not null,
  from_entity_id uuid not null,
  to_entity_type text not null,
  to_entity_id uuid not null,
  is_primary boolean not null default false,
  effective_date date,
  end_date date,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'ended', 'pending')),
  source text not null default 'manual'
    check (source in ('manual', 'automation', 'import', 'integration', 'migration')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_relationships_from
  on public.platform_relationships(from_entity_type, from_entity_id, status);

create index if not exists idx_platform_relationships_to
  on public.platform_relationships(to_entity_type, to_entity_id, status);

create index if not exists idx_platform_relationships_org
  on public.platform_relationships(organization_id, relationship_type);

create index if not exists idx_platform_relationships_student_guardian
  on public.platform_relationships(from_entity_id, relationship_type)
  where from_entity_type = 'student' and relationship_type = 'student.guardian';

drop trigger if exists platform_relationships_set_updated_at on public.platform_relationships;
create trigger platform_relationships_set_updated_at
  before update on public.platform_relationships
  for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. UNIVERSAL TAGGING SYSTEM
-- ---------------------------------------------------------------------------

create table if not exists public.platform_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  slug text not null,
  label text not null,
  category text not null default 'custom'
    check (category in (
      'priority', 'medical', 'learning', 'funding', 'program', 'demographic', 'compliance', 'custom'
    )),
  color text not null default 'slate',
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists idx_platform_tags_org_category
  on public.platform_tags(organization_id, category, sort_order);

drop trigger if exists platform_tags_set_updated_at on public.platform_tags;
create trigger platform_tags_set_updated_at
  before update on public.platform_tags
  for each row execute function public.trigger_set_updated_at();

create table if not exists public.platform_entity_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  tag_id uuid not null references public.platform_tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  applied_by uuid references public.users(id) on delete set null,
  applied_at timestamptz not null default now(),
  source text not null default 'manual'
    check (source in ('manual', 'automation', 'import', 'integration')),
  expires_at timestamptz,
  unique (organization_id, tag_id, entity_type, entity_id)
);

create index if not exists idx_platform_entity_tags_entity
  on public.platform_entity_tags(entity_type, entity_id);

create index if not exists idx_platform_entity_tags_tag
  on public.platform_entity_tags(tag_id);

-- Seed system tags for each existing organization
insert into public.platform_tags (organization_id, slug, label, category, color, is_system, sort_order)
select o.id, v.slug, v.label, v.category, v.color, true, v.sort_order
from public.org_organizations o
cross join (values
  ('high-priority', 'High Priority', 'priority', 'rose', 10),
  ('watch-list', 'Watch List', 'priority', 'amber', 20),
  ('medicaid', 'Medicaid', 'medical', 'sky', 30),
  ('autism', 'Autism', 'learning', 'indigo', 40),
  ('dyslexia', 'Dyslexia', 'learning', 'indigo', 50),
  ('iep', 'IEP', 'learning', 'brand', 60),
  ('504', '504', 'learning', 'brand', 70),
  ('esa', 'ESA', 'funding', 'emerald', 80),
  ('grant-funded', 'Grant Funded', 'funding', 'emerald', 90),
  ('boarding', 'Boarding', 'program', 'slate', 100),
  ('virtual', 'Virtual', 'program', 'slate', 110),
  ('hybrid', 'Hybrid', 'program', 'slate', 120),
  ('international', 'International', 'demographic', 'slate', 130)
) as v(slug, label, category, color, sort_order)
on conflict (organization_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- 4. GLOBAL NOTES SYSTEM
-- ---------------------------------------------------------------------------

create table if not exists public.platform_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  student_id uuid references public.students(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  body text not null,
  category text not null default 'general'
    check (category in (
      'general', 'academic', 'behavior', 'medical', 'family', 'financial', 'compliance', 'internal'
    )),
  is_pinned boolean not null default false,
  author_user_id uuid not null references public.users(id) on delete set null,
  visibility text not null default 'staff'
    check (visibility in ('staff', 'restricted', 'leadership', 'parent_visible')),
  mentioned_user_ids uuid[] not null default '{}'::uuid[],
  attachments jsonb not null default '[]'::jsonb,
  source text not null default 'manual'
    check (source in ('manual', 'import', 'integration', 'migration')),
  metadata jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_notes_entity
  on public.platform_notes(entity_type, entity_id, is_deleted, created_at desc);

create index if not exists idx_platform_notes_student
  on public.platform_notes(student_id, is_deleted, is_pinned desc, created_at desc)
  where student_id is not null;

drop trigger if exists platform_notes_set_updated_at on public.platform_notes;
create trigger platform_notes_set_updated_at
  before update on public.platform_notes
  for each row execute function public.trigger_set_updated_at();

create table if not exists public.platform_note_visibility_grants (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.platform_notes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  unique (note_id, user_id)
);

create index if not exists idx_platform_note_visibility_grants_note
  on public.platform_note_visibility_grants(note_id);

notify pgrst, 'reload schema';
