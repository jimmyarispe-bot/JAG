# Organization Platform — Multi-Tenant Foundation (C1)

**Status:** Foundation complete  
**Scope:** Organization infrastructure only  
**Non-goals:** Intelligence packages, OIOS dependency graph, Registry, Integration Platform internals, ECC architecture rewrites

## Purpose

Transform JAG from a single-organization deployment into a secure multi-tenant SaaS platform where every organization is isolated while sharing the same intelligence engine.

## Hierarchy

```
Platform
  → Organizations
    → Locations (location | school | campus | business_unit)
      → Units (department | team | division | cost_center | program)
        → Users / Memberships
          → Permissions (RBAC)
            → Integrations (org-owned connector instances)
              → Executive Command Center (tenant context)
                → Intelligence (scoped queries)
```

## Module

`src/lib/platform/organization-platform/`

| Area | Responsibility |
|------|----------------|
| `types.ts` | Domain models |
| `roles.ts` | Role → permission matrix |
| `rbac.ts` | Actor resolution, isolation + permission asserts |
| `store.ts` | In-memory tenant store (swap for durable DB later) |
| `services/*` | Orgs, locations/units, users, auth, sessions, settings, secrets |
| `integrations/org-connector-bridge.ts` | Org-scoped calls to Integration Platform **public** APIs |
| `context/executive-context.ts` | ECC tenant context resolver |
| `context/identity-bridge.ts` | Map live identity → org-platform executive context |
| `create-platform.ts` | Composition root + process singleton |
| `seed.ts` | Two isolated demo organizations |

## Roles

Platform Admin · Founder · Organization Owner · CEO · Executive · Board Member · Department Leader · Manager · Employee · Advisor · Guest

## Authentication

Supported at the platform layer:

- Email / password
- Magic link
- Google OAuth
- Microsoft OAuth
- Future SSO (`beginSso` reserved stub)

## Authorization

Every privileged operation requires an `ActorContext` resolved from `(userId, organizationId)`.

Intelligence and ECC scope always include:

- `organizationId` (required)
- `locationId` / `departmentId` / `teamId` (membership-scoped)
- role-derived permissions

Cross-organization access throws `TenantIsolationError`.  
Missing role grants throw `PermissionDeniedError`.

## Integrations

Each organization owns its own connector instances and credentials via `OrgIntegrationBridge`:

| Org A (demo) | Org B (demo) |
|--------------|--------------|
| QuickBooks, Google, Plaid, AcademyOS | QuickBooks, Microsoft, HubSpot, Stripe |

Bridge uses `IntegrationPlatform.ensureInstance` / `persistence.listConfigurations` only — no Integration Platform source changes.

## Executive Command Center

`resolveExecutiveTenantContext` / `resolveExecutiveContextForIdentity` supply:

- Current organization + location
- Role + permissions
- Integration instance IDs
- Intelligence scope
- Branding / timezone / currency

`/exec` layout consumes this additively (org/location labels in `ExecShell`). ECC widget architecture is unchanged.

## Admin surfaces

| Route | Purpose |
|-------|---------|
| `/platform` | Hub — counts, hierarchy, roles |
| `/organizations` | Tenant list + memberships |
| `/users` | Users, auth methods, org memberships, sessions |
| `/settings` | Auth methods + per-org profile/branding/regional settings |

Guarded by existing identity page permissions (`configuration.admin` / `manage` / `certification.admin`).

## Security

- Complete tenant isolation on reads/writes
- Org-level secrets (fingerprinted; plaintext only to same-org `secrets.manage`)
- Org-level API credentials (`jag_…` tokens)
- Audit log entries tagged with `organizationId`
- Session org/location switching membership-checked

## Tests

`tests/unit/organization-platform/tenant-isolation.test.ts`

- Cross-org read denial
- Permission denial by role
- Intelligence / ECC scope
- Per-org connector instances
- Org switching
- Secrets / API credentials isolation
- Auth methods
- Settings isolation
- Deactivate + audit

## Validation

```bash
npx tsc --noEmit
npx vitest run tests/unit/organization-platform
```

## Success criteria

JAG supports multiple organizations simultaneously, each with isolated data, integrations, users, branding, and executive experiences, while sharing the same intelligence platform.
