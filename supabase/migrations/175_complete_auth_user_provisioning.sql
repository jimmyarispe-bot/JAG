-- =========================================
-- Complete auth user provisioning
-- Extends 174: public.users + default org membership,
-- user_org_assignments, default TEAM_MEMBER role,
-- optional Founder bootstrap via auth_provisioning_config.
-- Idempotent: ON CONFLICT DO NOTHING throughout.
-- =========================================

-- -----------------------------------------
-- Config (singleton): default org + founder bootstrap emails
-- -----------------------------------------

create table if not exists public.auth_provisioning_config (
  id smallint primary key default 1 check (id = 1),
  default_org_slug text not null default 'the-academy-way',
  default_role_name text not null default 'TEAM_MEMBER',
  founder_bootstrap_emails text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

insert into public.auth_provisioning_config (
  id,
  default_org_slug,
  default_role_name,
  founder_bootstrap_emails
)
values (
  1,
  'the-academy-way',
  'TEAM_MEMBER',
  array[
    'jimmy@academyos.org',
    'jimmy.arispe@theacademyway.org'
  ]::text[]
)
on conflict (id) do nothing;

-- -----------------------------------------
-- Default Team Member role
-- -----------------------------------------

insert into public.roles (name, display_name, description, is_system, sort_order)
values (
  'TEAM_MEMBER',
  'Team Member',
  'Default role for newly provisioned authenticated users.',
  true,
  150
)
on conflict (name) do update set
  display_name = coalesce(excluded.display_name, roles.display_name),
  description = coalesce(excluded.description, roles.description),
  is_system = true,
  sort_order = excluded.sort_order;

-- Minimal AcademyOS access so provisioned users can enter the app
insert into public.platform_permissions (permission_key, name, description, module, category, sort_order)
values (
  'ACADEMYOS_ACCESS',
  'AcademyOS Access',
  'Access to the AcademyOS application and school operations.',
  'iam',
  'access',
  20
)
on conflict (permission_key) do nothing;

insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join (
  values
    ('ACADEMYOS_ACCESS'),
    ('org.view'),
    ('directory.view'),
    ('mission_control.access')
) as p(permission_key)
where r.name = 'TEAM_MEMBER'
  and exists (
    select 1
    from public.platform_permissions pp
    where pp.permission_key = p.permission_key
  )
on conflict (role_id, permission_key) do nothing;

-- Make user_org_assignments unique constraint NULL-safe so ON CONFLICT works
do $$
begin
  -- Drop near-duplicate NULL-dimension rows before tightening uniqueness
  delete from public.user_org_assignments a
  using public.user_org_assignments b
  where a.ctid > b.ctid
    and a.user_id = b.user_id
    and a.school_id = b.school_id
    and a.campus_id is not distinct from b.campus_id
    and a.program_id is not distinct from b.program_id
    and a.department_id is not distinct from b.department_id;

  if exists (
    select 1
    from pg_constraint
    where conname = 'user_org_assignments_unique'
      and conrelid = 'public.user_org_assignments'::regclass
  ) then
    alter table public.user_org_assignments
      drop constraint user_org_assignments_unique;
  end if;

  alter table public.user_org_assignments
    add constraint user_org_assignments_unique
    unique nulls not distinct (user_id, school_id, campus_id, program_id, department_id);
exception
  when duplicate_table then null;
  when duplicate_object then null;
end $$;

-- -----------------------------------------
-- Core provisioner (SECURITY DEFINER)
-- -----------------------------------------

create or replace function public.provision_auth_user(
  p_user_id uuid,
  p_email text default null,
  p_full_name text default null,
  p_meta jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
  v_meta jsonb;
  v_org_id uuid;
  v_org_slug text;
  v_default_role text;
  v_bootstrap_emails text[];
  v_role_name text;
  v_is_founder boolean := false;
  v_primary_school_id uuid;
begin
  if p_user_id is null then
    return;
  end if;

  select
    coalesce(nullif(btrim(p_email), ''), au.email),
    coalesce(
      nullif(btrim(p_full_name), ''),
      nullif(btrim(coalesce(p_meta, au.raw_user_meta_data)->>'full_name'), ''),
      nullif(btrim(coalesce(p_meta, au.raw_user_meta_data)->>'name'), '')
    ),
    coalesce(p_meta, au.raw_user_meta_data, '{}'::jsonb)
  into v_email, v_full_name, v_meta
  from auth.users au
  where au.id = p_user_id;

  if v_email is null then
    -- auth row missing (should not happen on trigger path)
    v_email := nullif(btrim(p_email), '');
    v_full_name := nullif(btrim(p_full_name), '');
    v_meta := coalesce(p_meta, '{}'::jsonb);
  end if;

  if v_email is null then
    return;
  end if;

  -- 1) public.users
  insert into public.users (id, email, full_name)
  values (p_user_id, v_email, v_full_name)
  on conflict (id) do nothing;

  -- 2) Resolve provisioning config
  select
    c.default_org_slug,
    c.default_role_name,
    coalesce(c.founder_bootstrap_emails, '{}'::text[])
  into v_org_slug, v_default_role, v_bootstrap_emails
  from public.auth_provisioning_config c
  where c.id = 1;

  v_org_slug := coalesce(nullif(btrim(v_org_slug), ''), 'the-academy-way');
  v_default_role := coalesce(nullif(btrim(v_default_role), ''), 'TEAM_MEMBER');

  select o.id
  into v_org_id
  from public.org_organizations o
  where o.slug = v_org_slug
  order by o.created_at
  limit 1;

  if v_org_id is null then
    select o.id
    into v_org_id
    from public.org_organizations o
    order by o.created_at
    limit 1;
  end if;

  -- Founder bootstrap: configured email list and/or explicit metadata flag
  v_is_founder :=
    exists (
      select 1
      from unnest(v_bootstrap_emails) as e
      where nullif(btrim(e), '') is not null
        and lower(btrim(e)) = lower(v_email)
    )
    or lower(coalesce(v_meta->>'bootstrap_role', '')) = 'founder'
    or lower(coalesce(v_meta->>'role', '')) = 'founder';

  v_role_name := case when v_is_founder then 'FOUNDER' else v_default_role end;

  -- Ensure FOUNDER role exists when needed
  if v_is_founder then
    insert into public.roles (name, display_name, description, is_system, sort_order)
    values (
      'FOUNDER',
      'Founder',
      'Highest platform role with JAG and AcademyOS access.',
      true,
      1
    )
    on conflict (name) do nothing;
  end if;

  -- 3) Default (or Founder) role
  insert into public.user_roles (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.name = v_role_name
  on conflict (user_id, role_id) do nothing;

  -- 4) Organization membership
  if v_org_id is not null then
    insert into public.user_organization_memberships (
      organization_id,
      user_id,
      membership_role,
      status,
      is_primary,
      permissions,
      joined_at
    )
    values (
      v_org_id,
      p_user_id,
      case when v_is_founder then 'owner' else 'member' end,
      'active',
      true,
      case
        when v_is_founder then '["org.view","org.manage","users.view","users.manage"]'::jsonb
        else '["org.view"]'::jsonb
      end,
      now()
    )
    on conflict (organization_id, user_id) do nothing;

    -- Prefer Academy FL as primary school when present
    select s.id
    into v_primary_school_id
    from public.schools s
    where s.organization_id = v_org_id
      and s.id = 'a1000000-0000-4000-8000-000000000001'
    limit 1;

    if v_primary_school_id is null then
      select s.id
      into v_primary_school_id
      from public.schools s
      where s.organization_id = v_org_id
      order by s.created_at nulls last, s.name
      limit 1;
    end if;

    -- Founders: all org schools. Team members: one primary assignment.
    if v_is_founder then
      insert into public.user_schools (user_id, school_id)
      select p_user_id, s.id
      from public.schools s
      where s.organization_id = v_org_id
      on conflict (user_id, school_id) do nothing;

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
        p_user_id,
        s.id,
        null,
        null,
        null,
        true,
        true,
        (s.id = v_primary_school_id)
      from public.schools s
      where s.organization_id = v_org_id
      on conflict (user_id, school_id, campus_id, program_id, department_id) do nothing;
    elsif v_primary_school_id is not null then
      insert into public.user_schools (user_id, school_id)
      values (p_user_id, v_primary_school_id)
      on conflict (user_id, school_id) do nothing;

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
      values (
        p_user_id,
        v_primary_school_id,
        null,
        null,
        null,
        true,
        true,
        true
      )
      on conflict (user_id, school_id, campus_id, program_id, department_id) do nothing;
    end if;
  end if;
end;
$$;

revoke all on function public.provision_auth_user(uuid, text, text, jsonb) from public;
grant execute on function public.provision_auth_user(uuid, text, text, jsonb) to service_role;

-- Authenticated self-heal: only the caller's own auth.uid()
create or replace function public.provision_current_auth_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.provision_auth_user(v_uid);
end;
$$;

revoke all on function public.provision_current_auth_user() from public;
grant execute on function public.provision_current_auth_user() to authenticated, service_role;

-- -----------------------------------------
-- Trigger: keep public.users path; add full provision
-- -----------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.provision_auth_user(
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'name'), '')
    ),
    new.raw_user_meta_data
  );
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- -----------------------------------------
-- Backfill: existing auth users missing membership/role
-- -----------------------------------------

do $$
declare
  r record;
begin
  for r in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
  loop
    perform public.provision_auth_user(
      r.id,
      r.email,
      coalesce(
        nullif(btrim(r.raw_user_meta_data->>'full_name'), ''),
        nullif(btrim(r.raw_user_meta_data->>'name'), '')
      ),
      r.raw_user_meta_data
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
