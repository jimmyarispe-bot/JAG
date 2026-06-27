-- =========================================
-- R-02.2: Platform relationship deduplication (135)
-- End duplicate active rows, then enforce uniqueness
-- Idempotent: safe to re-run
-- =========================================

with ranked as (
  select
    id,
    row_number() over (
      partition by
        organization_id,
        relationship_type,
        from_entity_type,
        from_entity_id,
        to_entity_type,
        to_entity_id
      order by created_at desc, id desc
    ) as rn
  from public.platform_relationships
  where status = 'active'
)
update public.platform_relationships r
set
  status = 'ended',
  end_date = coalesce(r.end_date, current_date),
  updated_at = now()
from ranked d
where r.id = d.id
  and d.rn > 1;

create unique index if not exists idx_platform_relationships_active_unique
  on public.platform_relationships (
    organization_id,
    relationship_type,
    from_entity_type,
    from_entity_id,
    to_entity_type,
    to_entity_id
  )
  where status = 'active';

notify pgrst, 'reload schema';
