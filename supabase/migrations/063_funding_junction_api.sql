-- =========================================
-- FUNDING JUNCTION API (063)
-- Flat SQL accessors for junction tables when PostgREST
-- does not expose admissions_lead_funding_sources /
-- student_funding_sources on the Data API.
-- Idempotent: safe to re-run.
-- =========================================

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on table public.funding_sources to authenticated, anon;
grant select, insert, update, delete on table public.admissions_lead_funding_sources to authenticated;
grant select, insert, update, delete on table public.student_funding_sources to authenticated;
grant all on table public.funding_sources to service_role;
grant all on table public.admissions_lead_funding_sources to service_role;
grant all on table public.student_funding_sources to service_role;

-- Named composite types are required for PostgREST to expose set-returning RPCs.
-- PostgreSQL does not support CREATE TYPE IF NOT EXISTS; use catalog checks
-- (same pattern as 064_funding_junction_rpc_fix.sql).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n
      ON n.oid = t.typnamespace
    WHERE t.typname = 'lead_funding_link'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.lead_funding_link AS (
      lead_id uuid,
      funding_source_id uuid
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n
      ON n.oid = t.typnamespace
    WHERE t.typname = 'student_funding_link'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.student_funding_link AS (
      student_id uuid,
      funding_source_id uuid
    );
  END IF;
END
$$;

grant usage on type public.lead_funding_link to authenticated, anon, service_role;
grant usage on type public.student_funding_link to authenticated, anon, service_role;

-- Flat read: admissions lead junction rows (no embed / relationship syntax)
-- Signature: list_admissions_lead_funding_sources(p_lead_ids uuid[])
create or replace function public.list_admissions_lead_funding_sources(p_lead_ids uuid[])
returns setof public.lead_funding_link
language sql
stable
security invoker
set search_path = public
as $$
  select alfs.lead_id, alfs.funding_source_id
  from public.admissions_lead_funding_sources alfs
  where alfs.lead_id = any (p_lead_ids);
$$;

-- Flat write: replace all funding links for one lead
-- Signature: replace_admissions_lead_funding_sources(p_lead_id uuid, p_funding_source_ids uuid[])
create or replace function public.replace_admissions_lead_funding_sources(
  p_lead_id uuid,
  p_funding_source_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.admissions_lead_funding_sources
  where lead_id = p_lead_id;

  if coalesce(array_length(p_funding_source_ids, 1), 0) = 0 then
    return;
  end if;

  insert into public.admissions_lead_funding_sources (lead_id, funding_source_id)
  select p_lead_id, fs_id
  from unnest(p_funding_source_ids) as fs_id
  on conflict do nothing;
end;
$$;

-- Flat read: student junction rows
-- Signature: list_student_funding_sources(p_student_ids uuid[])
create or replace function public.list_student_funding_sources(p_student_ids uuid[])
returns setof public.student_funding_link
language sql
stable
security invoker
set search_path = public
as $$
  select sfs.student_id, sfs.funding_source_id
  from public.student_funding_sources sfs
  where sfs.student_id = any (p_student_ids);
$$;

-- Flat write: replace all funding links for one student
-- Signature: replace_student_funding_sources(p_student_id uuid, p_funding_source_ids uuid[])
create or replace function public.replace_student_funding_sources(
  p_student_id uuid,
  p_funding_source_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.student_funding_sources
  where student_id = p_student_id;

  if coalesce(array_length(p_funding_source_ids, 1), 0) = 0 then
    return;
  end if;

  insert into public.student_funding_sources (student_id, funding_source_id)
  select p_student_id, fs_id
  from unnest(p_funding_source_ids) as fs_id
  on conflict do nothing;
end;
$$;

grant execute on function public.list_admissions_lead_funding_sources(uuid[]) to authenticated, anon, service_role;
grant execute on function public.replace_admissions_lead_funding_sources(uuid, uuid[]) to authenticated, anon, service_role;
grant execute on function public.list_student_funding_sources(uuid[]) to authenticated, anon, service_role;
grant execute on function public.replace_student_funding_sources(uuid, uuid[]) to authenticated, anon, service_role;

notify pgrst, 'reload schema';
