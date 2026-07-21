-- =========================================
-- SPRINT 002: Organizations as first-class entities
-- Name, Type, Owner, Subscription, Status, Timezone,
-- Branding, Users, Schools, Permissions + isolation helpers
-- =========================================

-- -----------------------------------------
-- Extend org_organizations
-- -----------------------------------------

alter table public.org_organizations
  add column if not exists org_type text not null default 'school_network';

alter table public.org_organizations
  add column if not exists owner_user_id uuid references public.users(id) on delete set null;

alter table public.org_organizations
  add column if not exists subscription_plan_key text;

alter table public.org_organizations
  add column if not exists subscription_status text not null default 'none';

alter table public.org_organizations
  add column if not exists timezone text not null default 'America/New_York';

alter table public.org_organizations
  add column if not exists branding jsonb not null default '{}'::jsonb;

-- Align status values for multi-tenant lifecycle (keep existing rows valid)
do $$
begin
  alter table public.org_organizations drop constraint if exists org_organizations_status_check;
exception
  when undefined_object then null;
end $$;

alter table public.org_organizations
  drop constraint if exists org_organizations_status_check;

alter table public.org_organizations
  add constraint org_organizations_status_check
  check (status in ('active', 'inactive', 'archived', 'suspended', 'provisioning'));

alter table public.org_organizations
  drop constraint if exists org_organizations_org_type_check;

alter table public.org_organizations
  add constraint org_organizations_org_type_check
  check (org_type in (
    'school_network',
    'single_school',
    'enterprise',
    'charter',
    'private',
    'other'
  ));

alter table public.org_organizations
  drop constraint if exists org_organizations_subscription_status_check;

alter table public.org_organizations
  add constraint org_organizations_subscription_status_check
  check (subscription_status in (
    'none',
    'trial',
    'active',
    'past_due',
    'canceled',
    'suspended'
  ));

create index if not exists idx_org_organizations_owner
  on public.org_organizations(owner_user_id);

create index if not exists idx_org_organizations_type
  on public.org_organizations(org_type);

create index if not exists idx_org_organizations_status
  on public.org_organizations(status);

-- -----------------------------------------
-- Org membership (users ↔ organizations)
-- -----------------------------------------

create table if not exists public.user_organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.org_organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  membership_role text not null default 'member'
    check (membership_role in ('owner', 'admin', 'member', 'guest')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'deactivated')),
  is_primary boolean not null default false,
  permissions jsonb not null default '[]'::jsonb,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_organization_memberships_unique unique (organization_id, user_id)
);

create index if not exists idx_user_org_memberships_user
  on public.user_organization_memberships(user_id);

create index if not exists idx_user_org_memberships_org
  on public.user_organization_memberships(organization_id);

create index if not exists idx_user_org_memberships_primary
  on public.user_organization_memberships(user_id, is_primary)
  where is_primary = true;

drop trigger if exists user_organization_memberships_set_updated_at
  on public.user_organization_memberships;
create trigger user_organization_memberships_set_updated_at
  before update on public.user_organization_memberships
  for each row execute function public.trigger_set_updated_at();

-- At most one primary membership per user
create unique index if not exists idx_user_org_memberships_one_primary
  on public.user_organization_memberships(user_id)
  where is_primary = true and status = 'active';

-- -----------------------------------------
-- Isolation helpers
-- -----------------------------------------

create or replace function public.is_organization_member(check_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = check_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_organization_admin(check_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = check_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.membership_role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.org_organizations o
    where o.id = check_organization_id
      and o.owner_user_id = auth.uid()
  );
$$;

create or replace function public.user_can_access_organization(
  check_user_id uuid,
  check_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = check_user_id
      and r.name in ('FOUNDER', 'CEO')
  )
  or exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = check_organization_id
      and m.user_id = check_user_id
      and m.status = 'active'
  )
  or exists (
    select 1
    from public.org_organizations o
    where o.id = check_organization_id
      and o.owner_user_id = check_user_id
  );
$$;

create or replace function public.can_access_organization(check_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_can_access_organization(auth.uid(), check_organization_id);
$$;

-- -----------------------------------------
-- RLS: membership table + org isolation
-- -----------------------------------------

alter table public.user_organization_memberships enable row level security;

drop policy if exists user_organization_memberships_read
  on public.user_organization_memberships;
create policy user_organization_memberships_read
  on public.user_organization_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_organization_admin(organization_id)
    or has_permission('org.view')
    or has_permission('users.view')
    or has_role('FOUNDER')
    or has_role('CEO')
  );

drop policy if exists user_organization_memberships_manage
  on public.user_organization_memberships;
create policy user_organization_memberships_manage
  on public.user_organization_memberships
  for all to authenticated
  using (
    public.is_organization_admin(organization_id)
    or has_permission('org.manage')
    or has_permission('users.manage')
    or has_role('FOUNDER')
  )
  with check (
    public.is_organization_admin(organization_id)
    or has_permission('org.manage')
    or has_permission('users.manage')
    or has_role('FOUNDER')
  );

-- Organization row access: members see their orgs; platform admins retain global view
drop policy if exists org_organizations_read on public.org_organizations;
create policy org_organizations_read on public.org_organizations
  for select to authenticated
  using (
    public.is_organization_member(id)
    or owner_user_id = auth.uid()
    or has_permission('org.view')
    or has_role('CEO')
    or has_role('FOUNDER')
  );

