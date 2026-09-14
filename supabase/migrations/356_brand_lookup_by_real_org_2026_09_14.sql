-- ===========================================================================
-- A SCHOOL LEADER COULD NOT BE TOLD WHERE TO SIGN IN
-- 14 September 2026
-- ===========================================================================
--
-- WHAT HAPPENED. Heather Badger-Brown signed in at thejag.org with the correct
-- password and was told:
--
--     Your password is correct, but this account is not part of The JAG™
--     Platform. ... Use the link in the email your school sent you, or ask your
--     school's admissions office for the sign-in address.
--
-- She IS the school's admissions office. That message is the fallback, and it
-- is only supposed to appear when we cannot work out which campus somebody
-- belongs to. The guard is built to name the address instead:
--
--     ... Sign in here instead: theacademyway.thejag.org/login
--
-- WHY IT FELL BACK. resolveTenantSignInHost reads schools.organization_id — a
-- real uuid, 5ea08717-765a-4ec0-953d-9fdac619f1a1 — and hands it to
-- BrandRegistry.getByOrganizationId. The registry is keyed by SYNTHETIC TEXT
-- IDS. Migration 226 says so in its own header: "the registries use synthetic
-- text ids (org.the-academy-way)". The one brand row in production is:
--
--     organization_id   subdomain   organization_name
--     ---------------   ---------   -----------------
--     org.the-academy-way   academy   The Academy Way
--
-- A uuid can never match that key, so the lookup returned null every time. The
-- brand was never missing. Nothing bridged the two identity namespaces.
--
-- WHY NOT JUST RE-KEY THE ROW. 'org.the-academy-way' is load-bearing in five
-- places — jag-platform/organizations.ts, the tenant admin loader, the branding
-- loader (twice) and BrandRegistry's own default. Re-keying it to the uuid
-- would fix this one lookup and break the JAG command centre.
--
-- WHY NOT USE tenant_profiles. That table is the bridge the design intended: it
-- carries both a synthetic organization_id and a real org_organization_id uuid.
-- IT DOES NOT EXIST IN PRODUCTION. It is declared in the same migration 226
-- that created organization_brands, after a statement referencing
-- org_organizations — so the file was applied partway and stopped. Building
-- this fix on a table that is not there would be the third guess today.
--
-- WHAT THIS DOES. Adds the missing link to the table that DOES exist, as a new
-- column, so nothing that reads organization_id by its synthetic key changes
-- behaviour at all. Additive and reversible.
-- ===========================================================================

alter table public.organization_brands
  add column if not exists org_organization_id uuid;

comment on column public.organization_brands.org_organization_id is
  'The real organizations uuid this brand belongs to. Bridges the synthetic '
  'registry id (organization_id) to the uuid carried by schools.organization_id. '
  'Null for demo/seed brands that have no real organization.';

-- The Academy Way. Sourced from schools rather than typed in, so this cannot
-- drift from whatever the campuses actually point at.
update public.organization_brands b
   set org_organization_id = (
         select s.organization_id
           from public.schools s
          where s.organization_id is not null
          group by s.organization_id
          order by count(*) desc
          limit 1
       )
 where b.organization_id = 'org.the-academy-way'
   and b.org_organization_id is null;

-- One brand per real organization. A second row claiming the same uuid would
-- make "which door is yours" ambiguous, which is the failure being fixed.
create unique index if not exists organization_brands_org_organization_id_unique
  on public.organization_brands (org_organization_id)
  where org_organization_id is not null;

-- ---------------------------------------------------------------------------
-- VERIFY. Expect one row: org.the-academy-way, academy, and the uuid the
-- campuses carry. If org_organization_id comes back null, the schools table had
-- no organization_id to read and the update found nothing — say so rather than
-- assuming the fix landed.
-- ---------------------------------------------------------------------------
select
  b.organization_id,
  b.subdomain,
  b.org_organization_id,
  (select count(*) from public.schools s where s.organization_id = b.org_organization_id)
    as campuses_now_resolvable
from public.organization_brands b
order by b.organization_name;
