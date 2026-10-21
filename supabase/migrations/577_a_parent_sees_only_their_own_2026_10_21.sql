-- 577 - A parent sees only their own child's records.
--
-- Jimmy, 21 October 2026: "I need you to make sure with 100% certainty that
-- the parents are only seeing their account and they are not seeing any other
-- menus or tabs or any other information concerning anything else in the JAG."
--
-- A parent's login can query the database directly, so this is the layer that
-- decides. Before this migration, a parent-only account (role PARENT, active
-- organization membership, assigned to its campus - exactly what the contract
-- invitation creates) could read:
--   * every table guarded by organization membership (35, including every
--     family's inquiry answers, founder insights, integration connections),
--   * every active staff member's user row (names and emails),
--   * 24 tables open to any signed-in user - among them QuickBooks access and
--     refresh tokens and financials, and legacy scholarship applications with
--     household income,
--   * the whole school once linked to a student (can_access_school's PARENT
--     branch).
-- No parent account existed when this was written. What a parent keeps: their
-- own child, through is_guardian_of_lead / is_parent_of_student, unchanged.
--
-- Staff are not affected: every change below only removes access from a
-- login whose every role is PARENT - except the QuickBooks tables, which were
-- open to every signed-in user, teachers included, and now need finance.

begin;

-- 1. Who is a parent and nothing else.
create or replace function public.is_parent_only(uid uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select uid is not null
     and exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
                 where ur.user_id = uid and r.name = 'PARENT')
     and not exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
                     where ur.user_id = uid and r.name <> 'PARENT');
$$;
revoke all on function public.is_parent_only(uuid) from public;
grant execute on function public.is_parent_only(uuid) to authenticated, service_role;

-- 2. Organization membership no longer opens anything to a parent.
create or replace function public.user_can_access_organization(check_user_id uuid, check_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_platform_steward(check_user_id)
    or (
      not public.is_parent_only(check_user_id)
      and (
        exists (
          select 1 from public.user_organization_memberships m
          where m.organization_id = check_organization_id
            and m.user_id = check_user_id
            and m.status = 'active'
        )
        or exists (
          select 1 from public.org_organizations o
          where o.id = check_organization_id and o.owner_user_id = check_user_id
        )
      )
    );
$$;

create or replace function public.is_organization_member(check_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select not public.is_parent_only(auth.uid())
     and exists (
       select 1 from public.user_organization_memberships m
       where m.organization_id = check_organization_id
         and m.user_id = auth.uid()
         and m.status = 'active'
     );
$$;

-- 3. can_access_school: the PARENT branch gave a parent the whole campus.
--    Their own child stays reachable through the guardian functions.
create or replace function public.can_access_school(school_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select
    is_enterprise_admin()
    or (
      (has_role('SCHOOL_LEADER') or has_role('TEACHER') or has_role('ADMISSIONS')
        or has_role('FINANCE') or has_role('HR') or has_role('REGISTRAR')
        or has_role('SCHOLARSHIP_MANAGER') or has_role('STATE_FUNDING_MANAGER')
        or has_role('SUPPORT_STAFF') or has_role('THERAPIST'))
      and (
        is_assigned_to_school(school_id)
        or exists (
          select 1 from public.user_org_assignments uoa
          where uoa.user_id = auth.uid() and uoa.school_id = can_access_school.school_id
        )
      )
    )
    or (
      has_role('STUDENT') and exists (
        select 1 from public.students s
        where s.user_id = auth.uid() and s.school_id = can_access_school.school_id
      )
    );
$function$;

-- 4. Policies that read memberships directly.
do $$
declare p record;
begin
  for p in
    select tablename, policyname, cmd, qual, with_check from pg_policies
    where schemaname = 'public'
      and tablename in ('platform_notes', 'platform_relationships')
  loop
    if p.qual is not null then
      execute format('alter policy %I on public.%I using ((%s) and not public.is_parent_only(auth.uid()))',
        p.policyname, p.tablename, p.qual);
    end if;
    if p.with_check is not null then
      execute format('alter policy %I on public.%I with check ((%s) and not public.is_parent_only(auth.uid()))',
        p.policyname, p.tablename, p.with_check);
    end if;
  end loop;
end $$;

-- users: a parent sees their own row, never the staff list.
do $$
declare q text;
begin
  select qual into q from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_select_access';
  execute format('alter policy users_select_access on public.users using ((id = auth.uid()) or ((%s) and not public.is_parent_only(auth.uid())))', q);
end $$;

-- 5. Open-to-everyone policies.
alter policy fi_quickbooks_connections_read on public.fi_quickbooks_connections
  using (is_enterprise_admin() or has_permission('finance.view') or has_permission('FINANCE_ACCESS'));
alter policy fi_quickbooks_financials_read on public.fi_quickbooks_financials
  using (is_enterprise_admin() or has_permission('finance.view') or has_permission('FINANCE_ACCESS'));

alter policy jag_prompt_registry_access on public.jag_prompt_registry
  to authenticated
  using (not public.is_parent_only(auth.uid()))
  with check (not public.is_parent_only(auth.uid()));
alter policy person_directory_overrides_staff_all on public.person_directory_overrides
  using (not public.is_parent_only(auth.uid()))
  with check (not public.is_parent_only(auth.uid()));
alter policy teacher_pay_courses_read on public.teacher_pay_courses
  using (auth.uid() is not null and not public.is_parent_only(auth.uid()));

do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and cmd = 'SELECT' and qual in ('true', '(true)')
      and tablename in (
        'admissions_stage_tasks', 'aip_provider_definitions', 'cert_documentation',
        'cert_university_paths', 'cloud_system_status', 'config_module_definitions',
        'edp_connector_definitions', 'funding_sources', 'platform_applications',
        'platform_classification_permissions', 'platform_environment', 'platform_permissions',
        'platform_relationship_type_definitions', 'platform_ulr_atomic_skills',
        'platform_ulr_competencies', 'platform_ulr_domains', 'platform_ulr_relationships',
        'platform_ulr_strands', 'platform_ulr_sub_strands', 'program_catalog',
        'scholarship_applications_legacy')
  loop
    execute format('alter policy %I on public.%I using (not public.is_parent_only(auth.uid()))',
      p.policyname, p.tablename);
  end loop;
end $$;

commit;
