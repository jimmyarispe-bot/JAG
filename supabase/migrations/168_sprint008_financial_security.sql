-- =========================================
-- SPRINT 008: Financial Security
-- FINANCE_ACCESS gates Accounting, Payroll, Banking, P&L, Cash Flow,
-- Budgets, Forecasting, and Financial Intelligence.
-- Enforcement is application-side via authorize()/hasPermission().
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  (
    'FINANCE_ACCESS',
    'Finance Access',
    'Financial Security gate — Accounting, Payroll, Banking, P&L, Cash Flow, Budgets, Forecasting, and Financial Intelligence.',
    'iam',
    'access',
    30
  )
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
