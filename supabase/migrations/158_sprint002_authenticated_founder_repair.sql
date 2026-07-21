-- Sprint 002 – Authenticated Founder provisioning repair (data only)
--
-- Why this exists
-- ---------------
-- supabase_migrations.schema_migrations version 156 is recorded as
--   name = sprint002_executive_kpi_snapshots
-- That is the KPI schema migration, NOT founder identity provisioning.
--
-- A second local file also used version prefix 156
--   (156_sprint002_founder_identity_consolidation.sql).
-- Supabase matches migrations by version prefix only. Once 156 was applied
-- for executive_kpi_snapshots, the colliding founder file was treated as
-- already applied and never executed. Result:
--   auth.users has d346c418-26d0-47b0-8655-ce64173dffb1
--   public.users / user_roles / user_schools / user_org_assignments do not
--
-- Repair rules
-- ------------
-- - Do NOT modify or re-run migration 156 (history preserved).
-- - Do NOT touch UI / RBAC / middleware / application code.
-- - Do NOT delete or demote seed Founder jimmy@theacademyway.org.
-- - Fully idempotent (canonical provisioning migration; 157 archived as superseded).
--
-- Live (authenticated):
--   auth.users id = d346c418-26d0-47b0-8655-ce64173dffb1
--   email         = jimmy.arispe@theacademyway.org
--
-- Seed Founder (source; left intact):
--   public.users id = 30ce5241-4f02-4bdf-88be-075f67723f09
--   email           = jimmy@theacademyway.org

do $$
declare
  v_live_id uuid := 'd346c418-26d0-47b0-8655-ce64173dffb1';
  v_seed_id uuid := '30ce5241-4f02-4bdf-88be-075f67723f09';
  v_live_email text := 'jimmy.arispe@theacademyway.org';
  v_seed_email text := 'jimmy@theacademyway.org';
  v_live_auth_exists boolean;
  v_seed_profile_exists boolean;
begin
  select exists(select 1 from auth.users where id = v_live_id)
    into v_live_auth_exists;

  if not v_live_auth_exists then
    raise exception
      'Authenticated Founder repair aborted: auth.users missing for % (%)',
      v_live_email, v_live_id;
  end if;

  select exists(select 1 from public.users where id = v_seed_id)
    into v_seed_profile_exists;

  if not v_seed_profile_exists then
    select u.id
    into v_seed_id
    from public.users u
    where lower(u.email) = lower(v_seed_email)
    limit 1;

    v_seed_profile_exists := found;
  end if;

  if not v_seed_profile_exists then
    raise exception
      'Authenticated Founder repair aborted: seed profile missing for %',
      v_seed_email;
  end if;

  -- -------------------------------------------------
  -- 1) public.users for live auth UUID (if missing)
  -- -------------------------------------------------
  insert into public.users (id, email, full_name)
  select
    au.id,
    lower(au.email),
    coalesce(
      nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(au.raw_user_meta_data ->> 'name'), ''),
      (select u.full_name from public.users u where u.id = v_seed_id),
      'Jimmy Arispe'
    )
  from auth.users au
  where au.id = v_live_id
  on conflict (id) do nothing;

  -- -------------------------------------------------
  -- 2) user_roles: copy seed roles; always ensure FOUNDER + SCHOOL_LEADER
  -- -------------------------------------------------
  insert into public.user_roles (user_id, role_id)
  select v_live_id, ur.role_id
  from public.user_roles ur
  where ur.user_id = v_seed_id
  on conflict do nothing;

  insert into public.user_roles (user_id, role_id)
  select v_live_id, r.id
  from public.roles r
  where r.name in ('FOUNDER', 'SCHOOL_LEADER')
  on conflict do nothing;

  -- -------------------------------------------------
  -- 3) user_schools (copy seed; fallback = all schools)
  -- -------------------------------------------------
  if exists (select 1 from public.user_schools where user_id = v_seed_id) then
    insert into public.user_schools (user_id, school_id)
    select v_live_id, us.school_id
    from public.user_schools us
    where us.user_id = v_seed_id
    on conflict do nothing;
  else
    insert into public.user_schools (user_id, school_id)
    select v_live_id, s.id
    from public.schools s
    on conflict do nothing;
  end if;

  -- -------------------------------------------------
  -- 4) user_org_assignments
  -- NULL-safe: unique constraint does not use NULLS NOT DISTINCT,
  -- so ON CONFLICT cannot detect duplicates when campus/program/department are NULL.
  -- -------------------------------------------------
  if exists (select 1 from public.user_org_assignments where user_id = v_seed_id) then
    insert into public.user_org_assignments (
      user_id,
      school_id,
      campus_id,
      program_id,
      department_id,
      all_campuses,
      all_programs,
      is_primary
    )
    select
      v_live_id,
      uoa.school_id,
      uoa.campus_id,
      uoa.program_id,
      uoa.department_id,
      uoa.all_campuses,
      uoa.all_programs,
      uoa.is_primary
    from public.user_org_assignments uoa
    where uoa.user_id = v_seed_id
      and not exists (
        select 1
        from public.user_org_assignments existing
        where existing.user_id = v_live_id
          and existing.school_id = uoa.school_id
          and existing.campus_id is not distinct from uoa.campus_id
          and existing.program_id is not distinct from uoa.program_id
          and existing.department_id is not distinct from uoa.department_id
      );
  else
    insert into public.user_org_assignments (
      user_id, school_id, all_campuses, all_programs, is_primary
    )
    select v_live_id, us.school_id, true, true, false
    from public.user_schools us
    where us.user_id = v_live_id
      and not exists (
        select 1
        from public.user_org_assignments existing
        where existing.user_id = v_live_id
          and existing.school_id = us.school_id
          and existing.campus_id is null
          and existing.program_id is null
          and existing.department_id is null
      );
  end if;

  -- Ensure at least one primary org assignment (Academy FL preferred)
  if not exists (
    select 1
    from public.user_org_assignments
    where user_id = v_live_id and is_primary = true
  ) then
    update public.user_org_assignments
    set is_primary = true
    where id = (
      select uoa.id
      from public.user_org_assignments uoa
      where uoa.user_id = v_live_id
      order by
        case
          when uoa.school_id = 'a1000000-0000-4000-8000-000000000001' then 0
          else 1
        end,
        uoa.created_at
      limit 1
    );
  end if;

  -- -------------------------------------------------
  -- 5) user_preferences (if seed has any)
  -- -------------------------------------------------
  insert into public.user_preferences (
    user_id,
    timezone,
    language,
    theme,
    dashboard_layout,
    notifications,
    accessibility,
    communication,
    mission_control_widgets
  )
  select
    v_live_id,
    up.timezone,
    up.language,
    up.theme,
    up.dashboard_layout,
    up.notifications,
    up.accessibility,
    up.communication,
    up.mission_control_widgets
  from public.user_preferences up
  where up.user_id = v_seed_id
  on conflict (user_id) do nothing;

  raise notice
    'Authenticated Founder repair applied: % (%) from seed % (%)',
    v_live_email, v_live_id, v_seed_email, v_seed_id;
end $$;
