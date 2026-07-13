-- =========================================
-- Public admissions: list schools for /apply inquiry form
-- =========================================
-- Anonymous visitors cannot SELECT from public.schools under
-- schools_access_controlled (CEO / can_access_school only).
-- Mirror submit_public_admissions_inquiry: SECURITY DEFINER RPC
-- that returns only id + name for the public dropdown.
-- Idempotent: safe to re-run
-- =========================================

create or replace function public.list_schools_for_public_inquiry()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name
  from public.schools s
  order by s.name;
$$;

comment on function public.list_schools_for_public_inquiry() is
  'Anon-safe school list for the public admissions inquiry form (/apply). Returns id and name only.';

revoke all on function public.list_schools_for_public_inquiry() from public;
grant execute on function public.list_schools_for_public_inquiry()
  to anon, authenticated, service_role;
