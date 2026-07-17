/**
 * Executive Command Center operating mode + tenant scope (C-A2).
 *
 * Demo (`exec-demo-org`) is never silent in production: it requires
 * EXEC_OPERATING_MODE=demo and/or ALLOW_EXEC_DEMO_MODE=true.
 */

import { cache } from "react";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolveAppEnvironment } from "@/lib/platform/env/validate";
import { resolveExecutiveContextForIdentity } from "@/lib/platform/organization-platform";
import type { ExecutiveTenantContext } from "@/lib/platform/organization-platform/types";

/** Synthetic demo tenant id used only in explicit demo mode. */
export const DEMO_EXEC_ORGANIZATION_ID = "exec-demo-org";

export type ExecOperatingMode = "demo" | "tenant";

export type ExecScope = {
  organizationId: string;
  schoolId: string | null;
};

export const DEMO_EXEC_SCOPE: ExecScope = {
  organizationId: DEMO_EXEC_ORGANIZATION_ID,
  schoolId: null,
};

export type ExecRuntime = {
  mode: ExecOperatingMode;
  scope: ExecScope;
  organizationName: string | null;
  locationName: string | null;
  /** Short label for shell / banners. */
  provenanceLabel: string;
  /** Longer explanation for operators. */
  provenanceDetail: string;
};

export function isExecDemoAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if ((env.ALLOW_EXEC_DEMO_MODE ?? "").trim().toLowerCase() === "true") return true;
  return resolveAppEnvironment(env) !== "production";
}

function forcedMode(env: NodeJS.ProcessEnv): ExecOperatingMode | null {
  const raw = (env.EXEC_OPERATING_MODE ?? "").trim().toLowerCase();
  if (raw === "demo" || raw === "tenant") return raw;
  return null;
}

/**
 * Pure resolver — used by request cache and unit tests.
 */
export function resolveExecRuntime(input: {
  tenant: ExecutiveTenantContext | null;
  env?: NodeJS.ProcessEnv;
}): ExecRuntime {
  const env = input.env ?? process.env;
  const forced = forcedMode(env);
  const demoAllowed = isExecDemoAllowed(env);

  const useDemo =
    forced === "demo" || (forced === null && !input.tenant);

  if (useDemo) {
    if (!demoAllowed) {
      throw new Error(
        "Exec demo mode is blocked in production. Bind an authenticated tenant or set ALLOW_EXEC_DEMO_MODE=true with EXEC_OPERATING_MODE=demo."
      );
    }
    return {
      mode: "demo",
      scope: { ...DEMO_EXEC_SCOPE },
      organizationName: "Demo organization",
      locationName: null,
      provenanceLabel: "Demo mode",
      provenanceDetail:
        "Synthetic demo tenant (exec-demo-org). Outputs are not live tenant intelligence — see widget data-mode badges. Governed by Production Intelligence Contract (Phase A.1).",
    };
  }

  if (!input.tenant) {
    throw new Error(
      "Exec tenant mode requires an authenticated organization context. Set EXEC_OPERATING_MODE=demo only when demo is explicitly allowed."
    );
  }

  return {
    mode: "tenant",
    scope: {
      organizationId: input.tenant.organizationId,
      schoolId: input.tenant.locationId,
    },
    organizationName: input.tenant.organizationName,
    locationName: input.tenant.locationName,
    provenanceLabel: "Tenant mode",
    provenanceDetail: `Scoped to ${input.tenant.organizationName}. Widget data-mode badges show live vs baseline vs synthetic provenance. Governed by Production Intelligence Contract (Phase A.1).`,
  };
}

/**
 * Request-scoped exec runtime (mode + scope) for all `/exec` loaders and shell.
 * Outside a Next.js request (probes/scripts), falls back to explicit demo when allowed.
 */
export const getExecRuntime = cache(async (): Promise<ExecRuntime> => {
  try {
    const identity = await getIdentityContext();
    if (!identity) {
      return resolveExecRuntime({ tenant: null });
    }
    const tenant = resolveExecutiveContextForIdentity(identity);
    return resolveExecRuntime({ tenant });
  } catch (error) {
    if (!isExecDemoAllowed()) throw error;
    return resolveExecRuntime({
      tenant: null,
      env: { ...process.env, EXEC_OPERATING_MODE: "demo" },
    });
  }
});
