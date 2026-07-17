-- =========================================
-- B.1 Security Remediation
-- - rpt_* views: security_invoker (close RLS bypass)
-- - Finance operational RLS: FINANCE_ACCESS / finance.view
-- - student-documents storage policies
-- - platform_notes / platform_relationships org hardening
-- - Durable rate-limit bucket RPC (public inquiry / API abuse)
-- Idempotent
-- =========================================

-- ---------------------------------------------------------------------------
-- 1. Report views — invoke as caller (Postgres 15+)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.relname as viewname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and c.relname like 'rpt_%'
  loop
    begin
      execute format('alter view public.%I set (security_invoker = true)', r.viewname);
    exception
      when others then
        raise notice 'security_invoker skipped for %: %', r.viewname, sqlerrm;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Finance operational tables — school + finance permission
-- ---------------------------------------------------------------------------
create or replace function public.can_access_finance_school(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    can_access_school(p_school_id)
    and (
      is_enterprise_admin()
      or has_permission('FINANCE_ACCESS')
      or has_permission('finance.view')
      or has_permission('finance.override_tuition')
    );
$$;

revoke all on function public.can_access_finance_school(uuid) from public;
grant execute on function public.can_access_finance_school(uuid) to authenticated;

drop policy if exists financial_transactions_staff_all on public.financial_transactions;
create policy financial_transactions_staff_all
on public.financial_transactions for all
to authenticated
using (can_access_finance_school(school_id))
with check (can_access_finance_school(school_id));

drop policy if exists budget_forecast_snapshots_staff_all on public.budget_forecast_snapshots;
create policy budget_forecast_snapshots_staff_all
on public.budget_forecast_snapshots for all
to authenticated
using (can_access_finance_school(school_id))
with check (can_access_finance_school(school_id));

drop policy if exists payroll_cost_allocations_staff_all on public.payroll_cost_allocations;
create policy payroll_cost_allocations_staff_all
on public.payroll_cost_allocations for all
to authenticated
using (can_access_finance_school(school_id))
with check (can_access_finance_school(school_id));

-- ---------------------------------------------------------------------------
-- 3. Storage — student-documents private bucket policies
-- Path convention: {student_id}/...
-- ---------------------------------------------------------------------------
drop policy if exists student_documents_staff_all on storage.objects;
create policy student_documents_staff_all
on storage.objects
for all
to authenticated
using (
  bucket_id = 'student-documents'
  and (
    is_enterprise_admin()
    or (
      (has_permission('students.view') or has_permission('students.edit') or has_permission('FINANCE_ACCESS'))
      and exists (
        select 1 from public.students s
        where s.id::text = (storage.foldername(name))[1]
          and can_access_school(s.school_id)
      )
    )
  )
)
with check (
  bucket_id = 'student-documents'
  and (
    is_enterprise_admin()
    or (
      (has_permission('students.edit') or has_permission('students.view'))
      and exists (
        select 1 from public.students s
        where s.id::text = (storage.foldername(name))[1]
          and can_access_school(s.school_id)
      )
    )
  )
);

drop policy if exists student_documents_parent_read on storage.objects;
create policy student_documents_parent_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-documents'
  and exists (
    select 1 from public.students s
    where s.id::text = (storage.foldername(name))[1]
      and is_parent_of_student(s.id)
  )
);

-- Ensure bucket remains private
update storage.buckets
set public = false
where id = 'student-documents';

-- ---------------------------------------------------------------------------
-- 4. Platform notes / relationships — require org membership; no open null-school
-- ---------------------------------------------------------------------------
drop policy if exists platform_relationships_read on public.platform_relationships;
create policy platform_relationships_read on public.platform_relationships
  for select to authenticated
  using (
    exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_relationships.organization_id
        and m.status = 'active'
    )
    and (
      school_id is null
      or can_access_school(school_id)
    )
  );

drop policy if exists platform_relationships_write on public.platform_relationships;
create policy platform_relationships_write on public.platform_relationships
  for all to authenticated
  using (
    exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_relationships.organization_id
        and m.status = 'active'
    )
    and (school_id is null or can_access_school(school_id))
  )
  with check (
    exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_relationships.organization_id
        and m.status = 'active'
    )
    and (school_id is null or can_access_school(school_id))
  );

drop policy if exists platform_notes_read on public.platform_notes;
create policy platform_notes_read on public.platform_notes
  for select to authenticated
  using (
    is_deleted = false
    and exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_notes.organization_id
        and m.status = 'active'
    )
    and (school_id is null or can_access_school(school_id))
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
    exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_notes.organization_id
        and m.status = 'active'
    )
    and (school_id is null or can_access_school(school_id) or author_user_id = auth.uid())
  )
  with check (
    exists (
      select 1 from public.user_organization_memberships m
      where m.user_id = auth.uid()
        and m.organization_id = platform_notes.organization_id
        and m.status = 'active'
    )
    and (school_id is null or can_access_school(school_id))
  );

-- ---------------------------------------------------------------------------
-- 5. Durable rate-limit buckets (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create table if not exists public.api_rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0
);

alter table public.api_rate_limit_buckets enable row level security;

drop policy if exists api_rate_limit_buckets_deny_all on public.api_rate_limit_buckets;
create policy api_rate_limit_buckets_deny_all
on public.api_rate_limit_buckets
for all
to authenticated, anon
using (false)
with check (false);

create or replace function public.check_rate_limit_bucket(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.api_rate_limit_buckets%rowtype;
  v_window interval := make_interval(secs => greatest(p_window_seconds, 1));
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return false;
  end if;

  select * into v_row from public.api_rate_limit_buckets where bucket_key = p_key for update;
  if not found then
    insert into public.api_rate_limit_buckets (bucket_key, window_started_at, hit_count)
    values (p_key, v_now, 1);
    return true;
  end if;

  if v_row.window_started_at + v_window <= v_now then
    update public.api_rate_limit_buckets
    set window_started_at = v_now, hit_count = 1
    where bucket_key = p_key;
    return true;
  end if;

  if v_row.hit_count >= p_limit then
    return false;
  end if;

  update public.api_rate_limit_buckets
  set hit_count = hit_count + 1
  where bucket_key = p_key;
  return true;
end;
$$;

revoke all on function public.check_rate_limit_bucket(text, integer, integer) from public;
grant execute on function public.check_rate_limit_bucket(text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';
