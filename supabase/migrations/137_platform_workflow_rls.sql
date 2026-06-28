-- =========================================
-- B-04 PHASE 2: PLATFORM WORKFLOW RLS (137)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_workflow_definitions enable row level security;
alter table public.platform_workflow_versions enable row level security;
alter table public.platform_workflow_instances enable row level security;
alter table public.platform_workflow_state_history enable row level security;
alter table public.platform_workflow_tasks enable row level security;
alter table public.platform_workflow_approvals enable row level security;
alter table public.platform_workflow_timers enable row level security;

-- Definitions: platform-wide (null school) readable; school-scoped by access
drop policy if exists platform_workflow_definitions_read on public.platform_workflow_definitions;
create policy platform_workflow_definitions_read on public.platform_workflow_definitions
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  );

drop policy if exists platform_workflow_definitions_manage on public.platform_workflow_definitions;
create policy platform_workflow_definitions_manage on public.platform_workflow_definitions
  for all to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  )
  with check (
    school_id is null
    or can_access_school(school_id)
  );

-- Versions: readable when parent definition is accessible
drop policy if exists platform_workflow_versions_read on public.platform_workflow_versions;
create policy platform_workflow_versions_read on public.platform_workflow_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_definitions d
      where d.id = platform_workflow_versions.definition_id
        and (d.school_id is null or can_access_school(d.school_id))
    )
  );

drop policy if exists platform_workflow_versions_manage on public.platform_workflow_versions;
create policy platform_workflow_versions_manage on public.platform_workflow_versions
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_definitions d
      where d.id = platform_workflow_versions.definition_id
        and (d.school_id is null or can_access_school(d.school_id))
    )
  )
  with check (
    exists (
      select 1 from public.platform_workflow_definitions d
      where d.id = platform_workflow_versions.definition_id
        and (d.school_id is null or can_access_school(d.school_id))
    )
  );

-- Instances: school-scoped
drop policy if exists platform_workflow_instances_read on public.platform_workflow_instances;
create policy platform_workflow_instances_read on public.platform_workflow_instances
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  );

drop policy if exists platform_workflow_instances_write on public.platform_workflow_instances;
create policy platform_workflow_instances_write on public.platform_workflow_instances
  for all to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  )
  with check (
    school_id is null
    or can_access_school(school_id)
  );

-- Child tables: inherit access via instance
drop policy if exists platform_workflow_state_history_read on public.platform_workflow_state_history;
create policy platform_workflow_state_history_read on public.platform_workflow_state_history
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_state_history.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_state_history_insert on public.platform_workflow_state_history;
create policy platform_workflow_state_history_insert on public.platform_workflow_state_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_state_history.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_tasks_read on public.platform_workflow_tasks;
create policy platform_workflow_tasks_read on public.platform_workflow_tasks
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_tasks.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_tasks_write on public.platform_workflow_tasks;
create policy platform_workflow_tasks_write on public.platform_workflow_tasks
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_tasks.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  )
  with check (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_tasks.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_approvals_read on public.platform_workflow_approvals;
create policy platform_workflow_approvals_read on public.platform_workflow_approvals
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_approvals.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_approvals_write on public.platform_workflow_approvals;
create policy platform_workflow_approvals_write on public.platform_workflow_approvals
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_approvals.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  )
  with check (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_approvals.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_timers_read on public.platform_workflow_timers;
create policy platform_workflow_timers_read on public.platform_workflow_timers
  for select to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_timers.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );

drop policy if exists platform_workflow_timers_write on public.platform_workflow_timers;
create policy platform_workflow_timers_write on public.platform_workflow_timers
  for all to authenticated
  using (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_timers.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  )
  with check (
    exists (
      select 1 from public.platform_workflow_instances i
      where i.id = platform_workflow_timers.instance_id
        and (i.school_id is null or can_access_school(i.school_id))
    )
  );
