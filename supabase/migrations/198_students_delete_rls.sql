-- =========================================
-- Student hard-delete RLS
-- DELETE must match UPDATE authorization exactly.
-- Does not alter SELECT / INSERT / UPDATE policies.
-- =========================================

drop policy if exists "students_delete_school_scoped" on public.students;

create policy "students_delete_school_scoped" on public.students
  for delete to authenticated
  using (
    can_access_student_record(id)
    and (has_permission('students.edit') or is_enterprise_admin())
  );
