import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { userHasPermission } from "@/lib/platform/identity/permissions";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const TAG_CREATE_PERMISSIONS = ["configuration.manage", "configuration.admin", "students.edit"] as const;
const TAG_APPLY_PERMISSIONS = ["students.edit", "configuration.manage", "hr.manage"] as const;
const TAG_REMOVE_PERMISSIONS = ["students.edit", "configuration.manage"] as const;

export async function canCreateTag(supabase: AuthClient): Promise<boolean> {
  for (const permission of TAG_CREATE_PERMISSIONS) {
    if (await userHasPermission(supabase, permission)) return true;
  }
  return false;
}

export async function canApplyTags(supabase: AuthClient): Promise<boolean> {
  for (const permission of TAG_APPLY_PERMISSIONS) {
    if (await userHasPermission(supabase, permission)) return true;
  }
  return false;
}

export async function canRemoveTags(supabase: AuthClient): Promise<boolean> {
  for (const permission of TAG_REMOVE_PERMISSIONS) {
    if (await userHasPermission(supabase, permission)) return true;
  }
  return false;
}

export async function assertTagCreatePermission() {
  return assertAnyPermission(...TAG_CREATE_PERMISSIONS);
}

export async function assertTagApplyPermission() {
  return assertAnyPermission(...TAG_APPLY_PERMISSIONS);
}

export async function assertTagRemovePermission() {
  return assertAnyPermission(...TAG_REMOVE_PERMISSIONS);
}

export async function requireTagCreatePermission(
  supabase: AuthClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await canCreateTag(supabase)) return { ok: true };
  return { ok: false, error: "Forbidden" };
}

export async function requireTagApplyPermission(
  supabase: AuthClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await canApplyTags(supabase)) return { ok: true };
  return { ok: false, error: "Forbidden" };
}

export async function requireTagRemovePermission(
  supabase: AuthClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await canRemoveTags(supabase)) return { ok: true };
  return { ok: false, error: "Forbidden" };
}

/** Server-side permission check mirroring platform_entity_tags RLS write policy. */
export async function requireTagWriteForAction(
  supabase: AuthClient,
  action: "create" | "apply" | "remove"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (action === "create") return requireTagCreatePermission(supabase);
  if (action === "apply") return requireTagApplyPermission(supabase);
  return requireTagRemovePermission(supabase);
}
