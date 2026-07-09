-- =========================================
-- B-06 PHASE 2: PLATFORM EVENT ENGINE RLS (139)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_event_records enable row level security;

drop policy if exists platform_event_records_read on public.platform_event_records;
create policy platform_event_records_read on public.platform_event_records
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or (
      organization_id is not null
      and exists (
        select 1 from public.schools s
        where s.organization_id = platform_event_records.organization_id
          and can_access_school(s.id)
      )
    )
  );

drop policy if exists platform_event_records_insert on public.platform_event_records;
create policy platform_event_records_insert on public.platform_event_records
  for insert to authenticated
  with check (
    school_id is null
    or can_access_school(school_id)
  );

grant select, insert on table public.platform_event_records to authenticated;
grant all on table public.platform_event_records to service_role;

notify pgrst, 'reload schema';
