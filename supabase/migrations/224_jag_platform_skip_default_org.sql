-- JAG-only identities may exist without an AcademyOS organization.
-- Trust boundary: explicit service-role function arguments only.
-- Does NOT replace provision_auth_user (175). Does NOT read privileges from
-- auth.raw_user_meta_data. Does NOT change RLS, existing users, or roles.

-- Callable only by service_role after the JAG Platform Users authorization gate.
-- p_role is an explicit server argument — never copied from user_metadata.
-- p_strip_default_org removes only default trigger artifacts (TEAM_MEMBER +
-- default org/school bind). It refuses to strip when the user already has any
-- other role (CEO, FOUNDER, TEACHER, …).

create or replace function public.provision_jag_only_identity(
  p_user_id uuid,
  p_role text,
  p_strip_default_org boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
  v_role text;
  v_has_protected_role boolean := false;
begin
  if p_user_id is null then
    raise exception 'provision_jag_only_identity: user_id is required';
  end if;

  v_role := upper(btrim(coalesce(p_role, '')));
  if v_role not in ('PLATFORM_OWNER', 'PLATFORM_ADMIN') then
    raise exception 'provision_jag_only_identity: role % is not allowed', v_role;
  end if;

  select au.email,
    coalesce(
      nullif(btrim(au.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(au.raw_user_meta_data->>'name'), ''),
      au.email
    )
  into v_email, v_full_name
  from auth.users au
  where au.id = p_user_id;

  if v_email is null then
    raise exception 'provision_jag_only_identity: auth user not found';
  end if;

  insert into public.users (id, email, full_name)
  values (p_user_id, v_email, v_full_name)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.name = v_role
  on conflict (user_id, role_id) do nothing;

  if not p_strip_default_org then
    return;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.name not in ('TEAM_MEMBER', 'PLATFORM_OWNER', 'PLATFORM_ADMIN')
  )
  into v_has_protected_role;

  -- Existing AcademyOS / Founder identities must keep memberships and roles.
  if v_has_protected_role then
    return;
  end if;

  delete from public.user_organization_memberships
  where user_id = p_user_id;

  delete from public.user_org_assignments
  where user_id = p_user_id;

  delete from public.user_schools
  where user_id = p_user_id;

  delete from public.user_roles ur
  using public.roles r
  where ur.role_id = r.id
    and ur.user_id = p_user_id
    and r.name = 'TEAM_MEMBER';
end;
$$;

revoke all on function public.provision_jag_only_identity(uuid, text, boolean) from public;
revoke all on function public.provision_jag_only_identity(uuid, text, boolean) from anon;
revoke all on function public.provision_jag_only_identity(uuid, text, boolean) from authenticated;
grant execute on function public.provision_jag_only_identity(uuid, text, boolean) to service_role;

comment on function public.provision_jag_only_identity(uuid, text, boolean) is
  'Service-role only. Assigns an explicit JAG platform role. Never reads privilege from user_metadata. Strips default org bind only when the user has no protected AcademyOS/Founder roles.';

-- Trusted skip for session self-heal. Uses existing user_roles only — never
-- auth.raw_user_meta_data. Stacy (CEO) and Jimmy (FOUNDER) do not match.
create or replace function public.jag_identity_skips_default_org(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.name in ('PLATFORM_OWNER', 'PLATFORM_ADMIN')
    )
    and not exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.name not in ('TEAM_MEMBER', 'PLATFORM_OWNER', 'PLATFORM_ADMIN')
    );
$$;

revoke all on function public.jag_identity_skips_default_org(uuid) from public;
revoke all on function public.jag_identity_skips_default_org(uuid) from anon;
revoke all on function public.jag_identity_skips_default_org(uuid) from authenticated;
grant execute on function public.jag_identity_skips_default_org(uuid) to service_role;

comment on function public.jag_identity_skips_default_org(uuid) is
  'True when the user already has a JAG platform role and no AcademyOS/Founder roles. Never reads user_metadata.';

-- Keep provision_auth_user (175) unchanged. Only the authenticated self-heal
-- must not re-attach AcademyOS membership to an established JAG-only identity.
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

  if public.jag_identity_skips_default_org(v_uid) then
    return;
  end if;

  perform public.provision_auth_user(v_uid);
end;
$$;

revoke all on function public.provision_current_auth_user() from public;
grant execute on function public.provision_current_auth_user() to authenticated, service_role;
