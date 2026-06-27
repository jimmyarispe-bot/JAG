# Platform Profile Workspace

The Profile Workspace is a **layout shell**, not a tab container. It defines three permanent regions; modules own all domain content.

## Layout regions

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER — identity, badges, alerts, actions                 │
├──────────────────────────────────────┬──────────────────────┤
│  WORKSPACE                           │  CONTEXT PANEL       │
│  · section navigation                │  · quick actions     │
│  · workspace alerts                  │  · widgets           │
│  · module-owned content              │  · AI recommendations│
│                                      │  · notifications     │
│                                      │  · tasks             │
│                                      │  · approvals         │
└──────────────────────────────────────┴──────────────────────┘
```

## Components

| Component | Path | Role |
|-----------|------|------|
| `ProfileWorkspaceShell` | `components/platform/profile-workspace/` | Layout only — composes three regions |
| `ProfileWorkspaceHeader` | same | Header region |
| `ProfileWorkspaceSectionNav` | same | Section picker inside workspace |
| `ProfileContextPanel` | same | Context panel slot renderer |
| `ProfileSectionPlaceholder` | same | Placeholder for registered-but-unbuilt sections |

## Module contributions

Modules register contribution **metadata** via `registerProfileContribution()` and render content in domain workspace composers:

```typescript
registerProfileContribution({
  id: "student.context.quick_actions",
  slot: "context.quick_actions",
  profileKind: "student",
  moduleKey: "ssis",
  label: "Quick Actions",
  sortOrder: 10,
});
```

Slots: `header.actions`, `header.alerts`, `header.badges`, `workspace.alerts`, `context.widgets`, `context.quick_actions`, `context.ai_recommendations`, `context.notifications`, `context.tasks`, `context.approvals`.

The shell accepts resolved `ProfileWorkspaceContributions` — it never imports domain modules.

## Student implementation (first workspace)

`StudentProfileWorkspace` composes the shell with:

- Header: avatar, badges, alerts, teacher/admissions links
- Workspace: section nav + `StudentProfileSectionBridge` (legacy content bridge until Phase 4)
- Context: quick actions, AI placeholder, notifications

Route: `/dashboard/students/{id}?section=overview` (legacy `?tab=` still supported via inline remap)

Employee route: `/dashboard/hr/employees/{id}?section=overview` (legacy `?tab=` issues HTTP redirect to `?section=`)

Family route: `/dashboard/families/{id}?section=overview` — household operational dashboard on Overview

## Developer diagnostics

Platform engineers can inspect registry and service health at `/dashboard/platform/diagnostics`. The page is read-only and mirrors build-time registry validation output.

## Testing

Profile workspace behavior is covered by integration tests (`tests/integration/profile-routes.test.ts`) and smoke tests (`tests/smoke/profile-routes.spec.ts`). See `docs/architecture/platform-testing-strategy.md`.

## Adding a new profile workspace

1. Register profile kind + sections (Phase 2 registry)
2. Register contribution metadata
3. Create `{Domain}ProfileWorkspace.tsx` composer
4. Wire route to `ProfileWorkspaceShell` with domain slots
