# 02 — Identity Runtime Implementation

**Phase Ω-2** · Package: `src/lib/jag/runtime/identity`  
**Authority:** [01_IDENTITY_RUNTIME.md](../01_IDENTITY_RUNTIME.md) · Kernel: [01_RUNTIME_KERNEL.md](./01_RUNTIME_KERNEL.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Duplicate auth system? | **No** — consumes host-supplied principal facts |
| Bypass Runtime? | **No** — Identity pipeline stage |
| UI? | **No** |
| Education-specific logic? | **No** |

---

## Architecture

```text
Host Auth (existing)
    ↓ sessionRef / principal hint
IdentityProvider (registered)
    ↓ PrincipalRecord
IdentityRuntime
    ├── OrganizationResolver
    ├── PermissionResolver
    ├── DelegationResolver
    └── cache
    ↓ RuntimeIdentity
Kernel pipeline: Identity → Context → …
```

Identity Runtime answers only:

- Who is acting? (`principalId`)
- In what capacity? (`effectiveUserId`, roles as grant sources)
- With what authority? (`permissions`, delegation/impersonation contracts)
- Across which organizations? (`orgAssignments`, `activeOrganizationId`)

It does **not** login, mint JWTs, talk to Supabase, or own Education roles.

---

## Public APIs

```ts
import {
  createIdentityRuntime,
  installIdentityRuntime,
  createMemoryDelegationResolver,
  IDENTITY_EVENT_TYPES,
  type IdentityProvider,
  type IdentityRuntime,
  type ResolvedIdentity,
  type IdentityScope,
} from "@/lib/jag/runtime";
```

### Create + install

```ts
const runtime = createJagRuntime();
runtime.registry.registerIdentityProvider(myProvider);
const identity = installIdentityRuntime(runtime);

const result = await runtime.run({
  composeOnly: true,
  stopAfter: "identity",
  initialData: { sessionRef: "…" },
});
// result.identity: RuntimeIdentity
```

### Resolve directly

```ts
const outcome = await identity.resolve({ sessionRef: "…" });
if (outcome.status === "resolved") {
  identity.authorize(outcome.value.identity, "workspace.read");
}
```

---

## Identity lifecycle

1. **Load principal** — first matching `IdentityProvider.loadPrincipal`  
2. **Apply delegation contract** (optional) — mask, break-glass, or impersonation  
3. **Resolve organization** — membership + active org  
4. **Resolve permissions** — base ∪ role catalog ∪ break-glass, then delegation mask  
5. **Cache** — short TTL keyed by session/principal/org/delegation  
6. **Publish events** — `IdentityResolved`, `PermissionResolved`, failures  

---

## Delegation model

| Kind | Behavior |
|------|----------|
| `delegation` | Allow-list mask of permissions for `toUserId` |
| `impersonation` | **Only** via `DelegationContract`; loads target via `loadPrincipalById`; `principalId` stays actor |
| `break_glass` | Unions extra permissions onto principal |

APIs: `grantDelegation`, `revokeDelegation`, `beginImpersonation`, `endImpersonation`.

Impersonation **cannot** bypass contracts.

---

## Organization resolution

- Memberships come from `PrincipalRecord.orgAssignments`  
- Preferred `activeOrganizationId` validated against membership  
- `switchOrganization` rejects non-members and emits `OrganizationChanged`  
- Pack-specific scope (e.g. school) belongs in `attributes`, not Core fields  

---

## Extension points

| Extension | Registration |
|-----------|----------------|
| `IdentityProvider` | `runtime.registry.registerIdentityProvider` or `identity.providers.register` |
| `DelegationResolver` | Inject into `createIdentityRuntime({ delegations })` |
| `PermissionResolver` / `OrganizationResolver` | Inject into `createIdentityRuntime` |

**Do not** register Education or Supabase inside this package — hosts register adapters.

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.identity.resolved` | Successful resolve |
| `jag.runtime.identity.organization_changed` | Org switch |
| `jag.runtime.identity.delegation_granted` | Contract stored |
| `jag.runtime.identity.delegation_revoked` | Contract revoked |
| `jag.runtime.identity.permission_resolved` | Effective permissions computed |
| `jag.runtime.identity.resolution_failed` | Unauthenticated / provider miss |

---

## Pipeline integration

`installIdentityRuntime` registers the Identity stage and sets `registry.setIdentityRuntime`.

Request inputs (from `initialData` / `identityRequest`):

- `sessionRef`, `principalId`, `activeOrganizationId`, `delegationId`

---

## Tests

`tests/unit/jag/runtime/identity.test.ts`

---

## Out of scope

Login · OAuth · JWT · Supabase changes · session UI · React · routes · Education roles · AcademyOS permissions · DB migrations
