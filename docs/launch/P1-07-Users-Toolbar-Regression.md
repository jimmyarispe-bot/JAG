# P1.07 — Users & Access toolbar regression

**Date:** 2026-07-19  
**Symptom:** Missing Add User / Import / Invite / Export / Search; table still showed Assign School + Impersonate  

## Root cause

The visible UI matched the **legacy** `UsersAssignmentsPanel` (columns: User, Roles, School access, Assign school, Act as), **not** `UsersAccessPanel`.

| Branch | Users page component |
|--------|----------------------|
| `origin/main` | Old `UsersAssignmentsPanel` — **no toolbar** |
| `origin/release/v1.0.0-rc1` | `UsersAccessPanel` — toolbar present |

Not RBAC, not RLS, not a feature flag. Production (or the environment under test) was serving a deploy whose git tree still had the pre–P1.03 page.

## Fix applied

1. Toolbar + Search always render (manage buttons disable when `!canManage`; never hide).
2. **Legacy module removed:** `UsersAssignmentsPanel.tsx` deleted.
3. **UI colocated on the route:** `src/app/dashboard/admin/users/UsersAccessView.tsx` (imported only as `./UsersAccessView`).
4. **No static cache:** `dynamic = "force-dynamic"`, `revalidate = 0`, `fetchCache = "force-no-store"` so stale RSC/HTML cannot serve the old assignments UI.

## Validation

After deploy, `/dashboard/admin/users` must show `data-testid="users-access-toolbar"` and `data-users-ui="access-v2"` with:

- + Add User  
- Import CSV  
- Invite Users  
- Export  
- Search…  

Hard-refresh (or empty cache) once so old `/_next/static` client chunks are not reused from a prior deploy.
