/**
 * System / ops file presence probes — Sprint 210.
 *
 * Each probe joins process.cwd() with literal path segments (no dynamic
 * relativePath) so Turbopack does not treat the call as a whole-project scan.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SystemCheck } from "./types";

function probe(
  id: string,
  label: string,
  relativePath: string,
  absolutePath: string
): SystemCheck {
  const ok = existsSync(/* turbopackIgnore: true */ absolutePath);
  return {
    id,
    label,
    ok,
    path: relativePath,
    detail: ok
      ? `Present: ${relativePath}`
      : `Missing system file: ${relativePath}`,
  };
}

/**
 * Check presence of health/ready, env schema, and error/404 pages via fs.existsSync.
 */
export function runSystemValidation(): readonly SystemCheck[] {
  return [
    probe(
      "system.health",
      "Liveness health route",
      "src/app/api/health/route.ts",
      join(process.cwd(), "src", "app", "api", "health", "route.ts")
    ),
    probe(
      "system.ready",
      "Readiness route",
      "src/app/api/ready/route.ts",
      join(process.cwd(), "src", "app", "api", "ready", "route.ts")
    ),
    probe(
      "system.env-schema",
      "Env schema",
      "src/lib/platform/env/schema.ts",
      join(process.cwd(), "src", "lib", "platform", "env", "schema.ts")
    ),
    probe(
      "system.not-found",
      "Root not-found page",
      "src/app/not-found.tsx",
      join(process.cwd(), "src", "app", "not-found.tsx")
    ),
    probe(
      "system.error",
      "Root error boundary",
      "src/app/error.tsx",
      join(process.cwd(), "src", "app", "error.tsx")
    ),
    probe(
      "system.global-error",
      "Global error boundary",
      "src/app/global-error.tsx",
      join(process.cwd(), "src", "app", "global-error.tsx")
    ),
    probe(
      "system.jag-error",
      "JAG error boundary",
      "src/app/jag/error.tsx",
      join(process.cwd(), "src", "app", "jag", "error.tsx")
    ),
  ];
}