drop policy if exists org_organizations_manage on public.org_organizations;
create policy org_organizations_manage on public.org_organizations
  for all to authenticated
  using (
    public.is_organization_admin(id)
    or has_permission('org.manage')
    or has_role('FOUNDER')
  )
  with check (
    public.is_organization_admin(id)
    or has_permission('org.manage')
    or has_role('FOUNDER')
  );

-- Regions scoped to accessible organizations
drop policy if exists org_regions_read on public.org_regions;
create policy org_regions_read on public.org_regions
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    or has_permission('org.view')
    or has_role('CEO')
    or has_role('FOUNDER')
  );

drop policy if exists org_regions_manage on public.org_regions;
create policy org_regions_manage on public.org_regions
  for all to authenticated
  using (
    (
      public.is_organization_admin(organization_id)
      or has_permission('org.manage')
    )
  )
  with check (
    (
      public.is_organization_admin(organization_id)
      or has_permission('org.manage')
    )
  );

-- -----------------------------------------
-- Backfill seed org + memberships
-- -----------------------------------------

update public.org_organizations o
set
  org_type = coalesce(nullif(o.org_type, ''), 'school_network'),
  timezone = coalesce(nullif(o.timezone, ''), 'America/New_York'),
  branding = case
    when o.branding is null or o.branding = '{}'::jsonb then
      coalesce(
        (
          select cs.config_data
          from public.config_sections cs
          where cs.organization_id = o.id
            and cs.section_key = 'branding'
            and cs.school_id is null
          limit 1
        ),
        '{}'::jsonb
      )
    else o.branding
  end,
  subscription_status = case
    when exists (
      select 1
      from public.cloud_customers cc
      join public.cloud_subscriptions cs on cs.customer_id = cc.id
      where cc.organization_id = o.id
        and cs.status in ('active', 'trial')
    ) then 'active'
    else coalesce(nullif(o.subscription_status, ''), 'none')
  end,
  subscription_plan_key = coalesce(
    o.subscription_plan_key,
    (
      select cs.plan_key
      from public.cloud_customers cc
      join public.cloud_subscriptions cs on cs.customer_id = cc.id
      where cc.organization_id = o.id
      order by cs.created_at desc
      limit 1
    )
  );

-- Seed org owner (Founder)
update public.org_organizations o
set owner_user_id = coalesce(
  o.owner_user_id,
  (
    select u.id
    from public.users u
    where lower(u.email) = 'jimmy@theacademyway.org'
    limit 1
  )
)
where o.slug = 'the-academy-way';

-- Sync timezone from config when present
update public.org_organizations o
set timezone = coalesce(
  nullif(
    (
      select cs.config_data->>'timezone'
      from public.config_sections cs
      where cs.organization_id = o.id
        and cs.section_key = 'organization'
        and cs.school_id is null
      limit 1
    ),
    ''
  ),
  o.timezone
)
where exists (
  select 1
  from public.config_sections cs
  where cs.organization_id = o.id
    and cs.section_key = 'organization'
    and cs.school_id is null
    and nullif(cs.config_data->>'timezone', '') is not null
);

-- Membership for org owner
insert into public.user_organization_memberships (
  organization_id,
  user_id,
  membership_role,
  status,
  is_primary,
  permissions,
  joined_at
)
select
  o.id,
  o.owner_user_id,
  'owner',
  'active',
  true,
  '["org.view","org.manage","users.view","users.manage"]'::jsonb,
  now()
from public.org_organizations o
where o.owner_user_id is not null
  and not exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = o.id
      and m.user_id = o.owner_user_id
  );

-- Membership for users linked via schools in the org
insert into public.user_organization_memberships (
  organization_id,
  user_id,
  membership_role,
  status,
  is_primary,
  permissions,
  joined_at
)
select distinct
  s.organization_id,
  us.user_id,
  'member',
  'active',
  false,
  '[]'::jsonb,
  now()
from public.user_schools us
join public.schools s on s.id = us.school_id
where s.organization_id is not null
  and not exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = s.organization_id
      and m.user_id = us.user_id
  );

-- Also from user_org_assignments
insert into public.user_organization_memberships (
  organization_id,
  user_id,
  membership_role,
  status,
  is_primary,
  permissions,
  joined_at
)
select distinct
  s.organization_id,
  uoa.user_id,
  'member',
  'active',
  false,
  '[]'::jsonb,
  now()
from public.user_org_assignments uoa
join public.schools s on s.id = uoa.school_id
where s.organization_id is not null
  and not exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = s.organization_id
      and m.user_id = uoa.user_id
  );

-- Ensure FOUNDER/CEO leadership has primary membership on seed org
insert into public.user_organization_memberships (
  organization_id,
  user_id,
  membership_role,
  status,
  is_primary,
  permissions,
  joined_at
)
select
  o.id,
  u.id,
  case when r.name = 'FOUNDER' then 'owner' else 'admin' end,
  'active',
  false,
  '["org.view","org.manage","users.view","users.manage"]'::jsonb,
  now()
from public.org_organizations o
cross join public.users u
join public.user_roles ur on ur.user_id = u.id
join public.roles r on r.id = ur.role_id
where o.slug = 'the-academy-way'
  and r.name in ('FOUNDER', 'CEO')
  and not exists (
    select 1
    from public.user_organization_memberships m
    where m.organization_id = o.id
      and m.user_id = u.id
  );

notify pgrst, 'reload schema';
