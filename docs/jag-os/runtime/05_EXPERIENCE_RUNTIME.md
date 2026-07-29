# 05 — Experience Runtime

**Subsystem 5 of 6** · Experience Composition (not Domain)

---

## Purpose

Compose the **user-visible experience** from Identity, Context, Intent, and CognitiveBrief—widgets, workspaces, briefings, notifications, command/search chrome, navigation—**without business logic**.

This is the constitutional home of the Experience Orchestrator™ (Ω-1 implementation slice).

---

## Responsibilities

1. Widget composition from registered widget catalog.  
2. Workspace composition for the active Context Profile.  
3. Personalized briefings from CognitiveBrief (evidence-gated).  
4. Notification surfaces (Core messaging contract; not a second inbox product).  
5. Command interface (UI over Core Command capability).  
6. Search interface (UI over Core Search capability).  
7. Navigation model (context-first, not portal-first).  
8. Accessibility (WCAG-oriented composition rules).  
9. Personalization (density, layout prefs, pinned widgets)—presentation only.  
10. **No** SoR writes, ledger math, mastery scoring, or domain rules.

---

## Widget composition

```text
WidgetDescriptor {
  widgetId
  slot                  // briefing | primary | secondary | utility
  dataBindings[]        // read-model keys / cognitive item ids
  actions[]             // actionCandidateIds (dispatched via Action Runtime)
  a11y                  // label, roles, keyboard
  visibilityRules       // permission + context + intent filters
}
```

Widgets are **registered** by Core and Domain packs; Experience Runtime selects/orders them.

---

## Workspace composition

```text
WorkspaceModel {
  contextId
  title                 // never a separate product brand
  layout
  widgets[]
  briefing?
  navModel
  commandEnabled
  searchEnabled
  accessibilityProfile
}
```

Legacy portals/dashboards may **host** a WorkspaceModel during migration; they are not architecture.

---

## Briefings

- Render CognitiveBrief.summary + priorities.  
- Show evidence affordances / “I don’t know” gaps.  
- CTA buttons emit Action candidates—never execute domain logic inline.

---

## Notifications

- Subscribe to Core notification/messaging contract.  
- Filter by Identity + Context.  
- Deep-link into Context + Intent, not into branded mini-apps.

---

## Command & Search interfaces

| Surface | Owns | Does not own |
|---------|------|--------------|
| Command UI | Presentation, shortcuts | Command registry / execution policy (Core) |
| Search UI | Query box, results layout | Indexing / retrieval engines (Core) |

Both feed Intent Runtime with explicit signals.

---

## Navigation

- Primary: Context switcher + within-context sections.  
- Secondary: legacy route maps during Ω migration.  
- Forbidden: selling “Parent Portal” as a separate product in nav taxonomy (label as Family Context).

---

## Accessibility

- Keyboard-first command/search.  
- Landmark regions for briefing / primary / utility.  
- Live regions for cognition refresh.  
- Contrast and focus order as composition constraints.  
- Respect user a11y preferences from Identity preferences.

---

## Personalization

Allowed: layout density, pinned widgets, default context, theme tokens within brand system.  
Forbidden: per-user forks of domain rules or shadow permissions.

---

## No business logic

Experience Runtime may:

- Format dates/currency for display  
- Sort already-ranked CognitiveBrief items for layout  
- Hide unauthorized widgets  

It may **not**:

- Compute tuition, grades, risk scores, or ledger balances  
- Approve workflows without Action Runtime  
- Invent recommendations without CognitiveBrief

---

## Inputs / Outputs / Dependencies

| Inputs | Outputs |
|--------|---------|
| IdentitySnapshot | WorkspaceModel |
| ContextSnapshot | NotificationViewModel |
| IntentSnapshot | NavModel |
| CognitiveBrief | Clarification UI model |

Depends on: widget registry, design system, Command/Search Core, messaging Core.

**Used by:** App shell / legacy surfaces (renderers only)

---

## Events

`experience.composed`, `experience.widget_shown|hidden`, `experience.briefing_rendered`, `experience.clarification_shown`, `experience.nav_updated`.

---

## Interfaces (contract)

```text
ExperienceRuntime {
  compose(identity, context, intent, brief): WorkspaceModel
  composeBriefing(brief): BriefingModel
  composeNav(identity, context): NavModel
}
```

---

## Extension points

- Domain/Core widget registration.  
- Slot policies per Context Profile.  
- Legacy surface adapters (route → WorkspaceModel host).  
- Theme/brand tokens (org white-label)—presentation only.

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Empty brief | Compose shell + unknown gaps + safe nav |
| Missing widget | Skip slot; log; do not crash workspace |
| Partial permissions | Hide widgets/actions |

---

## Security considerations

- Never render secrets from CognitiveBrief without scope checks.  
- Action CTAs must re-authorize at Action Runtime.  
- Personalization must not leak cross-user layouts in shared devices (session-bound).
