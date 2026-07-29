# 09 — Runtime Hardening

**Phase Ω-7B — Final Core Readiness**  
**Authority:** [JAG_CONSTITUTION.md](../../../../JAG_CONSTITUTION.md) · [08_RUNTIME_INTEGRATION_REVIEW.md](./08_RUNTIME_INTEGRATION_REVIEW.md)  
**Scope:** Harden Action gates, unify contributor model, freeze Core contracts  
**Package:** `src/lib/jag/runtime/**`

---

## 1. Purpose

Close Integration Review conditions **C1–C3** before the first domain package:

| Condition | Resolution |
|-----------|------------|
| C1 Intent before Action | Action gate requires `RuntimeIntent` |
| C2 No legacy bypass paths | Removed `registerExperienceProvider` / `registerActionProvider` execution |
| C3 Domain adapter checklist | [DOMAIN_ADAPTER_CHECKLIST.md](../DOMAIN_ADAPTER_CHECKLIST.md) |

After Ω-7B, JAG Core enters **architectural freeze** ([11_CORE_STABILITY_POLICY.md](./11_CORE_STABILITY_POLICY.md)).

---

## 2. Action gate (hardened)

`ActionRuntime.execute` rejects unless **all** of the following are present:

| Requirement | Code |
|-------------|------|
| RuntimeIdentity | `ACTION_REQUIRES_IDENTITY` |
| OrganizationalContext | `ACTION_REQUIRES_CONTEXT` |
| RuntimeIntent | `ACTION_REQUIRES_INTENT` |
| CognitiveResult | `ACTION_REQUIRES_COGNITION` |
| EvidenceSet (≥1 ref) | `ACTION_REQUIRES_EVIDENCE` |

Rejections return `RuntimeActionResult` with `status: "rejected"` and optional `missing[]`.  
Helpers: `isActionRejected`, `toActionRejected` → typed `RuntimeActionRejected`.

Intent is **required** on `ActionExecutionRequest` (no optional bypass).

---

## 3. Single contributor model

**Only path for Runtime participation:**

```text
Contributor registration → Contracts → Registry → Subsystem Runtime
```

Removed alternate execution paths in `default-stages.ts`:

- Legacy Experience compose via `RuntimeExperienceProvider`
- Legacy Action execute via `RuntimeActionProvider`

Canonical registration APIs:

- `registerIdentityContributor` (alias: `registerIdentityProvider`)
- `registerContextContributor` (alias: `registerContextProvider`)
- `registerIntentContributor` (alias: `registerIntentProvider`)
- `registerCognitiveContributor` (alias: `registerCognitiveProvider`)
- `registerExperienceContributor`
- `registerActionContributor`
- `registerEvidenceContributor` / `registerMemoryContributor` / `registerTwinContributor`

Experience / Action stages no-op unless the corresponding Runtime is installed.

---

## 4. Canonical adapter contracts

Location: `src/lib/jag/runtime/adapters/`

| Contract | Role |
|----------|------|
| `DomainAdapter` | Pack entrypoint (`register` / optional `unregister`) |
| `DomainAdapterRegistrationApi` | Narrow registry surface (`asDomainAdapterApi()`) |
| `*Contributor` types | Identity · Context · Intent · Cognitive · Experience · Action · Evidence · Memory · Twin |

Contracts only — **no domain implementations in Core**.

---

## 5. Documentation delivered

| Doc | Content |
|-----|---------|
| [DOMAIN_ADAPTER_CHECKLIST.md](../DOMAIN_ADAPTER_CHECKLIST.md) | Mandatory domain gate |
| [10_DOMAIN_ADAPTER_CHECKLIST.md](./10_DOMAIN_ADAPTER_CHECKLIST.md) | Implementation pointer |
| [11_CORE_STABILITY_POLICY.md](./11_CORE_STABILITY_POLICY.md) | Freeze / versioning |

---

## 6. Success criteria

| Criterion | Status |
|-----------|--------|
| Intent required before Action | **Met** |
| Single contributor model | **Met** |
| Canonical adapter contracts | **Met** |
| Domain checklist complete | **Met** |
| Core stability documented | **Met** |

---

## 7. Explicit stop

Ω-7B does **not** authorize:

- Domain adapters (Education / AcademyOS / etc.)
- UI / portals
- New engines inside Core
- Business logic in Core

Next authorized work: first **domain package** outside Core, under the Domain Adapter Checklist.
