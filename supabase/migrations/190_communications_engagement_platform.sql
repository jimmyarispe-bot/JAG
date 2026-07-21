-- =========================================
-- RC3: Communications & Engagement Platform
-- Unified communications, templates, announcements,
-- phone/meeting logs, and in-app notifications
-- =========================================

-- Main communication entity
create table if not exists public.platform_communications (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  type text not null
    check (type in ('email', 'sms', 'portal', 'call', 'meeting', 'announcement', 'notification', 'reminder')),
  direction text not null default 'outbound'
    check (direction in ('inbound', 'outbound')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'queued', 'sent', 'delivered', 'read', 'failed', 'archived')),
  subject text,
  body_text text,
  body_html text,
  sender_user_id uuid references public.users(id) on delete set null,
  sender_display_name text,
  student_id uuid references public.students(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  template_id uuid,
  audience_scope text
    check (audience_scope is null or audience_scope in (
      'student', 'guardian', 'family', 'teacher', 'employee',
      'class', 'program', 'school', 'organization', 'custom'
    )),
  scheduled_for timestamptz,
  schedule_rrule text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_platform_comms_school_created
  on public.platform_communications(school_id, created_at desc);
create index if not exists idx_platform_comms_student
  on public.platform_communications(student_id, created_at desc)
  where student_id is not null;
create index if not exists idx_platform_comms_family
  on public.platform_communications(family_id, created_at desc)
  where family_id is not null;
create index if not exists idx_platform_comms_status
  on public.platform_communications(status);
create index if not exists idx_platform_comms_scheduled
  on public.platform_communications(scheduled_for)
  where status = 'scheduled';
create index if not exists idx_platform_comms_type
  on public.platform_communications(type);

-- Recipients
create table if not exists public.platform_communication_recipients (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.platform_communications(id) on delete cascade,
  recipient_type text not null
    check (recipient_type in (
      'student', 'guardian', 'family', 'teacher', 'employee',
      'class', 'program', 'school', 'custom'
    )),
  recipient_id uuid,
  display_name text,
  email text,
  phone text,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_comm_recipients_comm
  on public.platform_communication_recipients(communication_id);

-- Attachments (versioned)
create table if not exists public.platform_communication_attachments (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.platform_communications(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  version integer not null default 1,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_comm_attachments_comm
  on public.platform_communication_attachments(communication_id);

-- Templates
create table if not exists public.platform_communication_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  template_key text not null,
  name text not null,
  category text not null default 'general',
  subject text not null default '',
  body_text text not null default '',
  body_html text,
  variables text[] not null default '{}',
  is_active boolean not null default true,
  usage_count integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_key)
);

create index if not exists idx_platform_comm_templates_org
  on public.platform_communication_templates(organization_id, is_active);

alter table public.platform_communications
  drop constraint if exists platform_communications_template_id_fkey;
alter table public.platform_communications
  add constraint platform_communications_template_id_fkey
  foreign key (template_id) references public.platform_communication_templates(id) on delete set null;

-- Announcements
create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  body_text text not null default '',
  body_html text,
  target_audience text not null
    check (target_audience in ('organization', 'school', 'program', 'class', 'staff', 'parents', 'students')),
  program_id uuid,
  class_id uuid,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  communication_id uuid references public.platform_communications(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_announcements_school
  on public.platform_announcements(school_id, status, created_at desc);

-- Phone call logs
create table if not exists public.platform_phone_call_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  duration_seconds integer,
  notes text,
  follow_up_required boolean not null default false,
  outcome text,
  occurred_at timestamptz not null default now(),
  logged_by uuid references public.users(id) on delete set null,
  communication_id uuid references public.platform_communications(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_phone_calls_family
  on public.platform_phone_call_logs(family_id, occurred_at desc);
create index if not exists idx_platform_phone_calls_student
  on public.platform_phone_call_logs(student_id, occurred_at desc);

-- Meeting logs
create table if not exists public.platform_meeting_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  family_id uuid references public.families(id) on delete set null,
  meeting_type text not null default 'parent_conference'
    check (meeting_type in (
      'parent_conference', 'iep', 'scholarship', 'staff', 'other'
    )),
  title text not null,
  participants jsonb not null default '[]'::jsonb,
  notes text,
  decisions text,
  action_items jsonb not null default '[]'::jsonb,
  occurred_at timestamptz not null default now(),
  logged_by uuid references public.users(id) on delete set null,
  communication_id uuid references public.platform_communications(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_meetings_family
  on public.platform_meeting_logs(family_id, occurred_at desc);
create index if not exists idx_platform_meetings_student
  on public.platform_meeting_logs(student_id, occurred_at desc);

-- In-app notification center
create table if not exists public.platform_in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  category text not null default 'general',
  href text,
  related_student_id uuid references public.students(id) on delete set null,
  related_family_id uuid references public.families(id) on delete set null,
  related_communication_id uuid references public.platform_communications(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_in_app_notif_user
  on public.platform_in_app_notifications(user_id, created_at desc);
create index if not exists idx_platform_in_app_notif_unread
  on public.platform_in_app_notifications(user_id)
  where read_at is null;

-- Seed system templates (org-null = global defaults; apps copy/clone as needed)
insert into public.platform_communication_templates (
  organization_id, template_key, name, category, subject, body_text, variables
)
select null, t.template_key, t.name, t.category, t.subject, t.body_text, t.variables
from (values
  ('welcome', 'Welcome', 'welcome', 'Welcome to {{School}}',
   'Dear {{GuardianName}},\n\nWelcome to {{School}}. We are excited to partner with you for {{StudentName}}''s education.\n\n— {{School}}',
   array['StudentName','GuardianName','School','Teacher','Program']),
  ('enrollment', 'Enrollment', 'enrollment', 'Enrollment update for {{StudentName}}',
   'Dear {{GuardianName}},\n\nThis is an enrollment update for {{StudentName}} in {{Program}} at {{School}}.\n\n— {{School}}',
   array['StudentName','GuardianName','School','Program']),
  ('missing_documents', 'Missing Documents', 'documents', 'Missing documents for {{StudentName}}',
   'Dear {{GuardianName}},\n\nWe still need documents for {{StudentName}}. Please upload them through the parent portal.\n\n— {{School}}',
   array['StudentName','GuardianName','School']),
  ('scholarship_reminder', 'Scholarship Reminder', 'scholarship', 'Scholarship reminder — {{StudentName}}',
   'Dear {{GuardianName}},\n\nThis is a reminder about scholarship next steps for {{StudentName}} at {{School}}.\n\n— {{School}}',
   array['StudentName','GuardianName','School']),
  ('tuition_reminder', 'Tuition Reminder', 'billing', 'Tuition reminder for your family',
   'Dear {{GuardianName}},\n\nThis is a friendly tuition reminder from {{School}} regarding {{StudentName}}.\n\n— {{School}}',
   array['StudentName','GuardianName','School']),
  ('attendance', 'Attendance', 'attendance', 'Attendance notice — {{StudentName}}',
   'Dear {{GuardianName}},\n\nWe are writing about attendance for {{StudentName}} at {{School}}.\n\n— {{Teacher}}',
   array['StudentName','GuardianName','School','Teacher']),
  ('schedule_change', 'Schedule Change', 'scheduling', 'Schedule change for {{StudentName}}',
   'Dear {{GuardianName}},\n\nThere is a schedule update for {{StudentName}} in {{Program}}.\n\n— {{School}}',
   array['StudentName','GuardianName','School','Program','Teacher']),
  ('behavior', 'Behavior', 'behavior', 'Behavior update — {{StudentName}}',
   'Dear {{GuardianName}},\n\nWe wanted to share a behavior update for {{StudentName}}.\n\n— {{Teacher}}',
   array['StudentName','GuardianName','School','Teacher']),
  ('progress_update', 'Progress Update', 'progress', 'Progress update — {{StudentName}}',
   'Dear {{GuardianName}},\n\nHere is a progress update for {{StudentName}} in {{Program}}.\n\n— {{Teacher}}',
   array['StudentName','GuardianName','School','Teacher','Program']),
  ('graduation', 'Graduation', 'graduation', 'Graduation information — {{StudentName}}',
   'Dear {{GuardianName}},\n\nCongratulations! Here is graduation information for {{StudentName}} at {{School}}.\n\n— {{School}}',
   array['StudentName','GuardianName','School','Program'])
) as t(template_key, name, category, subject, body_text, variables)
where not exists (
  select 1 from public.platform_communication_templates existing
  where existing.organization_id is null and existing.template_key = t.template_key
);

-- RLS
alter table public.platform_communications enable row level security;
alter table public.platform_communication_recipients enable row level security;
alter table public.platform_communication_attachments enable row level security;
alter table public.platform_communication_templates enable row level security;
alter table public.platform_announcements enable row level security;
alter table public.platform_phone_call_logs enable row level security;
alter table public.platform_meeting_logs enable row level security;
alter table public.platform_in_app_notifications enable row level security;

-- Staff with school access can manage communications
drop policy if exists platform_comms_staff_all on public.platform_communications;
create policy platform_comms_staff_all on public.platform_communications
  for all using (
    public.can_access_school(school_id)
    or school_id is null
  )
  with check (
    public.can_access_school(school_id)
    or school_id is null
  );

drop policy if exists platform_comm_recipients_staff on public.platform_communication_recipients;
create policy platform_comm_recipients_staff on public.platform_communication_recipients
  for all using (
    exists (
      select 1 from public.platform_communications c
      where c.id = communication_id
        and (public.can_access_school(c.school_id) or c.school_id is null)
    )
  );

drop policy if exists platform_comm_attachments_staff on public.platform_communication_attachments;
create policy platform_comm_attachments_staff on public.platform_communication_attachments
  for all using (
    exists (
      select 1 from public.platform_communications c
      where c.id = communication_id
        and (public.can_access_school(c.school_id) or c.school_id is null)
    )
  );

drop policy if exists platform_comm_templates_staff on public.platform_communication_templates;
create policy platform_comm_templates_staff on public.platform_communication_templates
  for all using (
    organization_id is null
    or school_id is null
    or public.can_access_school(school_id)
  );

drop policy if exists platform_announcements_staff on public.platform_announcements;
create policy platform_announcements_staff on public.platform_announcements
  for all using (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_phone_calls_staff on public.platform_phone_call_logs;
create policy platform_phone_calls_staff on public.platform_phone_call_logs
  for all using (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_meetings_staff on public.platform_meeting_logs;
create policy platform_meetings_staff on public.platform_meeting_logs
  for all using (
    school_id is null or public.can_access_school(school_id)
  );

drop policy if exists platform_in_app_notif_own on public.platform_in_app_notifications;
create policy platform_in_app_notif_own on public.platform_in_app_notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.platform_communications is 'RC3 unified communications entity — email, SMS, portal, call, meeting, announcement';
comment on column public.platform_communications.audit_id is 'Stable audit identifier for Executive Intelligence and compliance trails';
