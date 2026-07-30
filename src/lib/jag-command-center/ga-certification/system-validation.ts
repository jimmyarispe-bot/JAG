/**
 * System / ops file presence probes — Sprint 210.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SystemCheck } from "./types";

const SYSTEM_PATHS: readonly {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}[] = [
  {
    id: "system.health",
    label: "Liveness health route",
    path: "src/app/api/health/route.ts",
  },
  {
    id: "system.ready",
    label: "Readiness route",
    path: "src/app/api/ready/route.ts",
  },
  {
    id: "system.env-schema",
    label: "Env schema",
    path: "src/lib/platform/env/schema.ts",
  },
  {
    id: "system.not-found",
    label: "Root not-found page",
    path: "src/app/not-found.tsx",
  },
  {
    id: "system.error",
    label: "Root error boundary",
    path: "src/app/error.tsx",
  },
  {
    id: "system.global-error",
    label: "Global error boundary",
    path: "src/app/global-error.tsx",
  },
  {
    id: "system.jag-error",
    label: "JAG error boundary",
    path: "src/app/jag/error.tsx",
  },
] as const;

/**
 * Check presence of health/ready, env schema, and error/404 pages via fs.existsSync.
 */
export function runSystemValidation(): readonly SystemCheck[] {
  return SYSTEM_PATHS.map((entry) => {
    const absolute = join(process.cwd(), entry.path);
    const ok = existsSync(absolute);
    return {
      id: entry.id,
      label: entry.label,
      ok,
      path: entry.path,
      detail: ok
        ? `Present: ${entry.path}`
        : `Missing system file: ${entry.path}`,
    };
  });
}
