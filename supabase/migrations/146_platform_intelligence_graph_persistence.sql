-- =========================================
-- B-07 PHASE 2: INTELLIGENCE GRAPH PERSISTENCE (146)
-- Wave 1 — canonical graph relationship store (references only, no entity duplication)
-- Idempotent: safe to re-run
-- =========================================

create table if not exists public.platform_graph_edges (
  id uuid primary key default gen_random_uuid(),
  edge_type text not null,
  source_node_id text not null,
  target_node_id text not null,
  direction text not null default 'directed'
    check (direction in ('directed', 'bidirectional', 'undirected')),
  weight numeric(8, 3) not null default 1.0,
  provider_key text not null,
  organization_id uuid references public.org_organizations(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  effective_date timestamptz,
  end_date timestamptz,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  constraint platform_graph_edges_unique_link
    unique (edge_type, source_node_id, target_node_id, provider_key)
);

create index if not exists idx_platform_graph_edges_source
  on public.platform_graph_edges(source_node_id, edge_type)
  where status = 'active';

create index if not exists idx_platform_graph_edges_target
  on public.platform_graph_edges(target_node_id, edge_type)
  where status = 'active';

create index if not exists idx_platform_graph_edges_type
  on public.platform_graph_edges(edge_type, recorded_at desc);

create index if not exists idx_platform_graph_edges_school
  on public.platform_graph_edges(school_id, recorded_at desc)
  where school_id is not null;

create index if not exists idx_platform_graph_edges_org
  on public.platform_graph_edges(organization_id, recorded_at desc)
  where organization_id is not null;

notify pgrst, 'reload schema';
