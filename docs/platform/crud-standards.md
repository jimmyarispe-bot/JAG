# AcademyOS Platform CRUD Standards

Universal lifecycle consistency for every manageable entity across AcademyOS.

## Completion gate (mandatory)

> **No new module may be considered complete until it complies with the AcademyOS CRUD Standard.**

CRUD is **Gate 1** of the [Module Completion Standard (v2)](./module-completion-standard.md). A module still cannot be marked complete until Security, Workflow, EI, Docs, Tests, UX, Production, and other applicable gates pass.

This is a platform rule, not a suggestion.

| Claim | Allowed only when |
|-------|-------------------|
| Module / sprint / entity is **complete** | Capability matrix + UI + server actions + History + soft end-state (or immutable policy) satisfy the gate |
| Work in progress | `ENTITY_RELEASE_STATUS` remains `partial` or `deferred` |

Enforcement:

| Mechanism | Location |
|-----------|----------|
| Release status map | `src/lib/platform/crud/completion-gate.ts` → `ENTITY_RELEASE_STATUS` |
| Programmatic check | `canMarkModuleComplete(entityKey)` / `validateCrudCompletionGate()` |
| CI / build validation | `npm run validate:crud` (wired into `npm run build`) |
| Agent rule | `.cursor/rules/crud-completion-gate.mdc` |

**New entities** must be registered as `partial` and may move to `complete` only after:

1. Actions registered in `ENTITY_CAPABILITIES`
2. List ••• menu and/or profile toolbar using shared CRUD components
3. Soft end-state: Archive **or** Cancel **or** Deactivate (unless `immutable`)
4. Restore when archive + hard-delete are both used
5. History / audit entry point
6. Permissions hidden (not disabled) + enforced server-side
7. Destructive delete uses checkbox + type `DELETE` + dependency gate
8. Lifecycle events published to Executive Intelligence
9. `npm run validate:crud` passes

## Platform CRUD rules

Every major entity exposes the **appropriate** subset of:

| Action | Meaning |
|--------|---------|
| View | Open list/detail/profile |
| Create | New record |
| Edit | Modify fields |
| Archive | Soft-retire (preferred end-state) |
| Restore | Return from archive |
| Delete | Permanent removal (gated) |
| Duplicate | Clone as draft/copy |
| History | Timeline + audit |

Capability matrix (source of truth): `src/lib/platform/crud/registry.ts`

```
import { entitySupports, getEntityCapability } from "@/lib/platform/crud";
entitySupports("workflow", "duplicate"); // true
```

### Entity examples

| Entity | Typical actions |
|--------|-----------------|
| Student / Family | View, Create, Edit, Archive, Restore, Delete, History (+ Merge/Split for Family) |
| Communication | View, Edit draft, Duplicate, Archive, Restore, Delete (draft/failed only), History |
| Announcement / Template | Edit, Duplicate, Archive, Restore (templates), History |
| Calendar event | Edit, Reschedule, Duplicate, Cancel |
| Workflow | Edit, Enable/Disable, Duplicate, Archive, Restore, Delete, Execution History |
| Employee | Edit, Deactivate, Restore, History (no hard delete) |
| Invoice / Payment | View + immutable end-states (void / refund) — **never** hard delete |

## Delete policy

1. **Never delete immediately** — always confirm.
2. Confirmation requires:
   - Checkbox acknowledgement
   - Typing `DELETE`
3. Dialog must show **Name**, **ID**, **Dependencies**, **Impact**.
4. If dependencies block deletion → **block** hard delete and **offer Archive**.
5. Server-side enforcement via `validateDeleteConfirmation` + dependency reports.
6. Shared UI: `DestructiveConfirmDialog` (`src/components/platform/crud/`).

## Archive policy

- Prefer archive over permanent delete for operational records.
- Archived records remain queryable (filter: Active / Archived / All).
- Restore must reverse archive without data loss.
- Domain synonyms allowed when archive is wrong vocabulary:
  - Calendar → **Cancel**
  - Employee → **Deactivate** (`employment_status`)
  - Billing → **Void / write-off / refund**

## Permission model

- **Hide** actions the user cannot perform. Do **not** disable them for permission reasons.
- Permissions are always re-checked in server actions.
- Role examples: CEO/Founder full; School Leader school-scoped; Teachers/Admissions narrower scopes; Parents/Students view-only where applicable.

## UI standards

Shared components (`src/components/platform/crud/`):

| Placement | Component |
|-----------|-----------|
| List row | `EntityActionMenu` (•••) |
| Profile / detail toolbar | `EntityActionToolbar` (Edit · Archive · Delete · More) |
| History | `EntityHistoryLink` / toolbar `historyHref` |
| Destructive confirm | `DestructiveConfirmDialog` |
| Button tokens | `crudBtn` (primary / secondary / danger) |

Ordering (left → right / top → bottom):

1. Primary (Edit / Create)
2. Secondary (Archive, Duplicate, Enable…)
3. Danger (Delete / Deactivate / Cancel)
4. Overflow (More / •••)

## Keyboard shortcuts

When appropriate (not while typing in inputs):

| Shortcut | Action |
|----------|--------|
| `E` | Edit |
| `Del` | Delete / open destructive dialog |
| `Ctrl+D` | Duplicate |
| `Ctrl+S` | Save |
| `Esc` | Cancel / close dialog |

Hook: `useEntityShortcuts`.

## Accessibility

- All actions keyboard reachable
- `aria-label` / `aria-haspopup` / `role="menu"` / `role="dialog"`
- Focus trap in destructive dialogs
- Touch-friendly targets (min ~36px) and overflow menus on mobile

## Audit / Executive Intelligence

Lifecycle actions publish activity events, e.g.:

- `entity.created` / `entity.updated`
- `entity.archived` / `entity.restored`
- `entity.deleted` / `entity.duplicated`

Helper: `lifecycleEventType(entityKey, action)` in `src/lib/platform/crud/activity.ts`.  
Catalog: `src/lib/platform/activity/catalog.ts`.

Every profile should expose **History** (timeline + audit) via Activity section or dedicated history route.

## Testing requirements

- Unit tests for confirmation policy and capability registry
- Completion-gate tests (`canMarkModuleComplete`, `validateCrudCompletionGate`)
- Regression: student/family lifecycle still passes
- Module tests for new restore/duplicate/delete paths where added
- `npm run validate:crud` clean
- `tsc --noEmit` clean

## Implementation kit

| Layer | Path |
|-------|------|
| Types / policy / registry | `src/lib/platform/crud/` |
| Completion gate | `src/lib/platform/crud/completion-gate.ts` |
| UI primitives | `src/components/platform/crud/` |
| Reference adapters | Student / Family lifecycle actions |
| Newer adapters | Communications, Workflows, Calendar, Employees |
| Validator | `scripts/validate-crud-standards.mts` |
