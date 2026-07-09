-- =========================================
-- B-07 PHASE 2: INTELLIGENCE GRAPH RLS (147)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_graph_edges enable row level security;

drop policy if exists platform_graph_edges_read on public.platform_graph_edges;
create policy platform_graph_edges_read on public.platform_graph_edges
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or (
      organization_id is not null
      and exists (
        select 1 from public.schools s
        where s.organization_id = platform_graph_edges.organization_id
          and can_access_school(s.id)
      )
    )
  );

drop policy if exists platform_graph_edges_insert on public.platform_graph_edges;
create policy platform_graph_edges_insert on public.platform_graph_edges
  for insert to authenticated
  with check (
    school_id is null
    or can_access_school(school_id)
  );

drop policy if exists platform_graph_edges_update on public.platform_graph_edges;
create policy platform_graph_edges_update on public.platform_graph_edges
  for update to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  )
  with check (
    school_id is null
    or can_access_school(school_id)
  );

grant select, insert, update on table public.platform_graph_edges to authenticated;
grant all on table public.platform_graph_edges to service_role;

notify pgrst, 'reload schema';
