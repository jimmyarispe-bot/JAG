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

1. Toolbar + Search on `UsersAccessPanel` always render (manage buttons disable when `!canManage`; never hide).
2. Page comment guards against reverting to `UsersAssignmentsPanel`.
3. Ship `UsersAccessPanel` on the branch Vercel deploys (rc1 + sync to `main` if production tracks `main`).

## Validation

After deploy, `/dashboard/admin/users` must show `data-testid="users-access-toolbar"` with:

- + Add User  
- Import CSV  
- Invite Users  
- Export  
- Search…
