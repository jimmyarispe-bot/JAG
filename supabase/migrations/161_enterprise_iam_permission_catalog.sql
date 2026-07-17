-- =========================================
-- Enterprise IAM: official permission catalog
-- Seeds coarse access permissions into platform_permissions
-- =========================================

insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values
  ('JAG_ACCESS', 'JAG Access', 'Access to the JAG application and executive intelligence surfaces.', 'iam', 'access', 10),
  ('ACADEMYOS_ACCESS', 'AcademyOS Access', 'Access to the AcademyOS application and school operations.', 'iam', 'access', 20),
  ('FINANCE_ACCESS', 'Finance Access', 'Tuition, billing, and financial operations access.', 'iam', 'access', 30),
  ('HR_ACCESS', 'HR Access', 'Workforce, recruiting, and human resources access.', 'iam', 'access', 40),
  ('PAYROLL_ACCESS', 'Payroll Access', 'Payroll run and payroll financial operations access.', 'iam', 'access', 50),
  ('BANKING_ACCESS', 'Banking Access', 'Banking, cash, and reconciliation access.', 'iam', 'access', 60),
  ('ADMISSIONS_ACCESS', 'Admissions Access', 'Admissions pipeline and enrollment access.', 'iam', 'access', 70),
  ('SIS_ACCESS', 'SIS Access', 'Student information system and student records access.', 'iam', 'access', 80),
  ('TEACHER_ACCESS', 'Teacher Access', 'Teacher workspace and instructional tools access.', 'iam', 'access', 90),
  ('PARENT_ACCESS', 'Parent Access', 'Parent portal access.', 'iam', 'access', 100),
  ('STUDENT_ACCESS', 'Student Access', 'Student portal access.', 'iam', 'access', 110),
  ('USER_MANAGEMENT_ACCESS', 'User Management Access', 'User directory, roles, and identity administration access.', 'iam', 'access', 120),
  ('SYSTEM_CONFIGURATION_ACCESS', 'System Configuration Access', 'Platform configuration, licensing, and system administration access.', 'iam', 'access', 130),
  ('REPORTING_ACCESS', 'Reporting Access', 'Global reporting and board/report surfaces access.', 'iam', 'access', 140),
  ('AUDIT_LOG_ACCESS', 'Audit Log Access', 'Security and audit log visibility access.', 'iam', 'access', 150)
on conflict (permission_key) do update set
  name = excluded.name,
  description = excluded.description,
  module = excluded.module,
  category = excluded.category,
  sort_order = excluded.sort_order;
