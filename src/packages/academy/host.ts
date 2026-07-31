/**
 * Academy → JAG package host binding.
 *
 * Composition roots (instrumentation, tests, startAcademyOS) import this module
 * so JAG runtime can load Academy through PackageLoader without importing Academy.
 */

import { registerAcademyApis } from "@/applications/academyos/api";
import type { AcademyBootstrapResult } from "@/applications/academyos/bootstrap";
import { createAcademyContainer } from "@/applications/academyos/composition/container";
import {
  listAcademyServiceNames,
  resolveAcademyService,
} from "@/applications/academyos/composition/services";
import {
  assertAcademyStartupHealthy,
  validateAcademyStartup,
  type AcademyHealthReport,
} from "@/applications/academyos/composition/startup-health";
import type {
  AcademyCompositionOverrides,
  AcademyContainer,
} from "@/applications/academyos/composition/types";
import { registerAcademyDashboards } from "@/applications/academyos/dashboards";
import { registerAcademyIntelligence } from "@/applications/academyos/intelligence";
import { recordAcademyOSStartup } from "@/applications/academyos/runtime/boot";
import { registerAcademySeed } from "@/applications/academyos/seed";
import type { PackageRecord } from "@/jag/packages";
import { GraphService } from "@/lib/platform/graph";
import {
  bindJagPackageHost,
  bindJagServiceBridge,
} from "@/jag/runtime/package-host";
import type {
  JagLoadedPackage,
  JagStartupOptions,
  JagStartupResult,
} from "@/jag/runtime/types";
import { AcademyPackageManifest } from "@/packages/academy/manifest";
import { ACADEMY_PACKAGE_ID } from "@/packages/academy/package";
import { registerAcademyPhase1Contributions } from "@/packages/academy/registration";

/** Last Phase 1 + compat registration snapshot for health / shims. */
let lastRegistrationResult: AcademyBootstrapResult | null = null;

function composeOptions(
  options?: JagStartupOptions
): AcademyCompositionOverrides & {
  assertHealthy?: boolean;
  registerPlatform?: boolean;
} {
  return {
    ...(options?.packageOptions ?? {}),
    ...(options?.academy ?? {}),
  } as AcademyCompositionOverrides & {
    assertHealthy?: boolean;
    registerPlatform?: boolean;
  };
}

/**
 * Compat surfaces that are not PackageContributionKinds in Phase 1
 * (APIs / dashboards / intelligence / seed). Kept so health + shims still work.
 */
function registerAcademyCompatSurfaces(): {
  apiCount: number;
  dashboardCount: number;
  intelligencePackCount: number;
} {
  const apis = registerAcademyApis();
  const dashboards = registerAcademyDashboards();
  const intelligence = registerAcademyIntelligence();
  registerAcademySeed();
  GraphService.rebuild();
  return {
    apiCount: apis.length,
    dashboardCount: dashboards.length,
    intelligencePackCount: intelligence.length,
  };
}

function registerContributions(record: PackageRecord): void {
  if (record.manifest.metadata.id !== ACADEMY_PACKAGE_ID) return;

  const phase1 = registerAcademyPhase1Contributions();
  const compat = registerAcademyCompatSurfaces();

  lastRegistrationResult = {
    applicationId: phase1.applicationId,
    schemaCount: phase1.entityCount,
    entityCount: phase1.entityCount,
    formCount: phase1.formCount,
    workflowCount: phase1.workflowCount,
    apiCount: compat.apiCount,
    permissionRoleCount: phase1.permissionRoleCount,
    navigationItems: phase1.navigationItems,
    reportCount: phase1.reportCount,
    dashboardCount: compat.dashboardCount,
    intelligencePackCount: compat.intelligencePackCount,
    graphNodes: phase1.graphNodes,
  };
}

function compose(
  record: PackageRecord,
  options?: JagStartupOptions
): JagLoadedPackage {
  const opts = composeOptions(options);
  const registerPlatform = opts.registerPlatform !== false;

  const registration = registerPlatform ? lastRegistrationResult : null;

  const container = createAcademyContainer({
    mode: opts.mode ?? "production",
    ...opts,
  });

  const health = validateAcademyStartup({
    registration,
    container,
    requirePlatformRegistration: registerPlatform,
  });

  if ((options?.assertHealthy ?? opts.assertHealthy) !== false) {
    assertAcademyStartupHealthy(health);
  }

  return {
    packageId: record.manifest.metadata.id,
    applicationId: record.manifest.metadata.applicationId,
    registration,
    container,
    health,
  };
}

function onStartupComplete(result: JagStartupResult): void {
  const academy = result.packages.find(
    (p) => p.packageId === ACADEMY_PACKAGE_ID
  );
  if (academy?.container && academy.health) {
    recordAcademyOSStartup({
      registration: academy.registration as AcademyBootstrapResult | null,
      container: academy.container as AcademyContainer,
      health: academy.health as AcademyHealthReport,
    });
  }
}

/**
 * Bind Academy as the JAG package host + service bridge.
 * Idempotent — safe to call from instrumentation and tests.
 */
export function bindAcademyPackageHost(): void {
  bindJagPackageHost({
    listManifests: () => [AcademyPackageManifest],
    registerContributions,
    compose,
    onStartupComplete,
  });

  bindJagServiceBridge({
    resolve: (name) => resolveAcademyService(name as never),
    listNames: () => listAcademyServiceNames(),
  });
}

/** Ensure host is bound on import (composition root convenience). */
bindAcademyPackageHost();
