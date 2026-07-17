# JAG Platform Engineering Standards

| Field | Value |
|-------|--------|
| **Document** | Engineering Standards |
| **Type** | Mandatory engineering practice |
| **Status** | Canonical |
| **Related** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) · [SECURITY_MODEL.md](./SECURITY_MODEL.md) |

---

## 1. Purpose

These standards bind implementation to the Platform Constitution. They apply to application code, platform libraries, migrations, and architecture documentation.

---

## 2. No Hardcoded Role Checks

### Prohibited

```ts
// Forbidden — role-string gates
if (roles.includes("FOUNDER") || roles.includes("CEO")) { ... }
if (user.role === "ADMIN") { ... }
```

### Required

Authorization decisions use the permission engine only:

```ts
import { authorize, hasPermission } from "@/lib/platform/identity/authorization-service";

const decision = await authorize(subject, "FINANCE_ACCESS");
if (!decision.allowed) { /* deny */ }

if (await hasPermission(subject, "JAG_ACCESS")) { /* allow */ }
```

### Rationale

Roles are assignment vehicles. Permissions are the policy surface. Hardcoded role checks break Founder Protection, Financial Security, delegation, and break-glass overlays.

### Exceptions

None for access control. Role names may appear in:

- Role catalog definitions and seed migrations  
- Display labels in admin UI  
- Tests that assert catalog mappings  

They must not appear as runtime gates for routes, APIs, or data access.

---

## 3. Permission-Based Authorization

| Rule | Requirement |
|------|-------------|
| Single engine | All privileged paths call `authorize` / `hasPermission` (or thin wrappers that only call those) |
| Catalog keys | Use official keys from the permission catalog (and documented aliases) |
| Product gates | JAG → `JAG_ACCESS`; Finance → `FINANCE_ACCESS`; Admin modules → catalog admin permissions |
| Deny by default | Missing permission → deny; never “allow if unknown” |
| Tenancy | Org-scoped resources require membership / isolation checks in addition to permissions |
| Temporary authority | Support, delegation, and break glass must flow through the same engine as overlays |

Route and layout guards must not invent parallel permission systems.

---

## 4. Dependency Injection

### Principles

- Prefer **explicit dependencies** (parameters, factories, or injectable clients) over hidden globals for database, auth, and external services.  
- Server modules that need Supabase / auth should obtain clients through shared factories rather than constructing ad-hoc clients mid-flow when a standard path exists.  
- Avoid circular imports between platform domains; depend inward toward Platform Services contracts.  
- Feature modules must not reach into another application’s private internals; use public platform or integration APIs.

### Testability

Code that performs authorization, tenancy, or audit side effects should be structured so unit/integration tests can substitute clients or subject context without rewriting production paths.

---

## 5. Test Requirements

| Layer | Expectation |
|-------|-------------|
| Authorization | Cover allow/deny for representative catalog permissions; cover Founder and Finance gates |
| Tenancy | Prove Org A cannot read Org B data under normal membership |
| Temporary authority | Support / break glass / delegation: expiry, revocation, and audit emission |
| Migrations | Schema changes reviewed for RLS and isolation; no silent privilege expansion |
| Regressions | When fixing an authz bug, add a test that fails without the fix |

Pull requests that change authorization, identity, or tenancy must include tests or an explicit justification when automation is not yet available for that surface.

---

## 6. TypeScript Standards

| Topic | Standard |
|-------|----------|
| Language | TypeScript for application and platform libraries |
| Strictness | Respect project `tsconfig` strictness; do not weaken types to bypass authz |
| Types | Prefer generated DB types and shared domain types over `any` |
| Public APIs | Export stable types for subjects, decisions, and catalog keys |
| Async | Prefer explicit `async`/`await`; surface errors rather than swallowing auth failures |
| Next.js | Follow this repo’s Next.js guides under `node_modules/next/dist/docs/` — APIs may differ from legacy Next.js |

Avoid `as any` on authorization subjects or permission keys. Prefer typed catalog constants.

---

## 7. Documentation Standards

| Artifact | When required |
|----------|----------------|
| Constitution / Architecture / Security Model | Boundary changes (identity, authz, tenancy, AI, audit) |
| Permission catalog | New or renamed permission keys (aliases for renames) |
| Role mappings | New official roles or permission group changes |
| Module README / inline docs | Non-obvious invariants in platform services |
| Roadmap | Milestone outcome changes |

### Style

- Professional, precise, enterprise tone.  
- Prefer tables and invariants over narrative fluff.  
- Link related docs; do not duplicate conflicting rules — Constitution wins.  
- Do not invent product claims that contradict Product Boundaries.

### Code comments

Comment *why* for non-obvious security or tenancy constraints. Do not narrate obvious control flow.

---

## 8. Database & Migrations

- Migrations are additive and reviewed for RLS, grants, and tenancy.  
- Seed data for roles/permissions remains additive; do not delete live role keys without a migration plan and aliases.  
- Application code and SQL policy must agree: RLS is defense in depth, not a substitute for `authorize`.

---

## 9. Pull Request Checklist (Authz / Platform)

- [ ] No new `roles.includes(...)` (or equivalent) access gates  
- [ ] Permissions used exist in the catalog (or alias map)  
- [ ] Org scope enforced for tenant data  
- [ ] Audit events for privileged / temporary / emergency actions  
- [ ] Docs updated if Constitution invariants changed  
- [ ] Typecheck passes (`tsc --noEmit` or project equivalent)

---

## 10. Precedence

If practice conflicts with documentation:

1. [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md)  
2. [SECURITY_MODEL.md](./SECURITY_MODEL.md)  
3. This document  
4. Local README / ad-hoc comments  

Conflicts must be resolved by updating docs and code together — never by silent code exceptions.
