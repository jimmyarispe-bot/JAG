-- 226: give every database the ability to say what it is
--
-- On 25 Aug 2026 two hours were lost to a question that should be instant:
-- "which database am I looking at?" Two Supabase projects with near-identical
-- names, environment variables stored as Secret so their values cannot be read
-- back, and an application that looks the same on both. Counts from one were
-- being compared against writes to the other.
--
-- A database that can identify itself removes the ambiguity at the source. Any
-- query, in any tool, by anyone, can ask it directly — no dashboard, no config,
-- no inference from row counts.
--
-- Run this in EVERY environment, with the name changed to match:
--   The JAG          -> 'PRODUCTION'  is_production = true
--   The JAG Staging  -> 'STAGING'     is_production = false

create table if not exists public.platform_environment (
  -- Single-row table: the primary key can only ever be true.
  id boolean primary key default true check (id),
  environment_name text not null,
  is_production boolean not null default false,
  supabase_project_ref text,
  note text,
  updated_at timestamptz not null default now()
);

comment on table public.platform_environment is
  'Self-identification for this database. One row. Read by the application to '
  'render its environment banner, and by humans to answer "which database is this".';

alter table public.platform_environment enable row level security;

-- Readable by anyone signed in: it holds no secrets, and it is useless if the
-- application cannot read it to render the banner.
drop policy if exists platform_environment_read on public.platform_environment;
create policy platform_environment_read
  on public.platform_environment
  for select
  to authenticated
  using (true);

-- Writable only by service role, which bypasses RLS. No policy for writes:
-- this is set once per environment, deliberately, by a human.

-- Seed as UNIDENTIFIED. An environment that has not been named should say so
-- loudly rather than quietly claim to be production.
insert into public.platform_environment (id, environment_name, is_production, note)
values (true, 'UNIDENTIFIED', false, 'Set this immediately after running the migration.')
on conflict (id) do nothing;
