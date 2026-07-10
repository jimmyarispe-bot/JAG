-- Sprint 002 – Authenticated Founder Identity Consolidation
--
-- Root cause: authenticated auth.users has no matching public.users row,
-- so RBAC resolves roles=[], permissionCount=0, visibleCards=[].
--
-- Live (authenticated):
--   auth.users id = d346c418-26d0-47b0-8655-ce64173dffb1
--   email         = jimmy.arispe@theacademyway.org
--
-- Seed Founder (source of roles / schools / org / prefs; left intact):
--   public.users id = 30ce5241-4f02-4bdf-88be-075f67723f09
--   email           = jimmy@academyos.org
--
-- Constraint: public.users.id MUST equal auth.users.id (users_auth_fk).
-- Idempotent. Does not delete, rename, or modify jimmy@academyos.org.
-- Does not change application / RBAC / auth / middleware / UI code.

do $$
declare
  v_live_id uuid := 'd346c418-26d0-47b0-8655-ce64173dffb1';
  v_seed_id uuid := '30ce5241-4f02-4bdf-88be-075f67723f09';
  v_live_email text := 'jimmy.arispe@theacademyway.org';
  v_seed_email text := 'jimmy@academyos.org';
  v_live_auth_exists boolean;
  v_seed_profile_exists boolean;
begin
  select exists(select 1 from auth.users where id = v_live_id)
    into v_live_auth_exists;

  if not v_live_auth_exists then
    raise exception
      'Authenticated Founder provision aborted: auth.users missing for % (%)',
      v_live_email, v_live_id;
  end if;

  select exists(select 1 from public.users where id = v_seed_id)
    into v_seed_profile_exists;

  if not v_seed_profile_exists then
    -- Fallback: resolve seed by email if UUID row is absent
    select u.id
    into v_seed_id
    from public.users u
    where lower(u.email) = lower(v_seed_email)
    limit 1;

    v_seed_profile_exists := found;
  end if;

  if not v_seed_profile_exists then
    raise exception
      'Authenticated Founder provision aborted: seed profile missing for %',
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
  -- 2) user_roles (copy every seed role)
  -- -------------------------------------------------
  insert into public.user_roles (user_id, role_id)
  select v_live_id, ur.role_id
  from public.user_roles ur
  where ur.user_id = v_seed_id
  on conflict do nothing;

  -- -------------------------------------------------
  -- 3) user_schools
  -- -------------------------------------------------
  insert into public.user_schools (user_id, school_id)
  select v_live_id, us.school_id
  from public.user_schools us
  where us.user_id = v_seed_id
  on conflict do nothing;

  -- -------------------------------------------------
  -- 4) user_org_assignments
  -- NULL-safe: unique constraint does not use NULLS NOT DISTINCT,
  -- so ON CONFLICT cannot detect duplicates when campus/program/department are NULL.
  -- -------------------------------------------------
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
    'Authenticated Founder provisioned: % (%) from seed % (%)',
    v_live_email, v_live_id, v_seed_email, v_seed_id;
end $$;

-- -------------------------------------------------
-- Verification (authenticated UUID)
-- -------------------------------------------------
select 'public.users' as check_name, id, email, full_name, created_at
from public.users
where id = 'd346c418-26d0-47b0-8655-ce64173dffb1';

select
  'user_roles' as check_name,
  ur.user_id,
  r.name as role_name
from public.user_roles ur
join public.roles r on r.id = ur.role_id
where ur.user_id = 'd346c418-26d0-47b0-8655-ce64173dffb1'
order by r.name;

select 'user_schools' as check_name, us.user_id, us.school_id, s.name as school_name
from public.user_schools us
left join public.schools s on s.id = us.school_id
where us.user_id = 'd346c418-26d0-47b0-8655-ce64173dffb1'
order by s.name;

select
  'user_org_assignments' as check_name,
  uoa.user_id,
  uoa.school_id,
  s.name as school_name,
  uoa.campus_id,
  uoa.program_id,
  uoa.department_id,
  uoa.all_campuses,
  uoa.all_programs,
  uoa.is_primary
from public.user_org_assignments uoa
left join public.schools s on s.id = uoa.school_id
where uoa.user_id = 'd346c418-26d0-47b0-8655-ce64173dffb1'
order by s.name, uoa.is_primary desc;
