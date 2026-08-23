-- Durable storage for the multi-tenant brand + tenant registries.
--
-- Replaces the in-memory Maps in:
--   src/lib/platform/branding/BrandRegistry.ts   (seedDemoBrands)
--   src/lib/platform/tenant/TenantRegistry.ts    (seedFromKnownSources)
--
-- Identity note: the registries use synthetic text ids ("org.the-academy-way")
-- while public.org_organizations uses uuid. organization_id stays text so
-- existing code keeps working; org_organization_id links to the real row when
-- one exists, so the two id spaces can converge without a rewrite.

-- =========================
-- ORGANIZATION BRANDS
-- =========================
create table if not exists public.organization_brands (
  organization_id text primary key,
  org_organization_id uuid references public.org_organizations(id) on delete cascade,
  subdomain text not null unique
    check (subdomain = lower(subdomain) and subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  organization_name text not null,
  display_name text not null,
  primary_color text not null default '#0F172A',
  secondary_color text not null default '#1E293B',
  accent_color text not null default '#14B8A6',
  success_color text not null default '#059669',
  warning_color text not null default '#D97706',
  danger_color text not null default '#DC2626',
  light_logo_url text not null default '',
  dark_logo_url text not null default '',
  favicon_url text not null default '',
  app_icon_url text not null default '',
  heading_font text not null default 'Source Serif 4',
  body_font text not null default 'IBM Plex Sans',
  login_background_url text not null default '',
  dashboard_background_url text not null default '',
  email_footer text not null default '',
  pdf_footer text not null default '',
  powered_by_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_brands_org_uuid_idx
  on public.organization_brands (org_organization_id);

drop trigger if exists organization_brands_set_updated_at on public.organization_brands;
create trigger organization_brands_set_updated_at
  before update on public.organization_brands
  for each row execute function public.trigger_set_updated_at();

-- =========================
-- TENANT PROFILES
-- =========================
create table if not exists public.tenant_profiles (
  organization_id text primary key,
  org_organization_id uuid references public.org_organizations(id) on delete cascade,
  organization_name text not null,
  legal_name text not null default '',
  industry text not null default 'education',
  timezone text not null default 'America/Chicago',
  subdomain text not null unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived', 'provisioning')),
  primary_contact jsonb not null default '{}'::jsonb,
  executive_contact jsonb not null default '{}'::jsonb,
  support_contact jsonb not null default '{}'::jsonb,
  custom_domain text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tenant_profiles_set_updated_at on public.tenant_profiles;
create trigger tenant_profiles_set_updated_at
  before update on public.tenant_profiles
  for each row execute function public.trigger_set_updated_at();

-- =========================
-- RLS
-- =========================
-- Brands are read before sign-in: a subscriber login page must render its own
-- logo and colors with the anon key. Only public presentation fields live here.
alter table public.organization_brands enable row level security;

drop policy if exists organization_brands_public_read on public.organization_brands;
create policy organization_brands_public_read
  on public.organization_brands for select
  using (true);

-- Writes are service-role only (the JAG platform admin path).
drop policy if exists organization_brands_service_write on public.organization_brands;
create policy organization_brands_service_write
  on public.organization_brands for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Profiles carry contact details — never public.
alter table public.tenant_profiles enable row level security;

drop policy if exists tenant_profiles_service_all on public.tenant_profiles;
create policy tenant_profiles_service_all
  on public.tenant_profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists tenant_profiles_platform_read on public.tenant_profiles;
create policy tenant_profiles_platform_read
  on public.tenant_profiles for select
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('FOUNDER', 'PLATFORM_OWNER', 'PLATFORM_ADMIN')
    )
  );

comment on table public.organization_brands is
  'Subscriber presentation brand, resolved by subdomain before sign-in. Public read; service-role write.';
comment on table public.tenant_profiles is
  'Subscriber tenant profile and contacts. Never public — service role or JAG platform staff only.';

-- =========================
-- SEED: The Academy Way
-- =========================
-- The only real subscriber today. Acme / Signal Centers stay as in-memory
-- demo seeds so they never become permanent rows in a production database.
insert into public.organization_brands (
  organization_id, subdomain, organization_name, display_name,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, danger_color,
  heading_font, body_font, email_footer, pdf_footer, powered_by_enabled
) values (
  'org.the-academy-way', 'academy', 'The Academy Way', 'The Academy Way',
  '#0F172A', '#1E293B', '#14B8A6',
  '#059669', '#D97706', '#DC2626',
  'Source Serif 4', 'IBM Plex Sans',
  'The Academy Way · Powered by The JAG™',
  'The Academy Way · Powered by The JAG™',
  true
)
on conflict (organization_id) do nothing;
