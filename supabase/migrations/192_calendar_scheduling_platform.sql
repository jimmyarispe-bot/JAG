-- =========================================
-- RC5: Calendar, Scheduling & Resource Management
-- Unified calendar events, resources, availability,
-- recurrence exceptions, and reminder queue
-- =========================================

-- Unified calendar events (complements instructional_sessions / academic_calendar_events)
create table if not exists public.platform_calendar_events (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  description text not null default '',
  event_type text not null
    check (event_type in (
      'class', 'meeting', 'parent_conference', 'iep', 'assessment',
      'school_event', 'holiday', 'staff_meeting', 'training',
      'reminder', 'workflow_scheduled'
    )),
  status text not null default 'scheduled'
    check (status in ('draft', 'scheduled', 'cancelled', 'completed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  all_day boolean not null default false,
  recurrence_rule text,
  recurrence_parent_id uuid references public.platform_calendar_events(id) on delete cascade,
  is_exception boolean not null default false,
  exception_original_starts_at timestamptz,
  color text,
  program text,
  class_id uuid,
  teacher_employee_id uuid,
  student_ids uuid[] not null default '{}',
  family_id uuid references public.families(id) on delete set null,
  resource_id uuid,
  room_id uuid,
  meet_url text,
  meet_provider text,
  meet_external_id text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  check (ends_at > starts_at)
);

create index if not exists idx_platform_cal_events_school_range
  on public.platform_calendar_events(school_id, starts_at, ends_at)
  where status <> 'cancelled';
create index if not exists idx_platform_cal_events_teacher
  on public.platform_calendar_events(teacher_employee_id, starts_at)
  where teacher_employee_id is not null and status <> 'cancelled';
create index if not exists idx_platform_cal_events_family
  on public.platform_calendar_events(family_id, starts_at)
  where family_id is not null;
create index if not exists idx_platform_cal_events_parent
  on public.platform_calendar_events(recurrence_parent_id)
  where recurrence_parent_id is not null;
create index if not exists idx_platform_cal_events_type
  on public.platform_calendar_events(event_type);

-- Recurrence exceptions (cancel / modify single occurrence)
create table if not exists public.platform_calendar_exceptions (
  id uuid primary key default gen_random_uuid(),
  series_event_id uuid not null references public.platform_calendar_events(id) on delete cascade,
  original_starts_at timestamptz not null,
  exception_type text not null check (exception_type in ('cancelled', 'modified')),
  replacement_event_id uuid references public.platform_calendar_events(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (series_event_id, original_starts_at)
);

-- Resources (rooms, labs, vehicles, equipment, devices)
create table if not exists public.platform_calendar_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  resource_type text not null
    check (resource_type in ('room', 'lab', 'vehicle', 'equipment', 'device', 'other')),
  capacity integer,
  location text,
  is_active boolean not null default true,
  linked_room_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_cal_resources_school
  on public.platform_calendar_resources(school_id, resource_type)
  where is_active = true;

alter table public.platform_calendar_events
  drop constraint if exists platform_calendar_events_resource_id_fkey;
alter table public.platform_calendar_events
  add constraint platform_calendar_events_resource_id_fkey
  foreign key (resource_id) references public.platform_calendar_resources(id) on delete set null;

-- Resource reservations
create table if not exists public.platform_calendar_reservations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.platform_calendar_resources(id) on delete cascade,
  event_id uuid references public.platform_calendar_events(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'cancelled', 'completed')),
  reserved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_platform_cal_reservations_resource
  on public.platform_calendar_reservations(resource_id, starts_at, ends_at)
  where status = 'reserved';

-- Teacher / staff availability windows
create table if not exists public.platform_staff_availability (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  employee_id uuid not null,
  availability_type text not null
    check (availability_type in ('working_hours', 'break', 'pto', 'holiday', 'blocked')),
  day_of_week smallint check (day_of_week between 0 and 6),
  starts_at timestamptz,
  ends_at timestamptz,
  start_time time,
  end_time time,
  timezone text not null default 'America/New_York',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_staff_avail_employee
  on public.platform_staff_availability(employee_id);

-- Reminder queue (24h / 1h / 15m)
create table if not exists public.platform_calendar_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.platform_calendar_events(id) on delete cascade,
  remind_at timestamptz not null,
  offset_minutes integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'cancelled', 'failed')),
  communication_id uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, offset_minutes)
);

create index if not exists idx_platform_cal_reminders_due
  on public.platform_calendar_reminders(remind_at)
  where status = 'pending';

-- RLS
alter table public.platform_calendar_events enable row level security;
alter table public.platform_calendar_exceptions enable row level security;
alter table public.platform_calendar_resources enable row level security;
alter table public.platform_calendar_reservations enable row level security;
alter table public.platform_staff_availability enable row level security;
alter table public.platform_calendar_reminders enable row level security;

drop policy if exists platform_cal_events_staff on public.platform_calendar_events;
create policy platform_cal_events_staff on public.platform_calendar_events
  for all using (school_id is null or public.can_access_school(school_id))
  with check (school_id is null or public.can_access_school(school_id));

drop policy if exists platform_cal_exceptions_staff on public.platform_calendar_exceptions;
create policy platform_cal_exceptions_staff on public.platform_calendar_exceptions
  for all using (
    exists (
      select 1 from public.platform_calendar_events e
      where e.id = series_event_id
        and (e.school_id is null or public.can_access_school(e.school_id))
    )
  );

drop policy if exists platform_cal_resources_staff on public.platform_calendar_resources;
create policy platform_cal_resources_staff on public.platform_calendar_resources
  for all using (school_id is null or public.can_access_school(school_id));

drop policy if exists platform_cal_reservations_staff on public.platform_calendar_reservations;
create policy platform_cal_reservations_staff on public.platform_calendar_reservations
  for all using (school_id is null or public.can_access_school(school_id));

drop policy if exists platform_staff_avail_staff on public.platform_staff_availability;
create policy platform_staff_avail_staff on public.platform_staff_availability
  for all using (school_id is null or public.can_access_school(school_id));

drop policy if exists platform_cal_reminders_staff on public.platform_calendar_reminders;
create policy platform_cal_reminders_staff on public.platform_calendar_reminders
  for all using (
    exists (
      select 1 from public.platform_calendar_events e
      where e.id = event_id
        and (e.school_id is null or public.can_access_school(e.school_id))
    )
  );

comment on table public.platform_calendar_events is 'RC5 unified calendar events — classes, meetings, school events, workflow-scheduled';
comment on column public.platform_calendar_events.recurrence_rule is 'iCal RRULE or simple daily|weekly|monthly token';
comment on table public.platform_calendar_resources is 'Reservable resources: rooms, labs, vehicles, equipment, devices';
