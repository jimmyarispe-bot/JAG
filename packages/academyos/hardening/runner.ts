/**
 * RC-2 hardening runner.
 */

import { resetDigitalTwinStoreForTests } from "@/lib/digital-twin";
import { resetJagPlatformEventsForTests } from "@/lib/jag-platform/events";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";
import { resetEducationConnectorStateForTests } from "../connectors/catalog";
import { installAcademyOsIndustryPack } from "../install";
import { resetAcademyOsStoreForTests } from "../store";
import { runAcademyOsValidation } from "../validation/runner";
import { executeHardeningSuite } from "./harness";
import { buildRc2HardeningSummary, mergeRc2Dashboard } from "./readiness";
import {
  appendHardeningSuite,
  getLastRc2Dashboard,
  resetHardeningStoreForTests,
  setLastRc2Dashboard,
} from "./store";
import { ALL_HARDENING_SUITES } from "./suites";
import type {
  HardeningRunOptions,
  HardeningSuiteId,
  Rc2ReleaseReadinessDashboard,
} from "./types";

function defaultOrgs(options?: HardeningRunOptions): string[] {
  if (options?.organizationIds?.length) return [...options.organizationIds];
  if (options?.organizationId) {
    return [options.organizationId, `${options.organizationId}.b`];
  }
  return ["org.rc2.a", "org.rc2.b"];
}

export async function runAcademyOsHardening(
  options: HardeningRunOptions = {}
): Promise<Rc2ReleaseReadinessDashboard> {
  const organizationIds = defaultOrgs(options);
  const primaryOrg = organizationIds[0]!;
  const selected = new Set<HardeningSuiteId>(
    options.suiteIds ?? ALL_HARDENING_SUITES.map((s) => s.id)
  );
  const repositoryRoot = options.repositoryRoot ?? process.cwd();

  resetHardeningStoreForTests();
  resetAcademyOsStoreForTests();
  resetEducationConnectorStateForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
  resetDigitalTwinStoreForTests();
  resetJagPlatformEventsForTests();

  installAcademyOsIndustryPack({
    organizationId: primaryOrg,
    freshSdk: options.freshSdk !== false,
  });
  for (const org of organizationIds.slice(1)) {
    installAcademyOsIndustryPack({ organizationId: org, freshSdk: false });
  }

  const includeRc1 = options.includeRc1 !== false;
  const rc1 = includeRc1
    ? await runAcademyOsValidation({
        organizationId: primaryOrg,
        organizationIds,
        freshSdk: false,
      })
    : {
        organizationId: primaryOrg,
        generatedAt: new Date().toISOString(),
        scenariosPassed: 0,
        scenariosFailed: 0,
        totalScenarios: 0,
        passRate: 100,
        coverageByDomain: Object.freeze([]),
        openBlockers: Object.freeze([]),
        criticalDefects: Object.freeze([]),
        performanceBaselines: Object.freeze([]),
        recommendation: "Ready for RC-2" as const,
        results: Object.freeze([]),
      };

  // Re-install after RC-1 runner resets stores
  if (includeRc1) {
    resetEducationConnectorStateForTests();
    installAcademyOsIndustryPack({
      organizationId: primaryOrg,
      freshSdk: false,
    });
    for (const org of organizationIds.slice(1)) {
      installAcademyOsIndustryPack({ organizationId: org, freshSdk: false });
    }
  }

  const suiteResults = [];
  for (const def of ALL_HARDENING_SUITES) {
    if (!selected.has(def.id)) continue;
    const result = await executeHardeningSuite(
      def,
      primaryOrg,
      organizationIds,
      repositoryRoot
    );
    suiteResults.push(result);
    appendHardeningSuite(result);
  }

  const hardening = buildRc2HardeningSummary(suiteResults);
  const dashboard = mergeRc2Dashboard({ rc1, hardening });
  setLastRc2Dashboard(dashboard);
  return dashboard;
}

export function getLastHardeningDashboard(): Rc2ReleaseReadinessDashboard | null {
  return getLastRc2Dashboard();
}

export function listHardeningCatalog() {
  return Object.freeze(
    ALL_HARDENING_SUITES.map((s) => ({ id: s.id, name: s.name }))
  );
}
