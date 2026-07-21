-- =========================================
-- RC8: Human Capital Management Platform
-- Lifecycle expansion, contracts, recognition,
-- assignments effective dates, HRIS readiness
-- =========================================

-- Expand employment lifecycle states
alter table public.employees drop constraint if exists employees_employment_status_check;
alter table public.employees
  add constraint employees_employment_status_check
  check (employment_status in (
    'applicant', 'interviewing', 'offer_extended', 'hired', 'onboarding',
    'active', 'leave_of_absence', 'on_leave', 'inactive', 'terminated', 'retired'
  ));

alter table public.employees
  add column if not exists audit_id uuid unique default gen_random_uuid();

alter table public.employees
  add column if not exists lifecycle_stage text
    check (lifecycle_stage is null or lifecycle_stage in (
      'applicant', 'interviewing', 'offer_extended', 'hired', 'onboarding',
      'active', 'leave_of_absence', 'inactive', 'terminated', 'retired'
    ));

alter table public.employees
  add column if not exists seniority_years numeric(5, 2);

alter table public.employees
  add column if not exists background_check_status text
    check (background_check_status is null or background_check_status in (
      'pending', 'in_progress', 'cleared', 'failed', 'expired'
    ));

alter table public.employees
  add column if not exists performance_rating text;

alter table public.employees
  add column if not exists archived_at timestamptz;

update public.employees
set lifecycle_stage = case
  when employment_status = 'on_leave' then 'leave_of_absence'
  when employment_status in (
    'applicant', 'interviewing', 'offer_extended', 'hired', 'onboarding',
    'active', 'leave_of_absence', 'inactive', 'terminated', 'retired'
  ) then employment_status
  else 'active'
end
where lifecycle_stage is null;

-- Profile expansions
alter table public.employee_profiles
  add column if not exists emergency_contact_relationship text;

alter table public.employee_profiles
  add column if not exists licenses_summary text;

-- Employment contracts (Document Management linked)
create table if not exists public.hr_employment_contracts (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  title text not null default 'Employment Contract',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'expiring', 'renewed', 'archived')),
  start_date date,
  end_date date,
  document_id uuid references public.platform_documents(id) on delete set null,
  employee_document_id uuid references public.employee_documents(id) on delete set null,
  renewal_of_id uuid references public.hr_employment_contracts(id) on delete set null,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_hr_employment_contracts_employee
  on public.hr_employment_contracts(employee_id, status);

-- Expand leave types for vacation / jury duty
alter table public.leave_requests drop constraint if exists leave_requests_leave_type_check;
alter table public.leave_requests
  add constraint leave_requests_leave_type_check
  check (leave_type in (
    'pto', 'vacation', 'sick', 'personal', 'bereavement',
    'jury_duty', 'fmla', 'unpaid', 'other'
  ));

-- Performance recognition / notes
create table if not exists public.hr_performance_notes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  note_type text not null default 'note'
    check (note_type in ('note', 'recognition', 'observation', 'improvement_plan')),
  title text not null,
  body text not null default '',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_hr_performance_notes_employee
  on public.hr_performance_notes(employee_id, created_at desc);

-- Multi-school / program / class assignments with effective dates
create table if not exists public.hr_employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  entity_type text not null
    check (entity_type in ('school', 'program', 'class', 'position')),
  entity_id uuid not null,
  entity_label text,
  is_primary boolean not null default false,
  effective_start date not null default current_date,
  effective_end date,
  created_at timestamptz not null default now(),
  unique (employee_id, entity_type, entity_id, effective_start)
);

create index if not exists idx_hr_employee_assignments_employee
  on public.hr_employee_assignments(employee_id, entity_type);

-- Expand service history event types
alter table public.employee_service_history drop constraint if exists employee_service_history_event_type_check;
alter table public.employee_service_history
  add constraint employee_service_history_event_type_check
  check (event_type in (
    'hire', 'promotion', 'transfer', 'leave', 'return', 'separation',
    'assignment', 'certification', 'review', 'onboarding', 'offer', 'other'
  ));

-- Expand PD delivery / course types
alter table public.pd_courses
  add column if not exists course_type text
    check (course_type is null or course_type in (
      'course', 'workshop', 'conference', 'ceu', 'internal_training', 'other'
    ));

-- Mandatory training flag on certifications
alter table public.employee_certifications
  add column if not exists is_mandatory boolean not null default false;

alter table public.employee_certifications
  add column if not exists reminder_sent_at timestamptz;

-- Interview calendar link
alter table public.hr_candidate_interviews
  add column if not exists calendar_event_id uuid;

-- RLS
alter table public.hr_employment_contracts enable row level security;
alter table public.hr_performance_notes enable row level security;
alter table public.hr_employee_assignments enable row level security;

drop policy if exists hr_employment_contracts_staff on public.hr_employment_contracts;
create policy hr_employment_contracts_staff on public.hr_employment_contracts
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists hr_performance_notes_staff on public.hr_performance_notes;
create policy hr_performance_notes_staff on public.hr_performance_notes
  for all using (
    school_id is null or public.can_access_school(school_id)
  ) with check (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists hr_employee_assignments_staff on public.hr_employee_assignments;
create policy hr_employee_assignments_staff on public.hr_employee_assignments
  for all using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and public.can_access_school(e.school_id)
    )
  ) with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and public.can_access_school(e.school_id)
    )
  );
