# RC-001 — JAG v1.0 Release Candidate Hardening

**Sprint:** RC-001  
**Status:** Complete  
**Scope:** Production readiness only — no new features, pages, or intelligence.

---

## 1. Objective

Make the existing Executive Command Center feel like an enterprise product: cohesive UX, accessible navigation, performant routes, auditable executive actions, and graceful failure modes.

Constraints:

- No JAG Core changes  
- No Runtime changes  
- No Domain SDK changes  
- Application layer + UI only  

---

## 2. UX consistency

Shared primitives under `src/components/jag/command-center/`:

| Primitive | Role |
|-----------|------|
| `JagSection` | Page section chrome |
| `JagEmptyState` | Empty / unbound data |
| `JagErrorState` | User-safe errors |
| `JagLoadingSkeleton` | Loading / Suspense fallbacks |
| `JagStatusBadge` | loading / empty / ready |

Shell spacing, max content width, focus styles, and reduced-motion rules live in `command-center.css`.

---

## 3. Performance

| Route | Hardening |
|-------|-----------|
| `/jag` | Suspense + shared skeleton; request-scoped loaders |
| `/jag/decisions` | Data load inside Suspense child; `loading.tsx` |
| `/jag/briefings` | Data load inside Suspense child; `loading.tsx` |

Also:

- Prefer Server Components for list/detail  
- Avoid client bundles for catalog synthesis (`search-filter` is the only client-safe search helper)  
- `cache()` wraps `loadJagSearchCatalog` for request dedupe  

---

## 4. Accessibility

- Skip link → `#jag-main`  
- Focus-visible outlines on interactive controls  
- `prefers-reduced-motion` disables non-essential animation  
- Cmd/Ctrl+K command palette with listbox semantics  
- Sidebar menu buttons labeled for screen readers  
- Notification panel uses region + Escape to close  

---

## 5. Responsiveness

- Mobile sidebar overlay  
- Header compresses search/org controls on small screens  
- Content capped at `max-w-[90rem]` for large executive displays  
- Avoid layout shift via reserved header height and skeleton cards  

---

## 6. Executive action audit

Store: `src/lib/jag-command-center/audit/`

Every executive mutation records:

- Timestamp  
- Organization (when known)  
- User (id + label)  
- Decision ID / Briefing ID  
- Action  

Covered actions include: brief generated, decision approved/assigned/completed, outcome reviewed, executive note added, follow-up scheduled, share created.

Readable on the existing Observability route (`/jag/observability`).

---

## 7. Error handling

- Route `error.tsx` shows `JagErrorState` — never stack traces  
- Empty states explain unbound data  
- Server actions return `{ ok: false, error }` strings suitable for UI  
- Permission / auth failures redirect to login  

---

## 8. Search polish

Global search via **⌘K / Ctrl+K** (`JagCommandPalette`).

Catalog includes:

Decisions · Briefings · Organizations · Capability Packs · Domains · Contributors · Knowledge · Policies · Navigation

---

## 9. Notifications

In-app only (`src/lib/jag-command-center/notifications/`).

Examples:

- Decision assigned  
- Decision overdue  
- Brief ready  
- Decision approved  
- Follow-up scheduled  

Header bell surfaces unread items. No email delivery in RC-001.

---

## 10. Quality review

- Removed unused barrel export of `JagOverviewGrid`  
- Shared empty/loading/error components replace ad-hoc dashed boxes on primary queues  
- Client/server search helpers split to prevent accidental client bundles of domain loaders  

---

## Success criteria

An executive can move through Overview, Decision Center, and Briefings with consistent chrome, keyboard search, auditable actions, and safe empty/error states — without Core, Runtime, or Domain SDK changes.
