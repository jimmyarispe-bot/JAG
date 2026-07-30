/**
 * Security surface probes — Sprint 210.
 * Middleware JAG protection + guard module export resolution.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SecurityCheck } from "./types";

function fileOk(relativePath: string): boolean {
  return existsSync(join(process.cwd(), relativePath));
}

async function moduleExports(
  specifier: string,
  exportNames: readonly string[]
): Promise<{ ok: boolean; detail: string }> {
  try {
    const mod = (await import(specifier)) as Record<string, unknown>;
    const missing = exportNames.filter((name) => typeof mod[name] !== "function");
    if (missing.length > 0) {
      return {
        ok: false,
        detail: `Missing export(s) from ${specifier}: ${missing.join(", ")}`,
      };
    }
    return {
      ok: true,
      detail: `${specifier} exports ${exportNames.join(", ")}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `Failed to import ${specifier}: ${message}` };
  }
}

/**
 * Probe middleware JAG protection, page/api/action guards, requireJagApiAdmin, health routes.
 */
export async function runSecurityValidation(): Promise<readonly SecurityCheck[]> {
  const checks: SecurityCheck[] = [];

  const middlewarePath = join(process.cwd(), "middleware.ts");
  const mwExists = existsSync(middlewarePath);
  if (!mwExists) {
    checks.push({
      id: "security.middleware",
      label: "middleware.ts JAG protection",
      ok: false,
      detail: "middleware.ts missing — cannot verify JAG protection.",
    });
  } else {
    const mw = readFileSync(middlewarePath, "utf8");
    const hasJagPortal =
      mw.includes("isJagPortalPath") || mw.includes('"/jag"');
    const hasJagSession =
      mw.includes("JAG_PLATFORM_SESSION_COOKIE") ||
      mw.includes("decodeJagPlatformSession") ||
      mw.includes("jag_platform_session");
    const hasExport =
      mw.includes("export async function middleware") ||
      mw.includes("export function middleware");
    const ok = hasJagPortal && hasJagSession && hasExport;
    checks.push({
      id: "security.middleware.jag",
      label: "middleware.ts exports/contains JAG protection",
      ok,
      detail: ok
        ? "middleware exports middleware() and contains JAG portal/session protection."
        : `JAG protection incomplete (export=${hasExport}, portal=${hasJagPortal}, session=${hasJagSession}).`,
    });
  }

  const apiGuard = await moduleExports("@/lib/platform/identity/api-guard", [
    "guardApiRoute",
  ]);
  checks.push({
    id: "security.api-guard",
    label: "api-guard module",
    ok: apiGuard.ok,
    detail: apiGuard.detail,
  });

  const pageGuard = await moduleExports("@/lib/platform/identity/page-guard", [
    "requirePagePermission",
  ]);
  checks.push({
    id: "security.page-guard",
    label: "page-guard module",
    ok: pageGuard.ok,
    detail: pageGuard.detail,
  });

  const actionGuards = await moduleExports(
    "@/lib/platform/identity/action-guards",
    ["assertPermission"]
  );
  checks.push({
    id: "security.action-guards",
    label: "action-guards module",
    ok: actionGuards.ok,
    detail: actionGuards.detail,
  });

  const jagApi = await moduleExports("@/lib/jag-platform/api", [
    "requireJagApiAdmin",
  ]);
  checks.push({
    id: "security.requireJagApiAdmin",
    label: "requireJagApiAdmin",
    ok: jagApi.ok,
    detail: jagApi.detail,
  });

  const healthRoutes: { id: string; label: string; path: string }[] = [
    {
      id: "security.health.liveness",
      label: "Health route /api/health",
      path: "src/app/api/health/route.ts",
    },
    {
      id: "security.health.ready",
      label: "Ready route /api/ready",
      path: "src/app/api/ready/route.ts",
    },
    {
      id: "security.health.jag-platform",
      label: "JAG platform health route",
      path: "src/app/api/jag-platform/health/route.ts",
    },
  ];

  for (const route of healthRoutes) {
    const ok = fileOk(route.path);
    checks.push({
      id: route.id,
      label: route.label,
      ok,
      detail: ok
        ? `Present: ${route.path}`
        : `Missing health route: ${route.path}`,
    });
  }

  return checks;
}
