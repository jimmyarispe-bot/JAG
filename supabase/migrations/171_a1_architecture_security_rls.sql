-- =========================================
-- A.1 Architecture Remediation — Critical RLS
-- Fixes open PAJ/ULR policies and over-broad payroll access.
-- Idempotent: safe to re-run
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. ULR catalog: keep authenticated READ; restrict WRITE
-- ---------------------------------------------------------------------------

drop policy if exists platform_ulr_competencies_write on public.platform_ulr_competencies;
create policy platform_ulr_competencies_write on public.platform_ulr_competencies
  for insert to authenticated
  with check (
    is_enterprise_admin()
    or has_permission('schools.manage')
    or has_permission('teacher.manage')
  );

drop policy if exists platform_ulr_competencies_update on public.platform_ulr_competencies;
create policy platform_ulr_competencies_update on public.platform_ulr_competencies
  for update to authenticated
  using (
    is_enterprise_admin()
    or has_permission('schools.manage')
    or has_permission('teacher.manage')
  )
  with check (
    is_enterprise_admin()
    or has_permission('schools.manage')
    or has_permission('teacher.manage')
  );

drop policy if exists platform_ulr_atomic_skills_write on public.platform_ulr_atomic_skills;
create policy platform_ulr_atomic_skills_write on public.platform_ulr_atomic_skills
  for insert to authenticated
  with check (
    is_enterprise_admin()
    or has_permission('schools.manage')
    or has_permission('teacher.manage')
  );

drop policy if exists platform_ulr_relationships_write on public.platform_ulr_relationships;
create policy platform_ulr_relationships_write on public.platform_ulr_relationships
  for insert to authenticated
  with check (
    is_enterprise_admin()
    or has_permission('schools.manage')
    or has_permission('teacher.manage')
  );

-- ---------------------------------------------------------------------------
-- 2. PAJ runtime: student-scoped via sis_student_policy (replace using(true))
-- ---------------------------------------------------------------------------

drop policy if exists platform_paj_journeys_rw on public.platform_paj_journeys;
create policy platform_paj_journeys_select on public.platform_paj_journeys
  for select to authenticated
  using (
    sis_student_policy(student_id)
    or is_parent_of_student(student_id)
  );
create policy platform_paj_journeys_write on public.platform_paj_journeys
  for all to authenticated
  using (
    sis_student_policy(student_id, 'students.edit')
    or has_permission('teacher.manage')
    or is_enterprise_admin()
  )
  with check (
    sis_student_policy(student_id, 'students.edit')
    or has_permission('teacher.manage')
    or is_enterprise_admin()
  );

drop policy if exists platform_paj_domain_enrollments_rw on public.platform_paj_domain_enrollments;
create policy platform_paj_domain_enrollments_select on public.platform_paj_domain_enrollments
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (sis_student_policy(j.student_id) or is_parent_of_student(j.student_id))
    )
  );
create policy platform_paj_domain_enrollments_write on public.platform_paj_domain_enrollments
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  );

drop policy if exists platform_paj_placements_rw on public.platform_paj_placements;
create policy platform_paj_placements_select on public.platform_paj_placements
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (sis_student_policy(j.student_id) or is_parent_of_student(j.student_id))
    )
  );
create policy platform_paj_placements_write on public.platform_paj_placements
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  );

drop policy if exists platform_paj_competency_progress_rw on public.platform_paj_competency_progress;
create policy platform_paj_competency_progress_select on public.platform_paj_competency_progress
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (sis_student_policy(j.student_id) or is_parent_of_student(j.student_id))
    )
  );
create policy platform_paj_competency_progress_write on public.platform_paj_competency_progress
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  );

drop policy if exists platform_paj_skill_progress_rw on public.platform_paj_skill_progress;
create policy platform_paj_skill_progress_select on public.platform_paj_skill_progress
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (sis_student_policy(j.student_id) or is_parent_of_student(j.student_id))
    )
  );
create policy platform_paj_skill_progress_write on public.platform_paj_skill_progress
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.platform_paj_journeys j
      where j.id = journey_id
        and (
          sis_student_policy(j.student_id, 'students.edit')
          or has_permission('teacher.manage')
          or is_enterprise_admin()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Payroll: permission + self-service (replace school-wide staff_all)
-- ---------------------------------------------------------------------------

drop policy if exists payroll_records_staff_all on public.payroll_records;

create policy payroll_records_select on public.payroll_records
  for select to authenticated
  using (
    is_enterprise_admin()
    or has_permission('payroll.run')
    or has_permission('finance.payroll')
    or has_permission('hr.manage')
    or (
      has_permission('employee.self_service')
      and exists (
        select 1 from public.employees e
        where e.id = employee_id
          and e.user_id = auth.uid()
      )
    )
  );

create policy payroll_records_write on public.payroll_records
  for all to authenticated
  using (
    is_enterprise_admin()
    or has_permission('payroll.run')
    or has_permission('finance.payroll')
    or has_permission('hr.manage')
  )
  with check (
    is_enterprise_admin()
    or has_permission('payroll.run')
    or has_permission('finance.payroll')
    or has_permission('hr.manage')
  );

notify pgrst, 'reload schema';
