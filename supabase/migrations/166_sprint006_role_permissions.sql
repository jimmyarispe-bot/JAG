-- =========================================
-- SPRINT 006: Role → permission mapping (documentation seed)
-- Application mapping lives in ROLE_PERMISSION_GROUPS (TypeScript).
-- This migration ensures catalog gates exist; it does not delete roles.
-- =========================================

-- Founder receives every catalog permission (app-side via ROLE_PERMISSION_GROUPS).
-- Executive Director: AcademyOS, Finance, HR, Payroll, Admissions, Reporting
-- School Leader: AcademyOS, Admissions, SIS, Reporting
-- Teacher: Teacher Workspace (TEACHER_ACCESS)
-- Parent: Parent Portal (PARENT_ACCESS)
-- Student: Student Portal (STUDENT_ACCESS)

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  ('JAG_ACCESS', 'JAG Access', 'Access to the JAG application and executive intelligence surfaces.', 'iam', 'access', 10),
  ('ACADEMYOS_ACCESS', 'AcademyOS Access', 'Access to the AcademyOS application and school operations.', 'iam', 'access', 20),
  ('FINANCE_ACCESS', 'Finance Access', 'Tuition, billing, and financial operations access.', 'iam', 'access', 30),
  ('BANKING_ACCESS', 'Banking Access', 'Banking, cash, and reconciliation access.', 'iam', 'access', 40),
  ('ACCOUNTING_ACCESS', 'Accounting Access', 'General ledger, accounting close, and financial accounting access.', 'iam', 'access', 50),
  ('PAYROLL_ACCESS', 'Payroll Access', 'Payroll run and payroll financial operations access.', 'iam', 'access', 60),
  ('HR_ACCESS', 'HR Access', 'Workforce, recruiting, and human resources access.', 'iam', 'access', 70),
  ('ADMISSIONS_ACCESS', 'Admissions Access', 'Admissions pipeline and enrollment access.', 'iam', 'access', 80),
  ('SIS_ACCESS', 'SIS Access', 'Student information system and student records access.', 'iam', 'access', 90),
  ('TEACHER_ACCESS', 'Teacher Access', 'Teacher workspace and instructional tools access.', 'iam', 'access', 100),
  ('PARENT_ACCESS', 'Parent Access', 'Parent portal access.', 'iam', 'access', 110),
  ('STUDENT_ACCESS', 'Student Access', 'Student portal access.', 'iam', 'access', 120),
  ('USER_MANAGEMENT_ACCESS', 'User Management Access', 'User directory, roles, and identity administration access.', 'iam', 'access', 130),
  ('SYSTEM_ADMIN_ACCESS', 'System Admin Access', 'Platform configuration, licensing, and system administration access.', 'iam', 'access', 140),
  ('AUDIT_ACCESS', 'Audit Access', 'Security and audit log visibility access.', 'iam', 'access', 150),
  ('REPORTING_ACCESS', 'Reporting Access', 'Global reporting and board/report surfaces access.', 'iam', 'access', 160)
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
