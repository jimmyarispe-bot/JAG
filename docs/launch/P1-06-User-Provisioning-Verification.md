# P1.06 — User Provisioning Verification

**Date:** 2026-07-19  
**Route:** `/dashboard/admin/users`  
**Trigger:** Successful **Create User** toast / action result  
**Do not redesign:** audit + minimal repair only  

---

## Flow checklist

| Step | Status | Evidence |
|------|--------|----------|
| Create User action | ✅ Success | `createUserAction` → `createManagedUser` returns `{ success: true }` when Auth Admin succeeds |
| Supabase Auth user created | ✅ Success | `admin.auth.admin.createUser` / `inviteUserByEmail` (service role) |
| `public.users` profile created | ✅ Success | Trigger `handle_new_auth_user` (174) + service-role upsert in `attachMembershipAndScope` |
| Role assigned | ✅ Success | `user_roles` upsert via service role (needs role seeded; CEO/EMPLOYEE via 182) |
| Organization assigned | ✅ Success | `user_organization_memberships` upsert via service role |
| School assignment stored | ⚠️ Skipped if none selected / ✅ if school checkboxes set | Loop over `schoolIds`; empty array skips without failing create |
| Page revalidated | ✅ Success | `revalidatePath("/dashboard/admin/users")` + client `router.refresh()` |
| User appears in directory | ❌ Failure (pre-fix) | Directory SELECT blocked by RLS for Founder / `users.view` |

---

## Specific checks

| Question | Answer |
|----------|--------|
| Was a row inserted into `public.users`? | **Yes** (service role + auth trigger). Create can succeed while the UI still hides the row. |
| Does the Users page query that same table? | **Yes** — `getAdminUsersDirectory()` → `from("users").select(...)` |
| Stale cached data? | **Not the primary cause.** `revalidatePath` + `router.refresh` run; the refreshed query still cannot see the row under RLS. |
| Is `revalidatePath()` called? | **Yes** — `user-management-actions.ts` → `revalidateUsers()` after successful create. |
| Filters hiding the new user? | **UI search only** if the Search box has text. Default search is empty. **Real filter:** Postgres RLS on `public.users`. |

---

## Root cause

Policy from `015_user_self_access_policy.sql`:

```sql
create policy "user_self_access"
on users
for select
using (
  id = auth.uid()
  or has_role('CEO')
  or has_role('SCHOOL_LEADER')
);
```

**FOUNDER**, **ADMINISTRATOR**, and permission keys **`users.view` / `users.manage` are not included.**

Provisioning writes with the **service role** (bypasses RLS).  
Directory reads with the **session client** (RLS applies).  

So a Founder can create Jimmy/Danni/etc. in Auth + `public.users`, get a success response, refresh the page, and still only see **their own** row.

Secondary gap (hardened in code): `attachMembershipAndScope` previously ignored Supabase `{ error }` on upserts (no throw). Errors are now asserted so partial attach cannot report success silently.

---

## Exact failing step

**Step: “User appears in directory”**  
**Failure mode:** `getAdminUsersDirectory()` SELECT on `public.users` returns only `id = auth.uid()` for Founder actors → new profile exists but is invisible.

Not failing: Auth create, profile write (service role), role/org writes (service role), revalidation call.

---

## Required fix

1. Apply migration **`183_p106_users_directory_select_rls.sql`** — expand `public.users` SELECT for:
   - `users.view` / `users.manage`
   - `FOUNDER` / `CEO` / `ADMINISTRATOR` / `SCHOOL_LEADER`
   - own row (`id = auth.uid()`)
2. Deploy code that asserts attach-step errors (already in `user-management.ts`).
3. Hard-refresh `/dashboard/admin/users` after migration — previously created users should appear without re-create (rows already exist).

---

## Validation steps

1. Apply `183_p106_users_directory_select_rls.sql` on the target Supabase project.
2. As Founder, open `/dashboard/admin/users` — confirm previously created employees now list (if Auth create succeeded earlier).
3. **+ Add User** with a new email, role, org, ≥1 school → expect success toast.
4. Confirm new row in the table (same session, no SQL).
5. In Supabase SQL (optional):

```sql
select id, email, full_name from public.users order by created_at desc limit 10;
select ur.user_id, r.name from user_roles ur join roles r on r.id = ur.role_id
  order by ur.user_id desc limit 20;
```

6. Confirm school columns populate when schools were checked at create time.

---

## Operating note

“Create User succeeded” only proved the **write** path. The business task **see and manage the first employee** failed at **read RLS** — stop here until migration 183 is applied before the next product task.
