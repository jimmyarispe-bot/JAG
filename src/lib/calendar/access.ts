import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import type { EduRoleName } from "@/types/database";

export const CALENDAR_FULL_ROLES: readonly EduRoleName[] = ["CEO", "FOUNDER"] as const;
export const CALENDAR_SCHOOL_ROLES: readonly EduRoleName[] = [
  "CEO",
  "FOUNDER",
  "SCHOOL_LEADER",
] as const;

export function canManageSchoolCalendar(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  return ctx.roles.some((r) => CALENDAR_SCHOOL_ROLES.includes(r));
}

export function canEditCalendar(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolCalendar(ctx)) return true;
  if (ctx.roles.includes("TEACHER")) return true;
  if (ctx.roles.includes("ADMISSIONS")) return true;
  return (
    ctx.permissions.includes("scheduling.manage") ||
    ctx.permissions.includes("scheduling.view") ||
    ctx.permissions.includes("hr.view")
  );
}

export function canViewCalendar(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canEditCalendar(ctx)) return true;
  return (
    ctx.roles.includes("PARENT") ||
    ctx.roles.includes("STUDENT") ||
    ctx.permissions.includes("students.view") ||
    ctx.permissions.includes("portal.parent.access")
  );
}

/** Admissions may only manage admissions-related meeting types (enforced in actions). */
export function canManageAdmissionsCalendar(ctx: IdentityContext | null | undefined): boolean {
  if (!ctx) return false;
  if (canManageSchoolCalendar(ctx)) return true;
  return ctx.roles.includes("ADMISSIONS");
}

export function assertCanView(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canViewCalendar(ctx)) {
    return { ok: false as const, error: "You do not have permission to view the calendar." };
  }
  return { ok: true as const, ctx };
}

export function assertCanEdit(ctx: IdentityContext | null | undefined) {
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  if (!canEditCalendar(ctx)) {
    return { ok: false as const, error: "You do not have permission to edit the calendar." };
  }
  return { ok: true as const, ctx };
}

export async function requireCalendarViewAccess() {
  return assertCanView(await getIdentityContext());
}

export async function requireCalendarEditAccess() {
  return assertCanEdit(await getIdentityContext());
}
