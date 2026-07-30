/**
 * Role catalog + landing / middleware prefix probes — Sprint 210.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_PLATFORM_ROLES } from "@/lib/platform/identity/platform-roles";
import { pickPrimaryRole } from "@/lib/platform/identity/role-priority";
import type { EduRoleName } from "@/types/database";
import type { RoleCheck } from "./types";

/** Landing / role-home path constants (must match workspace resolver + homes). */
export const ROLE_HOME_PATHS = {
  FOUNDER: "/dashboard",
  EXECUTIVE_DIRECTOR: "/dashboard/executive",
  SCHOOL_LEADER: "/dashboard",
  TEACHER: "/dashboard/teacher",
  PARENT: "/portal",
  STUDENT: "/portal/student",
  ADMINISTRATOR: "/dashboard",
  EMPLOYEE: "/dashboard/employee",
  FOUNDER_PLATFORM: "/founder",
  EXEC: "/exec",
  JAG: "/jag",
  WORKSPACE: "/workspace",
} as const;

const REQUIRED_PLATFORM_ROLES = [
  "FOUNDER",
  "EXECUTIVE_DIRECTOR",
  "SCHOOL_LEADER",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "ADMINISTRATOR",
] as const;

const MIDDLEWARE_PREFIXES = [
  "/dashboard",
  "/portal",
  "/founder",
  "/exec",
  "/jag",
] as const;

function rolePresent(role: string): boolean {
  return (OFFICIAL_PLATFORM_ROLES as readonly string[]).includes(role);
}

function employeePresent(): boolean {
  // EMPLOYEE is not always in OFFICIAL_PLATFORM_ROLES; accept priority catalog.
  if (rolePresent("EMPLOYEE")) return true;
  const picked = pickPrimaryRole(["EMPLOYEE" as EduRoleName]);
  return picked === "EMPLOYEE";
}

/**
 * Verify platform roles, landing path constants, and middleware protected prefixes.
 */
export function runRoleValidation(): readonly RoleCheck[] {
  const checks: RoleCheck[] = [];

  for (const role of REQUIRED_PLATFORM_ROLES) {
    const ok = rolePresent(role);
    checks.push({
      id: `role.platform.${role}`,
      label: `Platform role ${role}`,
      ok,
      detail: ok
        ? `${role} is in OFFICIAL_PLATFORM_ROLES.`
        : `${role} missing from OFFICIAL_PLATFORM_ROLES.`,
    });
  }

  const employeeOk = employeePresent();
  checks.push({
    id: "role.platform.EMPLOYEE",
    label: "EMPLOYEE role (if present)",
    ok: employeeOk,
    detail: employeeOk
      ? "EMPLOYEE is recognized in platform role priority / catalog."
      : "EMPLOYEE not found in official roles or role priority.",
  });

  const landingModule = "src/applications/academyos/workspace/landing.ts";
  const landingPath = join(process.cwd(), landingModule);
  const landingOk = existsSync(landingPath);
  checks.push({
    id: "role.landing-resolver",
    label: "Landing resolver module",
    ok: landingOk,
    detail: landingOk
      ? `resolveAcademyWorkspaceLanding module present (${landingModule}).`
      : `Missing landing resolver: ${landingModule}`,
  });

  if (landingOk) {
    const src = readFileSync(landingPath, "utf8");
    for (const [role, home] of Object.entries(ROLE_HOME_PATHS)) {
      if (
        role === "FOUNDER_PLATFORM" ||
        role === "EXEC" ||
        role === "JAG" ||
        role === "WORKSPACE"
      ) {
        continue;
      }
      const ok = src.includes(`"${home}"`) || src.includes(`'${home}'`);
      checks.push({
        id: `role.home.${role}`,
        label: `Role home path ${role} → ${home}`,
        ok,
        detail: ok
          ? `Landing resolver references ${home}.`
          : `Landing resolver does not reference expected home ${home} for ${role}.`,
      });
    }
  }

  for (const [key, path] of Object.entries(ROLE_HOME_PATHS)) {
    checks.push({
      id: `role.home-constant.${key}`,
      label: `Role home constant ${key}`,
      ok: typeof path === "string" && path.startsWith("/"),
      detail: `${key}=${path}`,
    });
  }

  const middlewarePath = join(process.cwd(), "middleware.ts");
  const middlewareOk = existsSync(middlewarePath);
  checks.push({
    id: "role.middleware.exists",
    label: "middleware.ts present",
    ok: middlewareOk,
    detail: middlewareOk
      ? "middleware.ts present at repo root."
      : "middleware.ts missing at repo root.",
  });

  if (middlewareOk) {
    const mw = readFileSync(middlewarePath, "utf8");
    for (const prefix of MIDDLEWARE_PREFIXES) {
      const ok = mw.includes(`"${prefix}"`) || mw.includes(`'${prefix}'`);
      checks.push({
        id: `role.middleware.prefix.${prefix.replace(/\//g, "_")}`,
        label: `Middleware protects ${prefix}`,
        ok,
        detail: ok
          ? `middleware.ts references ${prefix}.`
          : `middleware.ts does not reference protected prefix ${prefix}.`,
      });
    }
  }

  return checks;
}
