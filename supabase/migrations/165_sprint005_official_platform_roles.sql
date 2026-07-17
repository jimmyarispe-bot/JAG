-- =========================================
-- SPRINT 005: Official Platform Roles
-- Additive — does NOT remove existing roles (CEO, FINANCE, REGISTRAR, etc.)
-- =========================================

insert into public.roles (name, display_name, description, is_system, sort_order)
values
  ('FOUNDER', 'Founder', 'Highest platform role with JAG and AcademyOS access.', true, 10),
  ('EXECUTIVE_DIRECTOR', 'Executive Director', 'Executive leadership across schools and AcademyOS modules.', true, 20),
  ('SCHOOL_LEADER', 'School Leader', 'School-level leadership for admissions, SIS, and reporting.', true, 30),
  ('ADMINISTRATOR', 'Administrator', 'Platform administration, users, roles, and system configuration.', true, 40),
  ('ACCOUNTING', 'Accounting', 'Accounting, banking, and financial operations access.', true, 50),
  ('HR', 'Human Resources', 'Workforce, recruiting, and HR operations.', true, 60),
  ('ADMISSIONS', 'Admissions', 'Admissions pipeline and enrollment operations.', true, 70),
  ('TEACHER', 'Teacher', 'Instructional staff with teacher workspace access.', true, 80),
  ('PARENT', 'Parent', 'Parent portal access for families.', true, 90),
  ('STUDENT', 'Student', 'Student portal access.', true, 100),
  ('BOARD_MEMBER', 'Board Member', 'Board governance and reporting access.', true, 110)
on conflict (name) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  is_system = true,
  sort_order = excluded.sort_order;

-- Ensure official roles are marked system/immutable when supported.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roles'
      and column_name = 'is_immutable'
  ) then
    update public.roles
    set is_immutable = true
    where name in (
      'FOUNDER',
      'EXECUTIVE_DIRECTOR',
      'SCHOOL_LEADER',
      'ADMINISTRATOR',
      'ACCOUNTING',
      'HR',
      'ADMISSIONS',
      'TEACHER',
      'PARENT',
      'STUDENT',
      'BOARD_MEMBER'
    );
  end if;
end $$;

-- Explicitly do not delete or demote non-official roles (CEO, FINANCE, etc.).

notify pgrst, 'reload schema';
