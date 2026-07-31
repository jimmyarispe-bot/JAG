import {
  bindJagStarter,
  recordJagStartup,
} from "@/jag/runtime/boot";
import { getJagPackageHost } from "@/jag/runtime/package-host";
import { loadApplicationPackages } from "@/jag/runtime/package-loader";
import type { JagStartupOptions, JagStartupResult } from "@/jag/runtime/types";

function aggregateHealth(result: JagStartupResult): JagStartupResult["health"] {
  const issues = result.packages.flatMap((p) => p.health?.issues ?? []);
  const checks = result.packages.flatMap((p) => [
    ...(p.health?.checks ?? []),
  ]);
  const ok = result.packages.every((p) => p.health?.ok !== false);
  return {
    ok,
    applicationId: "jag",
    checks,
    issues,
  };
}

/**
 * Primary JAG OS startup entry point.
 *
 * Next.js → bind package host → startJAG() → PackageLoader → health → ready
 *
 * Packages are never special-cased here. The bound JagPackageHost supplies manifests.
 */
export function startJAG(options?: JagStartupOptions): JagStartupResult {
  const packages = loadApplicationPackages(options?.packages, options);
  const primary = packages[0] ?? null;

  const result: JagStartupResult = {
    packages,
    container: primary?.container ?? null,
    health: primary?.health ?? {
      ok: false,
      applicationId: "jag",
      checks: [],
      issues: [
        {
          code: "no_packages",
          message: "No application packages were loaded",
        },
      ],
    },
    ok: false,
  };

  result.health = aggregateHealth(result);
  result.ok = result.health.ok && result.container?.ready === true;

  recordJagStartup(result);

  getJagPackageHost()?.onStartupComplete?.(result);

  return result;
}

// Bind ensureJAGBooted starter.
bindJagStarter(() => startJAG());
