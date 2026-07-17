-- =========================================
-- SPRINT 003: Permission Engine
-- Ensure schools.access_all exists in the permission catalog.
-- Authorization decisions are application-side via authorize()/hasPermission().
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  (
    'schools.access_all',
    'Access All Schools',
    'Cross-school access within the user''s organization(s). Granted by role→permission mapping; never check roles at call sites.',
    'iam',
    'access',
    160
  )
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
