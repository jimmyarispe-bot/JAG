# 01 — Identity Runtime

**Subsystem 1 of 6** · JAG Core

---

## Purpose

Establish **who** is acting, under **which authority**, for **which organization(s)**, with **which permissions**—before Context or Intent resolve.

---

## Responsibilities

1. Authenticate the principal (or reject).  
2. Resolve effective user (including impersonation).  
3. Load roles, permission grants, org memberships.  
4. Resolve multi-organization / multi-school scope.  
5. Apply delegation and time-bounded elevated access.  
6. Emit identity session for downstream runtimes.  
7. Never check roles at call sites outside the permission engine.

---

## Inputs

| Input | Source |
|-------|--------|
| Auth session / tokens | Platform auth (e.g. Supabase Auth) |
| Request cookies / headers | HTTP / app shell |
| Impersonation session id | Steward capability |
| Org switcher selection | User preference / header |
| Device / MFA state | Auth providers |

---

## Outputs

```text
IdentitySnapshot {
  principalId          // auth subject
  effectiveUserId      // after impersonation
  displayName, email
  roles[]              // grant source only; not for authorize()
  permissions[]        // effective permission keys
  orgAssignments[]     // org/school memberships
  activeOrganizationId
  activeSchoolId?      // when education pack enabled
  accessibleSchoolIds[]
  hasUnrestrictedSchoolAccess
  impersonation? { actorUserId, targetUserId, sessionId }
  delegation? { fromUserId, scope, expiresAt }
  preferences?
  issuedAt, expiresAt
}
```

---

## Lifecycle

1. **Bootstrap** — validate auth; load provisioned user.  
2. **Elevate / impersonate** — optional steward path; audit required.  
3. **Scope** — select active org/school; constrain accessible ids.  
4. **Authorize** — `authorize(snapshot, permission)` for gates.  
5. **Refresh** — on membership/permission change.  
6. **Terminate** — sign-out; end impersonation; expire delegation.

---

## Delegation model

| Mode | Behavior |
|------|----------|
| None | Effective user = principal |
| Impersonation | Steward acts as target; permissions = target’s; audit actor |
| Delegation | Temporary grant of subset of permissions; expires; reason-coded |
| Break-glass | Founder/emergency permissions; mandatory audit + TTL |

Delegation **never** bypasses permission engine.

---

## Permission resolution

1. Load grants for effective user.  
2. Union role→permission catalogs.  
3. Apply org/school scope filters.  
4. Apply delegation mask (if any).  
5. Expose snapshot; callers use `authorize` / `hasPermission` only.

---

## Multi-organization behavior

- User may belong to many orgs.  
- **Active organization** is required for Cognition/Action that mutate tenant data.  
- Cross-org access only with platform authority or audited temporary authority.  
- Domain packs may add party facets (employee, student, guardian) **linked** to `effectiveUserId`—not alternate logins.

---

## Dependencies

| Depends on | Used by |
|------------|---------|
| Auth providers, IAM catalogs, org membership store | Context, Intent, Cognition, Experience, Action |

---

## Events

See [08_RUNTIME_EVENTS.md](./08_RUNTIME_EVENTS.md): `identity.session_started`, `identity.impersonation_started|ended`, `identity.org_switched`, `identity.delegation_granted|expired`.

---

## Interfaces (contract)

```text
IdentityRuntime {
  resolve(request): IdentitySnapshot | Unauthenticated
  authorize(snapshot, permission): boolean
  switchOrganization(snapshot, organizationId): IdentitySnapshot
  beginImpersonation(actor, target, reason): IdentitySnapshot
  endImpersonation(snapshot): IdentitySnapshot
}
```

---

## Extension points

- Custom permission catalogs via domain packs (register, don’t fork engine).  
- Party-facet resolvers (employee/student) registered by domain packages.  
- MFA / step-up policies for privileged actions.

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| No session | `Unauthenticated` → Experience shows login |
| Incomplete provision | Heal or block with provision error |
| Invalid org switch | Reject; keep prior active org |
| Impersonation denied | 403 + audit |

---

## Security considerations

- Hide unauthorized actions; enforce server-side.  
- Impersonation and delegation always audited.  
- Prefer short-lived snapshots; re-resolve on privileged Action.  
- Never embed education-only identity engines in Core.
