-- =========================================
-- SPRINT 007: Founder Protection
-- JAG entry is gated by JAG_ACCESS (permission engine).
-- Only FOUNDER role→permission mapping grants JAG_ACCESS.
-- Application redirects non-JAG users to AcademyOS (/dashboard).
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  (
    'JAG_ACCESS',
    'JAG Access',
    'Founder Protection gate — access to the JAG application. Granted only via FOUNDER role permission mapping.',
    'iam',
    'access',
    10
  )
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
