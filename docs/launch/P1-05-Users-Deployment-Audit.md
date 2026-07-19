# P1.05 — Users & Access Deployment Audit

**Date:** 2026-07-19  
**Route under audit:** `/dashboard/admin/users`  
**Branch:** `release/v1.0.0-rc1` @ `2a1afbd` (remote)  
**Business task blocked:** Create the first employee without SQL  

---

## Expected UI

`UsersAccessPanel` at `/dashboard/admin/users` with:

| Control | Expected |
|---------|----------|
| Header | **Users & Access** |
| Actions | **+ Add User**, **Import CSV**, **Invite Users**, **Export** |
| Search | Search… input |
| Empty state | “No users have been added yet…” when directory empty |
| Table | Name, Email, Role, Schools, Department, Status, Last Login, Actions |
| Modals | Add User / Import CSV / Invite Users |

Local implementation (working tree):

- `src/app/dashboard/admin/users/page.tsx` → imports `UsersAccessPanel`
- `src/components/platform/admin/UsersAccessPanel.tsx`
- `src/lib/platform/identity/user-management.ts`
- `src/lib/platform/identity/user-management-actions.ts`
- `src/lib/platform/identity/user-management-catalog.ts`
- `supabase/migrations/182_p103_user_management_rls.sql`

---

## Actual UI (deployed / remote HEAD)

Remote `origin/release/v1.0.0-rc1` still serves the **pre–P1.03** page:

```tsx
// git show origin/release/v1.0.0-rc1:src/app/dashboard/admin/users/page.tsx
import { UsersAssignmentsPanel } from "@/components/platform/admin/UsersAssignmentsPanel";
// PageHeader: "Users & Access" / "Multi-school assignments, scopes, and impersonation"
// Table only: User · Roles · School access · Assign school · Impersonate
```

| Control | Actual on Vercel (from remote tree) |
|---------|-------------------------------------|
| Add User | **Missing** |
| Import CSV | **Missing** |
| Invite Users | **Missing** |
| Export | **Missing** |
| Search | **Missing** |
| Empty state | **Missing** (always renders table) |
| Component | `UsersAssignmentsPanel` (assignment/impersonation only) |

`git ls-tree origin/release/v1.0.0-rc1` contains **no** `UsersAccessPanel.tsx` and **no** `user-management*.ts`.

---

## Root cause

**P1.03 was implemented in the local working tree and never committed / never pushed.**

| File | Local status | On remote? |
|------|--------------|------------|
| `UsersAccessPanel.tsx` | `??` untracked | No |
| `user-management.ts` | `??` untracked | No |
| `user-management-actions.ts` | `??` untracked | No |
| `user-management-catalog.ts` | `??` untracked | No |
| `182_p103_user_management_rls.sql` | `??` untracked | No |
| `users/page.tsx` | `M` modified locally | No (still old import) |
| `UsersAssignmentsPanel.tsx` | `M` (local re-export) | Old full panel |
| `queries.ts` | `M` | Old directory shape |

Not caused by:

- Feature flags (none gate this route)
- Build exclusion (files simply absent from git)
- Wrong route (route exists; wrong component version)

### Permission condition (secondary, post-deploy)

In `UsersAccessPanel`, header actions render only when `canManage === true`:

```tsx
{canManage && ( /* + Add User, Import CSV, Invite Users, Export */ )}
```

Page passes:

```tsx
canManage={hasIdentityPermission(ctx, "users.manage") || isFounder}
```

| Role | `users.manage` via catalog |
|------|----------------------------|
| **FOUNDER** | Yes — `permissionsForMappedRole("FOUNDER")` returns all `PERMISSION_KEYS`, including `users.manage` (via `USER_MANAGEMENT_ACCESS` group) |
| ADMINISTRATOR | Yes — `USER_MANAGEMENT_ACCESS` |
| CEO | Yes — `USER_MANAGEMENT_ACCESS` |

Exact hide condition: `canManage === false` (no `users.manage` and not Founder).  
That is **not** why production looks empty of onboarding controls today — production never received the panel. After deploy, Founder fallback keeps controls visible even if the permission snapshot is incomplete.

### Server create path (post-deploy ops)

Creating a user also requires:

1. Migration `182_p103_user_management_rls.sql` applied (role RLS + CEO/EMPLOYEE seed)
2. `SUPABASE_SERVICE_ROLE_KEY` on Vercel (Auth Admin API)
3. Actor with `users.manage` (or Founder) for the server action gate

---

## Required fix

1. ~~**Commit** the P1.03 Users & Access files on `release/v1.0.0-rc1`.~~ **Done** — `2c303fd`
2. ~~**Push** to origin so Vercel builds the new tree.~~ **Done** — `origin/release/v1.0.0-rc1`
3. **Apply** migration `182` on the target Supabase project *(ops — still required)*.
4. Confirm Vercel env has `SUPABASE_SERVICE_ROLE_KEY` *(ops — still required)*.
5. Wait for Vercel deploy, hard-refresh `/dashboard/admin/users`, create the first employee via **+ Add User**.

Do **not** create a second users page — repair is deploy of the existing route.

---

## Estimated implementation time

| Step | Time |
|------|------|
| Commit + push P1.03 files | **5–10 minutes** |
| Vercel build / deploy | **5–15 minutes** (platform) |
| Apply migration 182 | **2–5 minutes** |
| Smoke: Add User as Founder | **5 minutes** |
| **Total** | **~20–35 minutes** |

No greenfield feature work required — ship what is already in the working tree.

---

## Verification checklist (after deploy)

- [ ] Production HTML/JS references `UsersAccessPanel` (or shows + Add User)
- [ ] Founder sees Add User / Import / Invite / Export / Search
- [ ] Create User succeeds for one real employee (no SQL)
- [ ] New row appears in the users table with role + school

---

## Operating note

This incident validates the rule: **if a real business task cannot be completed inside JAG, stop and fix the blocker before the next task.**  
The blocker here was not “missing intelligence” — it was **undeployed product UI**.
