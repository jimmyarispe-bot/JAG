-- =========================================
-- B-09 PHASE 1: KNOWLEDGE & EVIDENCE ENGINE RLS (143)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_evidence_records enable row level security;

drop policy if exists platform_evidence_records_read on public.platform_evidence_records;
create policy platform_evidence_records_read on public.platform_evidence_records
  for select to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
    or (
      organization_id is not null
      and exists (
        select 1 from public.schools s
        where s.organization_id = platform_evidence_records.organization_id
          and can_access_school(s.id)
      )
    )
  );

drop policy if exists platform_evidence_records_insert on public.platform_evidence_records;
create policy platform_evidence_records_insert on public.platform_evidence_records
  for insert to authenticated
  with check (
    school_id is null
    or can_access_school(school_id)
  );

drop policy if exists platform_evidence_records_update on public.platform_evidence_records;
create policy platform_evidence_records_update on public.platform_evidence_records
  for update to authenticated
  using (
    school_id is null
    or can_access_school(school_id)
  )
  with check (
    school_id is null
    or can_access_school(school_id)
  );

grant select, insert, update on table public.platform_evidence_records to authenticated;
grant all on table public.platform_evidence_records to service_role;

notify pgrst, 'reload schema';
