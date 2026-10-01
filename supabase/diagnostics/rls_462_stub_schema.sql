-- rls_462_stub_schema.sql
--
-- The smallest database that can test migration 462's policies: the six
-- tables, stubs for auth.uid(), has_role() and current_employee_id(), and
-- four people - two teachers, Danni (EXECUTIVE_DIRECTOR) and Heather
-- (SCHOOL_LEADER).
--
-- Load this, then 462, then rls_462_named_cases.sql.
--
-- NOT FOR PRODUCTION. It drops and recreates the public schema.
--
drop schema if exists public cascade; create schema public;
drop schema if exists auth cascade; create schema auth;
drop role if exists tester;
create role tester nologin;

-- auth.uid() reads a session setting so we can "sign in" as different people
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.uid', true), '')::uuid
$$;
create table auth.users(id uuid primary key);

-- role membership, stubbed
create table public.user_roles_stub(user_id uuid, role_key text);
create function public.has_role(k text) returns boolean language sql stable as $$
  select exists(select 1 from public.user_roles_stub ur
                 where ur.user_id = auth.uid() and ur.role_key = k)
$$;

create table public.employees(
  id uuid primary key, user_id uuid, employment_status text);
create function public.current_employee_id() returns uuid
language sql stable security definer set search_path = public as $$
  select e.id from public.employees e
   where e.user_id = auth.uid() and e.employment_status = 'active' limit 1
$$;

create table public.courses(id uuid primary key);
create table public.students(id uuid primary key);

create table public.teacher_campus_assignments(
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  campus text not null, assigned_by_user_id uuid, assigned_at timestamptz default now(),
  unique(employee_id, campus));

create table public.teacher_weeks(
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  week_start date not null,
  status text not null default 'open' check (status in ('open','submitted')),
  submitted_at timestamptz, submitted_by uuid, kooky_note text,
  frozen_total_cents integer,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(employee_id, week_start),
  constraint coherent check ((status='submitted' and submitted_at is not null)
     or (status='open' and submitted_at is null and frozen_total_cents is null)));

create table public.teacher_class_entries(
  id uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  campus text not null, class_date date not null, start_time_et time not null,
  is_guest boolean not null default false, guest_for_employee_id uuid,
  created_at timestamptz default now());

create table public.teacher_class_students(
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.teacher_class_entries(id) on delete cascade,
  student_id uuid not null references public.students(id),
  absent boolean not null default false, created_at timestamptz default now(),
  unique(entry_id, student_id));

create table public.teacher_extra_claims(
  id uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  claim_month date not null, kind text not null, quantity numeric(6,2) not null,
  created_at timestamptz default now());

create table public.teacher_hourly_claims(
  id uuid primary key default gen_random_uuid(),
  teacher_week_id uuid not null references public.teacher_weeks(id) on delete cascade,
  rate_key text not null, hours numeric(5,2) not null,
  created_at timestamptz default now(), unique(teacher_week_id, rate_key));

alter table public.teacher_campus_assignments enable row level security;
alter table public.teacher_weeks              enable row level security;
alter table public.teacher_class_entries      enable row level security;
alter table public.teacher_class_students     enable row level security;
alter table public.teacher_extra_claims       enable row level security;
alter table public.teacher_hourly_claims      enable row level security;

create role authenticated nologin;
create role service_role nologin;
grant usage on schema public, auth to tester, authenticated;
grant select, insert, update, delete on all tables in schema public to tester;
grant tester to postgres;

-- people
insert into auth.users values
 ('aaaa0000-0000-0000-0000-00000000000a'),
 ('bbbb0000-0000-0000-0000-00000000000b'),
 ('dddd0000-0000-0000-0000-00000000000d'),
 ('eeee0000-0000-0000-0000-00000000000e');

insert into public.user_roles_stub values
 ('dddd0000-0000-0000-0000-00000000000d','EXECUTIVE_DIRECTOR'),
 ('eeee0000-0000-0000-0000-00000000000e','SCHOOL_LEADER');

insert into public.employees values
 ('1111aaaa-0000-0000-0000-00000000000a','aaaa0000-0000-0000-0000-00000000000a','active'),
 ('2222bbbb-0000-0000-0000-00000000000b','bbbb0000-0000-0000-0000-00000000000b','active');

insert into public.courses values ('cccc0000-0000-0000-0000-00000000000c');
insert into public.students values ('5555000a-0000-0000-0000-00000000000a');
