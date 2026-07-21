-- Sprint 002 – Founder Identity Consolidation
-- Make the live authenticated account the Founder identity.
--
-- Live (authenticated locally):
--   auth.users id = d346c418-26d0-47b0-8655-ce64173dffb1
--   email         = jimmy.arispe@theacademyway.org
--
-- Seeded Founder (reference):
--   auth.users id = 30ce5241-4f02-4bdf-88be-075f67723f09
--   email         = jimmy@theacademyway.org
--   roles         = SCHOOL_LEADER, FOUNDER
--   schools       = Academy FL/GA/HS/Virtual
--
-- Constraint: public.users.id MUST equal auth.users.id (users_auth_fk).
-- Therefore we cannot merge UUIDs; we provision the live auth user with the
-- same profile / roles / school / org assignments as the seed Founder.
--
-- Idempotent. Does not delete or demote the seed jimmy@theacademyway.org account.
-- Does not modify application code. Does not touch auth.users passwords.

do $$
declare
  v_live_id uuid := 'd346c418-26d0-47b0-8655-ce64173dffb1';
  v_seed_id uuid := '30ce5241-4f02-4bdf-88be-075f67723f09';
  v_live_email text := 'jimmy.arispe@theacademyway.org';
  v_seed_email text := 'jimmy@theacademyway.org';
  v_live_exists boolean;
  v_seed_exists boolean;
begin
  select exists(select 1 from auth.users where id = v_live_id) into v_live_exists;
  select exists(select 1 from auth.users where id = v_seed_id) into v_seed_exists;

  if not v_live_exists then
    raise exception
      'Founder consolidation aborted: auth.users missing for % (%)',
      v_live_email, v_live_id;
  end if;

  -- -------------------------------------------------
  -- 1) public.users profile for live auth user
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
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.users.full_name, excluded.full_name);

  -- -------------------------------------------------
  -- 2) Roles: copy seed roles when present; always ensure FOUNDER + SCHOOL_LEADER
  -- -------------------------------------------------
  if v_seed_exists then
    insert into public.user_roles (user_id, role_id)
    select v_live_id, ur.role_id
    from public.user_roles ur
    where ur.user_id = v_seed_id
    on conflict do nothing;
  end if;

  insert into public.user_roles (user_id, role_id)
  select v_live_id, r.id
  from public.roles r
  where r.name in ('FOUNDER', 'SCHOOL_LEADER')
  on conflict do nothing;

  -- -------------------------------------------------
  -- 3) School assignments (user_schools)
  -- Prefer copy from seed; fallback = all schools
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
  -- 4) Org assignments (canonical multi-school membership)
  -- Copy seed rows; ensure one primary school
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
    on conflict do nothing;
  else
    insert into public.user_org_assignments (
      user_id, school_id, all_campuses, all_programs, is_primary
    )
    select v_live_id, us.school_id, true, true, false
    from public.user_schools us
    where us.user_id = v_live_id
    on conflict do nothing;
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

  raise notice
    'Founder identity consolidated onto % (%) from seed % (%)',
    v_live_email, v_live_id, v_seed_email, v_seed_id;
end $$;

-- -------------------------------------------------
-- Verification helpers (read-only; safe to re-run)
-- -------------------------------------------------
-- Expected after apply:
--   public.users          : 1 row for d346c418-...
--   user_roles            : FOUNDER + SCHOOL_LEADER (and any other seed roles)
--   user_schools          : 4 schools
--   user_org_assignments  : 4 schools, exactly one is_primary = true
