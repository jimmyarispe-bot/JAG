# Sprint 059 — Application registry design

---

## 1. Tables

### 1.1 `platform_applications` (catalog)

| Column | Purpose |
|--------|---------|
| `key` | Stable id (`academyos`) |
| `name` | Display name (`AcademyOS`) |
| `status` | `active` · `inactive` · `deprecated` |
| `home_route` | Metadata only (`/dashboard`) — not enforced yet |
| `permission_pack_key` | Documents entitlement pack (`ACADEMYOS_ACCESS`) |
| `metadata` | Extensible JSON |

RLS: authenticated **select**; writes via service role / SQL.

### 1.2 `organization_applications` (enablement)

| Column | Purpose |
|--------|---------|
| `organization_id` | Tenant |
| `application_id` | FK → catalog |
| `status` | `enabled` · `disabled` |
| `enabled_at` / `disabled_at` | Lifecycle timestamps |
| `metadata` | Tenant #1 tagged with `tenant_number: 1` |

RLS: `can_access_organization` for read; `is_organization_admin` for write (UI not wired).

---

## 2. Seeds

| Seed | Value |
|------|--------|
| Application #1 | `key = academyos`, name AcademyOS |
| All orgs | AcademyOS `enabled` |
| Tenant #1 | Org slug `the-academy-way` — enablement metadata includes `tenant_number: 1` |

---

## 3. Soft default (compat)

Per [02_MIGRATION_PLAN.md](../02_MIGRATION_PLAN.md) Phase 1:

> If missing → treat as `["academyos"]`

Implemented in `resolveEnabledApplicationKeys` / `buildTenantApplicationSnapshot`.  
Applies when rows are absent **or** when no row is `enabled`.

**Important:** Soft default is for forward-compat loaders only. Sprint 059 does **not** gate modules, nav, or permissions on these helpers.

---

## 4. TypeScript surface

```text
src/lib/platform/applications/
  catalog.ts   — PLATFORM_NAME, DEFAULT_APPLICATION_KEY, static catalog
  types.ts     — PlatformApplication, OrganizationApplicationEnablement, …
  resolve.ts   — soft-default resolution (pure)
  queries.ts   — Supabase read helpers (unused by UI)
  index.ts     — public exports
```

Conceptual snapshot shape:

```ts
{
  platformName: "JAG",
  organizationId: "<uuid>",
  enabledApplicationKeys: ["academyos"],
  usedSoftDefault: false
}
```

---

## 5. What comes next (not this sprint)

| Phase | Work |
|-------|------|
| 2 | Branding triple (`platformName` · `applicationName` · tenant product name) |
| 3 | Application manifest (module list / home) consumed by layout |
| 4 | Nav ownership behind flag |
| 6 | Cloud Console seeds enablement for new tenants |
| 7 | Second application stub |
