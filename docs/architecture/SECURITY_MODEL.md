# JAG Platform Security Model

| Field | Value |
|-------|--------|
| **Document** | Security Model |
| **Type** | Enterprise security reference |
| **Status** | Canonical companion to the Platform Constitution |
| **Parent** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) |

---

## 1. Purpose

This document specifies how identity, organizations, authorization, temporary authority, audit, MFA, and sessions compose into a coherent security model. Implementation must match these rules; UI and RLS alone are never sufficient.

---

## 2. Identity

| Concept | Definition |
|---------|------------|
| **User** | Authenticated principal (Supabase Auth subject) |
| **Subject** | Runtime authorization context: user + roles → permissions + overlays |
| **Profile** | Application profile linked to auth user |
| **Impersonation / overlays** | Temporary contexts (support, break glass, delegation) bound to a session |

### Rules

1. Authentication proves *who*; authorization decides *what*.  
2. Identity providers may change; permission catalogs remain the product policy surface.  
3. Service accounts and API keys are first-class principals with scoped permissions — never shared ambient org credentials.  
4. Founder identity for JAG is expressed as `JAG_ACCESS`, not as a hardcoded user id check in product gates.

---

## 3. Organizations

| Concept | Definition |
|---------|------------|
| **Organization** | First-class tenant (type, owner, subscription, branding, status) |
| **Membership** | User ↔ organization link; primary source of tenancy |
| **Isolation** | Org A data is inaccessible from Org B context without an explicit, audited grant |

### Rules

1. AcademyOS operational data is organization-scoped.  
2. Membership (not informal “home school” heuristics alone) drives primary org resolution.  
3. Cross-org access requires Support, Break Glass, or other constitutionally defined temporary authority — never silent joins.  
4. Provisioning and Marketplace entitlements are per organization.  
5. RLS reinforces isolation; application code still enforces membership and permissions.

---

## 4. RBAC / Permissions

### Model

```text
User ──► Role assignment(s) ──► Permission group(s) ──► Permission keys
                                      │
                                      ▼
                         authorize() / hasPermission()
```

| Layer | Role |
|-------|------|
| **Roles** | Named packages of access (FOUNDER, TEACHER, …) |
| **Permission groups** | Intermediate bundles mapped from roles |
| **Permissions** | Atomic catalog keys (`JAG_ACCESS`, `FINANCE_ACCESS`, …) |
| **Engine** | Sole runtime policy evaluator |

### Rules

1. **No hardcoded role checks** for access control (see Engineering Standards).  
2. **Deny by default.**  
3. **Official catalog** is additive; renames require aliases.  
4. **Product gates:**  
   - JAG surfaces → `JAG_ACCESS`  
   - Finance surfaces → `FINANCE_ACCESS`  
   - Platform admin modules → catalog admin permissions (`SYSTEM_ADMIN_ACCESS`, `USER_MANAGEMENT_ACCESS`, `AUDIT_ACCESS`, …)  
5. Granular permissions (e.g. `finance.*`, `integration.*`) refine coarse catalog gates where implemented.  
6. Intelligence and Marketplace must reuse this model — no parallel RBAC.

---

## 5. Delegation

Delegation grants **temporary, scoped permissions** from a delegator to a delegate without permanently changing role assignment.

| Attribute | Requirement |
|-----------|-------------|
| Scope | Permissions and (when applicable) organization / school |
| Duration | Explicit expiry |
| Reason | Required business justification |
| Revocation | Immediate revoke by delegator or security admin |
| Audit | Create, use, revoke, and expire events |

### Rules

1. Delegated permissions cannot exceed the delegator’s effective permissions.  
2. Delegation cannot mint `JAG_ACCESS` or break Founder Protection unless Constitution explicitly allows a named emergency path (default: no).  
3. Expired delegations have no residual effect.  
4. Engine evaluation must include active delegation overlays.

---

## 6. Break Glass

Break glass is **emergency elevation** for time-critical incidents when normal paths are insufficient.

| Attribute | Requirement |
|-----------|-------------|
| Trigger | Explicit action by an authorized breaker |
| Scope | Minimal necessary permissions / org access |
| Duration | Short, hard TTL |
| Reason | Mandatory; stored immutably |
| Oversight | Security / compliance visibility |
| Audit | Immutable emergency log; high-severity security event |

### Rules

1. Break glass is exceptional — not a convenience login.  
2. Sessions under break glass must be visually/contextually marked in admin/security surfaces.  
3. Auto-expiry and forced revocation are mandatory.  
4. Post-incident review is expected for every activation.  
5. Break glass does not remove the need for `authorize` — it temporarily expands the subject’s effective permissions under policy.

---

## 7. Audit

### What must be auditable

| Category | Examples |
|----------|----------|
| Authentication | Sign-in, sign-out, MFA challenges, failures |
| Authorization | Sensitive denials where instrumented; admin permission changes |
| Administration | Role/permission changes, org membership, feature flags, API keys |
| Temporary authority | Support grants, delegation, break glass lifecycle |
| Finance | Privileged finance mutations and exports (as instrumented) |
| Data access | Cross-org or emergency data access |

### Rules

1. Audit records are **append-oriented** for security-critical streams; emergency logs are immutable.  
2. Actors, timestamps, targets, and outcomes are required fields.  
3. `AUDIT_ACCESS` (and successors) gates who may view security/compliance audit UIs.  
4. Audit gaps for new privileged features are treated as security defects.

---

## 8. MFA

| Topic | Policy direction |
|-------|------------------|
| Availability | MFA supported via identity provider capabilities |
| Privileged roles | Strongly preferred / required for platform admin, finance, and break-glass capable actors as product policy matures |
| Recovery | Controlled recovery paths; no undocumented bypasses |
| Posture visibility | Security & Compliance Center surfaces MFA status for in-scope users |

MFA strengthens authentication; it does not replace permission checks.

---

## 9. Session Management

| Concern | Requirement |
|---------|-------------|
| Binding | Session tied to authenticated user |
| Overlays | Support / break glass / delegation attached with expiry metadata |
| Timeout | Idle/absolute timeouts per product policy and IdP settings |
| Revocation | Logout and server-side invalidation clear effective access |
| Concurrency | Suspicious multi-session patterns visible to security admin where instrumented |
| Context | Server components and middleware resolve subject + overlays before privileged work |

### Rules

1. Middleware and layout gates call the permission engine — not client-only checks.  
2. Overlay expiry must be enforced server-side (and by jobs for cleanup).  
3. Impersonation-style overlays are audited and attributable to both actor and target where applicable.  
4. API keys / developer credentials follow Integration Framework org scoping and rotation practices.

---

## 10. Defense in Depth

```text
Edge (middleware / layouts)
        → Permission engine
        → Service-level checks
        → RLS / database policies
        → Audit & monitoring
```

Failure at any single layer must not be treated as acceptable design. New features must state how they participate in this stack.

---

## 11. Related Documents

- [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) — governing law  
- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) — layered structure  
- [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md) — implementation mandates  
- [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md) — delivery sequence for security capabilities  
