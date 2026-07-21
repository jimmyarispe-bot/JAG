import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";
import type { WorkflowCategory } from "./types";

export const WORKFLOW_FULL_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
] as const;

export const WORKFLOW_SCHOOL_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

export function canManageAllWorkflows(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((r) => WORKFLOW_FULL_ROLES.includes(r));
}

export function canManageSchoolWorkflows(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageAllWorkflows(ctx)) return true;
  return ctx.roles.includes("SCHOOL_LEADER");
}

export function canManageCategory(
  ctx: IdentityContext | null | undefined,
  category: WorkflowCategory
): boolean {
  if (!ctx) return false;
  if (canManageSchoolWorkflows(ctx)) return true;
  if (ctx.roles.includes("ADMISSIONS") && category === "admissions") return true;
  if (
    (ctx.roles.includes("EXECUTIVE_DIRECTOR") || ctx.permissions.includes("finance.view")) &&
    (category === "billing" || category === "scholarships")
  ) {
    return true;
  }
  return false;
}

export function canEditWorkflows(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolWorkflows(ctx)) return true;
  return (
    ctx.roles.includes("ADMISSIONS") ||
    ctx.permissions.includes("finance.view") ||
    ctx.permissions.includes("finance.manage")
  );
}

export function canViewWorkflows(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canEditWorkflows(ctx)) return true;
  if (ctx.roles.includes("TEACHER")) return true;
  // Parents / Students: no access
  if (ctx.roles.includes("PARENT") || ctx.roles.includes("STUDENT")) return false;
  return ctx.permissions.includes("students.view");
}

export function assertCanView(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canViewWorkflows(ctx)) {
    return { ok: false, error: "You do not have permission to view workflows." };
  }
  return { ok: true, ctx };
}

export function assertCanEdit(
  ctx: IdentityContext | null | undefined
): { ok: true; ctx: IdentityContext } | { ok: false; error: string } {
  if (!ctx) return { ok: false, error: "Unauthorized" };
  if (!canEditWorkflows(ctx)) {
    return { ok: false, error: "You do not have permission to manage workflows." };
  }
  return { ok: true, ctx };
}

export async function requireWorkflowViewAccess() {
  return assertCanView(await getIdentityContext());
}

export async function requireWorkflowEditAccess() {
  return assertCanEdit(await getIdentityContext());
}
