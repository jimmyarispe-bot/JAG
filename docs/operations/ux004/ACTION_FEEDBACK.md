# UX-004 — Universal Action Feedback System

| Field | Value |
|-------|-------|
| **Sprint** | UX-004 |
| **Status** | Complete (unified with UX-003 CTA) |

## Principle

Every action produces visual feedback within **100ms**. Users never wonder whether a click registered.

## Unified control (UX-003 + UX-004)

One component family — not separate “CTA button” vs “loading button”:

```tsx
<ActionButton
  variant="primary"
  status={action.status}       // idle | loading | processing | success | error
  loading={isPending}          // alias
  success={justSaved}          // alias
  verb="save"
  icon={...}
  errorMessage={action.errorMessage}
  onRetry={() => void action.run(...)}
/>

// Navigation / chips share the same chrome + lifecycle:
<ActionChip href="/dashboard" verb="open">Open</ActionChip>
```

| Piece | Path |
|-------|------|
| `ActionChip` / `CTAButton` | `feedback/ActionChip.tsx` |
| `ActionButton` | thin wrapper → ActionChip |
| `useActionFeedback` | lifecycle + toast + SR + global progress + `reportProgress` |
| `OperationProgress` | determinate / indeterminate long ops |
| `InlineRefresh` | widget refresh |
| `AiActivity` / `WorkspaceActivity` | AI + Mission Control activity |
| Skeletons | UX-002 `experience-system/skeletons` + route `loading.tsx` |

## Interaction states

| State | How |
|-------|-----|
| Idle | Default label |
| Hover | Variant hover + brightness |
| Pressed | `active:scale-[0.98]` / brightness |
| Loading | Inline spinner + label; `pointer-events: none`; `aria-busy` |
| Success | ✓ label 800ms then idle |
| Error | ⚠ + message + optional **Retry** chip; toast + assertive live region |
| Disabled | `disabled` / opacity |

## Thresholds

| Signal | Timing |
|--------|--------|
| Immediate feedback | ≤100ms (spinner on first loading paint) |
| Processing + background job | >2000ms |
| Success flash | 800ms |

## Long-running workflows with progress

| Workflow | Indicator |
|----------|-----------|
| Data import validate/commit | `OperationProgress` + global progress |
| Migration session start | `useActionFeedback` progressLabel |
| EDI / export verbs | `export` verb labels |
| AI recommendations | `AiActivity` (`analyzing` prop) |
| Mission Control resolve | `WorkspaceActivity` (“Resolving… / Scanning risks…”) |
| Module card open | `verb="open"` Opening… → Navigating… |

## Skeletons

Route-level: `dashboard/*/loading.tsx` (admissions, executive, finance, hr, scheduling, students, teacher, work, jag) + `ProgressivePageShell` / widget skeletons from UX-002.

## Accessibility

- `aria-busy` while loading/processing  
- `aria-live` polite (busy/success) / assertive (error)  
- Focus ring retained; disabled prevents double submit  
- Layout-stable label grid reduces CLS on state change  

## Migration footprint

| Category | Count (approx.) |
|----------|----------------:|
| Call sites already on `ActionButton` / `useActionFeedback` | **80+ files** |
| Enhanced this sprint (unified API, progress, AI/MC activity, import progress, login) | **~10** |
| New verbs (`open`, `export`, `retry`) | 3 |

Ad hoc `setLoading` / raw spinners should continue migrating to `useActionFeedback` + `ActionButton` — no parallel loading button system.

## Remaining exceptions

| Exception | Rationale |
|-----------|-----------|
| True content hyperlinks in prose | Not actions (UX-003) |
| External meeting URLs already as ActionChip | Full lifecycle optional (navigation) |
| Browser-native file download progress | OS chrome; app shows Preparing/Downloading labels |
| Optimistic UI for attendance/notes | Partial — notifications mark-read already uses ActionButton; deeper optimistic lists deferred |

## Validation

- `npm run typecheck`  
- `npm run perf:audit`  
- `npm run perf:regression`  
- Unit: `tests/unit/action-feedback-ux004.test.ts`  
