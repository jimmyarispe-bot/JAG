-- =========================================
-- RC-6.05 — Executive / Mission Control query indexes
-- =========================================

-- EDI → Mission Control existence checks
create index if not exists idx_mc_items_entity_open
  on public.platform_mission_control_items (entity_type, entity_id)
  where is_resolved = false;

-- Executive insight dedupe by title
create index if not exists idx_executive_insights_open_title
  on public.executive_insights (is_dismissed, title)
  where is_dismissed = false;

create index if not exists idx_executive_insights_school_open_title
  on public.executive_insights (school_id, is_dismissed, title)
  where is_dismissed = false;
