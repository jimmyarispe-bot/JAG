-- =========================================
-- PHASE 2: PLATFORM SERVICES RLS (133)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_activity_events enable row level security;
alter table public.platform_relationship_type_definitions enable row level security;
alter table public.platform_relationships enable row level security;
alter table public.platform_tags enable row level security;
alter table public.platform_entity_tags enable row level security;
alter table public.platform_notes enable row level security;
alter table public.platform_note_visibility_grants enable row level security;

-- Activity events: school-scoped read/write for staff with school access
drop policy if exists platform_activity_read on public.platform_activity_events;
create policy platform_activity_read on public.platform_activity_events
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or (
      organization_id is not null
      and exists (
        select 1 from public.schools s
        where s.organization_id = platform_activity_events.organization_id
          and can_access_school(s.id)
      )
    )
  );

drop policy if exists platform_activity_insert on public.platform_activity_events;
create policy platform_activity_insert on public.platform_activity_events
  for insert to authenticated
  with check (
    school_id is null
    or can_access_school(school_id)
  );

-- Relationship type catalog: read-only for authenticated users
drop policy if exists platform_relationship_types_read on public.platform_relationship_type_definitions;
create policy platform_relationship_types_read on public.platform_relationship_type_definitions
  for select to authenticated using (true);

-- Relationships: org/school scoped
drop policy if exists platform_relationships_read on public.platform_relationships;
create policy platform_relationships_read on public.platform_relationships
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or exists (
      select 1 from public.schools s
      where s.organization_id = platform_relationships.organization_id
        and can_access_school(s.id)
    )
  );

drop policy if exists platform_relationships_write on public.platform_relationships;
create policy platform_relationships_write on public.platform_relationships
  for all to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or exists (
      select 1 from public.schools s
      where s.organization_id = platform_relationships.organization_id
        and can_access_school(s.id)
    )
  )
  with check (
    school_id is null
    or can_access_school(school_id)
    or exists (
      select 1 from public.schools s
      where s.organization_id = platform_relationships.organization_id
        and can_access_school(s.id)
    )
  );

-- Tags: org-scoped
drop policy if exists platform_tags_read on public.platform_tags;
create policy platform_tags_read on public.platform_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.schools s
      where s.organization_id = platform_tags.organization_id
        and can_access_school(s.id)
    )
  );

drop policy if exists platform_tags_write on public.platform_tags;
create policy platform_tags_write on public.platform_tags
  for all to authenticated
  using (
    has_permission('configuration.manage')
    or has_permission('students.edit')
    or has_permission('configuration.admin')
  )
  with check (
    has_permission('configuration.manage')
    or has_permission('students.edit')
    or has_permission('configuration.admin')
  );

-- Entity tags
drop policy if exists platform_entity_tags_read on public.platform_entity_tags;
create policy platform_entity_tags_read on public.platform_entity_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.schools s
      where s.organization_id = platform_entity_tags.organization_id
        and can_access_school(s.id)
    )
  );

drop policy if exists platform_entity_tags_write on public.platform_entity_tags;
create policy platform_entity_tags_write on public.platform_entity_tags
  for all to authenticated
  using (
    has_permission('students.edit')
    or has_permission('students.view')
    or has_permission('configuration.manage')
  )
  with check (
    has_permission('students.edit')
    or has_permission('configuration.manage')
  );

-- Notes
drop policy if exists platform_notes_read on public.platform_notes;
create policy platform_notes_read on public.platform_notes
  for select to authenticated
  using (
    is_deleted = false
    and (
      school_id is null
      or can_access_school(school_id)
      or exists (
        select 1 from public.schools s
        where s.organization_id = platform_notes.organization_id
          and can_access_school(s.id)
      )
    )
    and (
      visibility in ('staff', 'leadership', 'parent_visible')
      or author_user_id = auth.uid()
      or auth.uid() = any(mentioned_user_ids)
      or exists (
        select 1 from public.platform_note_visibility_grants g
        where g.note_id = platform_notes.id and g.user_id = auth.uid()
      )
    )
  );

drop policy if exists platform_notes_write on public.platform_notes;
create policy platform_notes_write on public.platform_notes
  for all to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or author_user_id = auth.uid()
  )
  with check (
    school_id is null
    or can_access_school(school_id)
  );

-- Note visibility grants
drop policy if exists platform_note_grants_read on public.platform_note_visibility_grants;
create policy platform_note_grants_read on public.platform_note_visibility_grants
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.platform_notes n
      where n.id = note_id and n.author_user_id = auth.uid()
    )
  );

drop policy if exists platform_note_grants_write on public.platform_note_visibility_grants;
create policy platform_note_grants_write on public.platform_note_visibility_grants
  for insert to authenticated
  with check (
    exists (
      select 1 from public.platform_notes n
      where n.id = note_id and n.author_user_id = auth.uid()
    )
  );

grant select, insert on table public.platform_activity_events to authenticated;
grant select on table public.platform_relationship_type_definitions to authenticated;
grant select, insert, update, delete on table public.platform_relationships to authenticated;
grant select, insert, update on table public.platform_tags to authenticated;
grant select, insert, delete on table public.platform_entity_tags to authenticated;
grant select, insert, update on table public.platform_notes to authenticated;
grant select, insert on table public.platform_note_visibility_grants to authenticated;

grant all on table public.platform_activity_events to service_role;
grant all on table public.platform_relationship_type_definitions to service_role;
grant all on table public.platform_relationships to service_role;
grant all on table public.platform_tags to service_role;
grant all on table public.platform_entity_tags to service_role;
grant all on table public.platform_notes to service_role;
grant all on table public.platform_note_visibility_grants to service_role;

notify pgrst, 'reload schema';
