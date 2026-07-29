# 09 — Runtime Extension Model

How Domain packages and Core engines extend the Runtime **without forking** it.

---

## 1. Principles

1. **Register, don’t fork** — packs contribute via catalogs and adapters.  
2. **Core owns contracts** — packs own SoR and domain algorithms.  
3. **UOM sacred** — organization shape is configured, not copied.  
4. **Evidence required** — cognitive contributors must return EvidenceRefs or unknowns.  
5. **Permissions only** — extensions never introduce role checks outside the engine.

---

## 2. Extension surfaces by subsystem

| Subsystem | Extension type | Registers |
|-----------|----------------|-----------|
| Identity | Party facet resolver | `resolveParty(userId, org) → PartyRef[]` |
| Identity | Permission catalog entries | permission keys + role maps |
| Context | Context Profile | `contextId`, discovery rules, inheritance |
| Context | Legacy surface map | route → contextId |
| Intent | Intent catalog entry | intentId, signals, actionCandidates |
| Intent | Signal extractor | UserEvent → IntentCandidate[] |
| Cognition | CognitiveContributor | gather/recommend for scope |
| Experience | WidgetDescriptor | slots, bindings, a11y |
| Experience | Nav section contrib | context-scoped links |
| Action | ActionHandler + catalog | execute, undo, permissions |
| Action | Workflow template | Workflow engine registration |
| Action | Twin publisher | entity → Twin delta |
| Action | Memory writer | outcome → MemoryEntry |

---

## 3. Contributor interface (logical)

```text
CognitiveContributor {
  id, domainPackageId?
  supports(context, intent): boolean
  gather(scope): EvidenceBundle
  recommend(scope, evidence): Recommendation[]
}

ActionHandler {
  actionId
  permission
  execute(ctx, payload): DomainResult
  undo?(ctx, token): DomainResult
}
```

Exact TypeScript shapes are deferred to implementation; this pack freezes **semantics**.

---

## 4. Registration lifecycle

```text
Pack enable
  → validate manifests against Runtime contracts
  → register catalogs (context, intent, widget, action)
  → register contributors/handlers
  → health check (optional)
Pack disable
  → unregister
  → Experience omits widgets; Intent omits intents
```

Disabled packs must not leave dangling ActionHandlers callable.

---

## 5. Ownership boundaries

| May extend | Must not |
|------------|----------|
| Education pack: student/family contexts, grading actions | Own Identity auth provider |
| Finance Core: cash recommendations | Own Experience branding product |
| Domain Twin adapters | Second Twin runtime |
| Studio widgets | Parallel permission engine |

---

## 6. Versioning

- Manifests declare `runtimeContractVersion`.  
- Breaking Runtime contract changes require Phase bump + migration notes.  
- Packs may support N and N-1 during transition.

---

## 7. Testing expectations (for future implementers)

- Contract tests: contributor returns evidence or unknown.  
- Authz tests: ActionHandler denied without permission.  
- Isolation tests: pack disable removes intents/widgets/actions.  
- No e2e portal-product tests as architecture proof.

---

## 8. Relation to Experience Orchestrator

Ω-1 may start with a **subset** of registration (widgets + context maps + thin cognition adapters). Full extension surface above is the target architecture; partial registration is allowed if documented as Runtime maturity gaps.
