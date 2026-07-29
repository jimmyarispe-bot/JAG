# 02 — Context Runtime

**Subsystem 2 of 6** · JAG Core

---

## Purpose

Establish **where** and **in what organizational situation** the user is operating—Context Profiles replace portals as first-class products.

---

## Responsibilities

1. Discover available contexts for IdentitySnapshot.  
2. Resolve active context (persistent or temporary).  
3. Support context switching without product navigation.  
4. Inherit context from parent scopes (org → school → team → party).  
5. Carry cross-domain context keys for Cognition.  
6. Emit context events for Experience recomposition.  
7. Map legacy routes (`/portal`, `/dashboard/*`) to Context Profiles (migration).

---

## Context discovery

Contexts are **registered profiles**, not URL products:

| Context family (examples) | Typical party / role affinity |
|---------------------------|-------------------------------|
| Student / Learner | Student party |
| Family / Guardian | Guardian party |
| Educator / Teacher | Staff + teaching assignment |
| School Leader | Leadership permissions |
| Executive / Board | Executive permissions |
| Admissions | Admissions permissions |
| Operations / Finance | Finance/ops permissions |
| Studio | Engineering Studio permissions |

Discovery filters by Identity (permissions + party facets + org scope).

---

## Context switching

- User or Command may switch context.  
- Switch updates `ContextSnapshot`; Experience recomposes.  
- Does **not** require leaving “JAG” for another branded app.  
- Legacy deep links may force a context temporarily.

---

## Persistent vs temporary context

| Kind | Storage | Lifetime |
|------|---------|----------|
| Persistent | User preference / org default | Until user changes |
| Temporary | Request / session overlay | Single task / workflow / deep link |
| Sticky temporary | Session | Until explicit clear or TTL |

Temporary context **overlays** persistent; never destroys it silently.

---

## Cross-domain context

```text
ContextSnapshot {
  contextId
  contextFamily          // e.g. educator, family, executive
  organizationId
  schoolId?
  partyRefs[]            // studentId, employeeId, …
  focusEntity?           // current class, case, invoice, …
  domainHints[]          // which domain packs to consult
  inheritedFrom?         // parent context id
  mode: persistent | temporary
  legacySurfaceId?       // mapped portal/dashboard id during migration
}
```

---

## Context inheritance

```text
Org Context
  └─ School Context
       └─ Team / Class Context
            └─ Party Focus Context
```

Child contexts inherit org/school scope and may narrow focus. Cognition must receive the **resolved** (merged) snapshot.

---

## Context events

`context.discovered`, `context.activated`, `context.switched`, `context.temporary_set`, `context.temporary_cleared`, `context.focus_changed`.

---

## Inputs / Outputs

| Inputs | Outputs |
|--------|---------|
| IdentitySnapshot | ContextSnapshot |
| User selection / deep link | AvailableContext[] |
| Preference store | ContextChangeEvent |

---

## Dependencies

Identity Runtime · Org/school registry · Domain party resolvers · Preference store

**Used by:** Intent, Cognition, Experience, Action

---

## Interfaces (contract)

```text
ContextRuntime {
  discover(identity): AvailableContext[]
  resolve(identity, selection?): ContextSnapshot
  switch(identity, contextId): ContextSnapshot
  setTemporary(identity, overlay): ContextSnapshot
  clearTemporary(identity): ContextSnapshot
  setFocus(identity, entityRef): ContextSnapshot
}
```

---

## Extension points

- Domain packs register Context Profiles and party resolvers.  
- Legacy surface adapters map routes → contextId.  
- Custom inheritance rules via pack config (not Core forks).

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| No available context | Experience: empty state + onboarding |
| Unauthorized context | Hide; never soft-fail into it |
| Stale focus entity | Clear focus; emit `context.focus_cleared` |

---

## Security considerations

- Context activation must re-check Identity permissions.  
- Focus entities must pass tenancy/RLS.  
- Temporary elevation of context does not elevate permissions.
