-- =========================================
-- config_sections: make org-level (school_id NULL) rows uniquely addressable
--
-- PostgreSQL UNIQUE treats NULLs as distinct, so upserts with school_id NULL
-- inserted duplicate rows instead of updating. Reads via maybeSingle() then
-- failed and fell back to empty defaults — mission/vision/etc. appeared to
-- not persist while legal_name still showed via org.name hydration.
-- =========================================

-- Keep newest row per (organization_id, school_id, section_key), drop older dupes.
with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id, section_key, school_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.config_sections
)
delete from public.config_sections cs
using ranked r
where cs.id = r.id
  and r.rn > 1;

alter table public.config_sections
  drop constraint if exists config_sections_organization_id_school_id_section_key_key;

alter table public.config_sections
  add constraint config_sections_organization_id_school_id_section_key_key
  unique nulls not distinct (organization_id, school_id, section_key);
