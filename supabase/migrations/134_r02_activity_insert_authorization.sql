-- =========================================
-- R-02.1: Platform activity insert authorization (134)
-- Idempotent: safe to re-run
-- =========================================

drop policy if exists platform_activity_insert on public.platform_activity_events;
create policy platform_activity_insert on public.platform_activity_events
  for insert to authenticated
  with check (
    (school_id is not null and can_access_school(school_id))
    or (
      organization_id is not null
      and exists (
        select 1 from public.schools s
        where s.organization_id = platform_activity_events.organization_id
          and can_access_school(s.id)
      )
    )
  );
