import type { AcademyBootstrapResult } from "@/applications/academyos/bootstrap";
import { createAcademyContainer } from "@/applications/academyos/composition/container";
import type { AcademyHealthReport } from "@/applications/academyos/composition/startup-health";
import type {
  AcademyCompositionOverrides,
  AcademyContainer,
} from "@/applications/academyos/composition/types";
import {
  bindAcademyOSStarter,
  recordAcademyOSStartup,
} from "@/applications/academyos/runtime/boot";
import { startJAG } from "@/jag/runtime/start";
// Bind Academy host so startJAG loads via PackageLoader (no JAG→Academy imports).
import "@/packages/academy/host";


export type AcademyStartupResult = {
  registration: AcademyBootstrapResult | null;
  container: AcademyContainer;
  health: AcademyHealthReport;
};

/**
 * @deprecated Prefer `startJAG()` from `@/jag`. Delegates to the JAG runtime.
 *
 * Deterministic Academy package startup via JAG package loader.
 */
export function startAcademyOS(
  overrides?: AcademyCompositionOverrides & {
    /** Default true — fail closed when health checks fail. */
    assertHealthy?: boolean;
  }
): AcademyStartupResult {
  const jag = startJAG({
    packages: ["academy"],
    assertHealthy: overrides?.assertHealthy,
    academy: overrides,
  });

  const academy = jag.packages.find((p) => p.packageId === "academy");
  if (!academy?.container || !academy.health) {
    throw new Error("Academy package failed to load through startJAG()");
  }

  const result: AcademyStartupResult = {
    registration: (academy.registration ?? null) as AcademyBootstrapResult | null,
    container: academy.container as unknown as AcademyContainer,
    health: academy.health as unknown as AcademyHealthReport,
  };

  recordAcademyOSStartup(result);
  return result;
}

/** Compose runtime services without implying platform registration. */
export function composeAcademyOS(
  overrides?: AcademyCompositionOverrides
): AcademyContainer {
  return createAcademyContainer(overrides);
}

// Bind process starter so ensureAcademyOSBooted() can run without require().
bindAcademyOSStarter(() => startAcademyOS());
