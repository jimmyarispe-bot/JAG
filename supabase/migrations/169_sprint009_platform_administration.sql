-- =========================================
-- SPRINT 009: Platform Administration
-- Hub sections are enforced in-app via authorize()/hasPermission().
-- Ensures catalog gates used by Platform Administration exist.
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  ('SYSTEM_ADMIN_ACCESS', 'System Admin Access', 'Platform Administration — system configuration, subscriptions, API keys, feature flags.', 'iam', 'access', 140),
  ('USER_MANAGEMENT_ACCESS', 'User Management Access', 'Platform Administration — users and identity administration.', 'iam', 'access', 130),
  ('AUDIT_ACCESS', 'Audit Access', 'Platform Administration — audit log visibility.', 'iam', 'access', 150)
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
