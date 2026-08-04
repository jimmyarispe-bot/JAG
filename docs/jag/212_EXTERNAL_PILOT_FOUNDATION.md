# Sprint 212 — JAG External Pilot Foundation

Tenant isolation + org-scoped JAG authorization.

**Status:** Foundation implemented (app + forward-only migration).  
**Not in scope:** `/jag/admin/organizations` UI, inviting external pilots, Stripe billing.

## Authority model

| Authority | Permission gate | Session `authority` | Org binding |
|-----------|-----------------|---------------------|-------------|
| Platform steward | `JAG_ACCESS` (+ typically `JAG_PLATFORM_ADMIN`) | `platform` | Optional `organizationId` |
| Customer org admin | `JAG_ORG_ACCESS` only | `organization` | **Required** `organizationId` |

Roles:

- `FOUNDER` / `PLATFORM_OWNER` → platform steward (never assign to customers)
- `JAG_ORG_ADMIN` → customer organization administrator

Do **not** grant customers `FOUNDER`.

## Signed JAG session

Cookie `jag_platform_session_v2` now includes:

- `authority: "platform" | "organization"`
- `organizationId: string | null`

Org operators without `organizationId` cannot mint a session.

## Organization context

- JAG mint path: `resolveJagOrganizationContext` — **fail closed**, no Academy seed fallback
- AcademyOS branding/config: `resolvePrimaryOrganizationId` still allows seed fallback
- Fail-closed helper: `resolveOrganizationIdForUser(..., { allowSeedFallback: false })`

## Database (migration `212_jag_org_scoped_authorization.sql`)

- Permissions: `JAG_PLATFORM_ADMIN`, `JAG_ORG_ACCESS`
- Roles: `PLATFORM_OWNER`, `JAG_ORG_ADMIN` + `platform_role_permissions`
- `is_platform_steward(user)` — FOUNDER or PLATFORM_OWNER
- `user_can_access_organization` — steward **or** membership **or** owner (**CEO removed** as global bypass)
- `is_enterprise_admin()` narrowed to platform steward
- `is_enterprise_admin_for_organization(org)` for org-scoped executive patterns
- Users directory SELECT: steward / self / co-members

Apply this migration on the target Supabase project before relying on RLS changes in Preview/Production.

## Cross-tenant access helper (app)

`sessionCanAccessOrganization(session, organizationId)`:

- platform → allow
- organization → only when ids match

## Existing auth preserved

Password login, Resend recovery, MFA recovery step-up, branded Magic Link, and establish flow still use `completeJagAuthorization` — now with org context + authority.

## Next

1. ~~Wire data-plane loaders/mutations to `sessionCanAccessOrganization`~~ → see `213_DATA_PLANE_TENANT_ISOLATION.md`
2. Apply migration 212 in Supabase
3. Build `/jag/admin/organizations` control plane
4. Durable pilot invite that assigns `JAG_ORG_ADMIN` + membership (never FOUNDER)
5. Further school-scoped RLS adoption of `is_enterprise_admin_for_organization`
