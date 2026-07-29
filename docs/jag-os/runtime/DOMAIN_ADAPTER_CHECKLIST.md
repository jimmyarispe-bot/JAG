# Domain Adapter Checklist

**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [UNIVERSAL_ORGANIZATION_MODEL.md](../../../UNIVERSAL_ORGANIZATION_MODEL.md)  
**Status:** Mandatory for every domain package  
**Companion:** [implementation/10_DOMAIN_ADAPTER_CHECKLIST.md](./implementation/10_DOMAIN_ADAPTER_CHECKLIST.md) · [implementation/11_CORE_STABILITY_POLICY.md](./implementation/11_CORE_STABILITY_POLICY.md)

This checklist is **required** before a domain package (Education, Healthcare, Manufacturing, Legal, Government, or any other) may ship against JAG Runtime.

JAG Core is under architectural freeze. Domain logic belongs in adapters — never in Core.

---

## 1. Constitutional requirements

| # | Requirement | Pass |
|---|-------------|------|
| 1.1 | Domain does not claim to be “the product” — JAG is the product | ☐ |
| 1.2 | No new portals/products; Experience contributes to the single adaptive environment | ☐ |
| 1.3 | No Core business rules for the domain industry | ☐ |
| 1.4 | No Education/Healthcare/etc. imports into `src/lib/jag/runtime` | ☐ |
| 1.5 | UOM organization shape is configured, not forked | ☐ |
| 1.6 | Evidence required for mutating Action (Law 7) | ☐ |
| 1.7 | Permissions enforced; no role checks outside Identity | ☐ |

---

## 2. Required contributors

Register through the **single contributor model** only (`register*Contributor` + contracts + registry).

| Contributor | Required for first mutating pack? | Notes |
|-------------|-----------------------------------|-------|
| `IdentityContributor` | Yes (or reuse platform identity) | Principal / permissions |
| `ContextContributor` | Yes | Context families / profiles |
| `IntentContributor` | Recommended | Catalog + signals; explicit intent may suffice initially |
| `CognitiveContributor` | Yes for Action path | Findings / recommendations + evidence |
| `ExperienceContributor` | Recommended | Widgets / briefing / nav fragments |
| `ActionContributor` | Yes for mutations | Catalog + gated `execute` |
| `EvidenceContributor` | When publishing evidence | Contract only in Core |
| `MemoryContributor` | When writing memory | Contract only in Core |
| `TwinContributor` | When publishing twin | Contract only in Core |

Implement `DomainAdapter.register(api)` using `registry.asDomainAdapterApi()`.

**Forbidden:** Legacy `RuntimeExperienceProvider` / `RuntimeActionProvider` execution paths (removed in Ω-7B).

---

## 3. Registration steps

1. Declare domain package (`registerDomainPackage` or adapter metadata).  
2. Install subsystem runtimes on the host Kernel (`installIdentityRuntime`, …, `installActionRuntime`) — host concern, not Core forks.  
3. Call `adapter.register(registry.asDomainAdapterApi())`.  
4. Register catalogs (intent, action permissions, widgets) via contributors.  
5. Verify no duplicate contributor ids.  
6. On disable: unregister contributors; ensure Action handlers are not callable.

---

## 4. Testing requirements

| # | Test | Pass |
|---|------|------|
| 4.1 | Unit tests for each contributor (supports / happy path / deny) | ☐ |
| 4.2 | Pipeline test: Identity → Context → Intent → Cognition → Experience → Action | ☐ |
| 4.3 | Action without Intent → `ACTION_REQUIRES_INTENT` / `RuntimeActionRejected` | ☐ |
| 4.4 | Action without EvidenceSet → `ACTION_REQUIRES_EVIDENCE` | ☐ |
| 4.5 | Action without permission → rejected (not soft-disabled in UI only) | ☐ |
| 4.6 | Import boundary: domain package must not be imported by Core | ☐ |
| 4.7 | Pack disable leaves no dangling action handlers | ☐ |

---

## 5. Evidence requirements

| # | Requirement | Pass |
|---|-------------|------|
| 5.1 | Cognitive gather/recommend returns EvidenceRefs or explicit unknowns | ☐ |
| 5.2 | Mutating Action receives non-empty `EvidenceSet` | ☐ |
| 5.3 | Action audit records identity, context, intent, cognition, evidence | ☐ |
| 5.4 | Failed / rejected actions still emit typed audit / events | ☐ |

---

## 6. Security requirements

| # | Requirement | Pass |
|---|-------------|------|
| 6.1 | Action catalog declares permission keys | ☐ |
| 6.2 | Authorization runs in Action Runtime before dispatch | ☐ |
| 6.3 | No bypass of Action Runtime for domain writes | ☐ |
| 6.4 | Confirmation tokens for high-risk actions where catalog requires | ☐ |
| 6.5 | Org scope enforced via Identity + OrganizationalContext | ☐ |

---

## 7. Extension validation

| # | Check | Pass |
|---|-------|------|
| 7.1 | All participation via Contributor registration | ☐ |
| 7.2 | No alternate Kernel / pipeline forks | ☐ |
| 7.3 | No Core PR that embeds domain algorithms | ☐ |
| 7.4 | `runtimeContractVersion` declared and compatible | ☐ |
| 7.5 | Attributes bag used for pack-specific data (not Core type forks) | ☐ |

---

## 8. Acceptance criteria

A domain package is **accepted** only when:

1. All applicable checklist boxes above are checked.  
2. Action execution requires Identity · OrganizationalContext · RuntimeIntent · CognitiveResult · EvidenceSet.  
3. Registration uses contributor APIs exclusively.  
4. Core remains free of domain imports and business logic.  
5. Tests under the domain’s declared paths pass.  
6. No Core change was required unless a constitutional review explicitly authorized it ([11_CORE_STABILITY_POLICY.md](./implementation/11_CORE_STABILITY_POLICY.md)).

---

## 9. Explicit non-goals

- Building UI / portals inside Core  
- Shipping domain engines inside `src/lib/jag/runtime`  
- Expanding AcademyOS product surfaces as part of Core readiness  

When in doubt: **register a contributor, don’t change Core.**
