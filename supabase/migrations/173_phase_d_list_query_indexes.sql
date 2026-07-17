-- Phase D — list-query composite indexes for SIS / admissions hot paths.
-- Safe additive indexes only; no RLS or business-logic changes.
-- Supports getStudents() ORDER BY last_name and getLeads() ORDER BY created_at DESC
-- under school-scoped tenancy filters.

create index if not exists idx_students_school_id_last_name
  on public.students (school_id, last_name);

create index if not exists idx_admissions_leads_school_id_created_at
  on public.admissions_leads (school_id, created_at desc);

create index if not exists idx_families_school_id_family_name
  on public.families (school_id, family_name);
