/**
 * RC-1 validation runner — orchestrates scenarios across existing modules.
 */

import { resetDigitalTwinStoreForTests } from "@/lib/digital-twin";
import { resetJagPlatformEventsForTests } from "@/lib/jag-platform/events";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";
import { installAcademyOsIndustryPack } from "../install";
import { resetAcademyOsStoreForTests } from "../store";
import { resetEducationConnectorStateForTests } from "../connectors/catalog";
import { executeScenario } from "./harness";
import { buildReleaseReadinessDashboard } from "./readiness";
import { ALL_VALIDATION_SCENARIOS } from "./scenarios";
import { appendValidationRun, listValidationRuns } from "./store";
import type {
  ReleaseReadinessDashboard,
  ValidationRunOptions,
  ValidationScenarioId,
  ValidationScenarioResult,
} from "./types";

function defaultOrgs(options?: ValidationRunOptions): string[] {
  if (options?.organizationIds?.length) return [...options.organizationIds];
  if (options?.organizationId) {
    return [options.organizationId, `${options.organizationId}.b`];
  }
  return ["org.rc1.a", "org.rc1.b"];
}

export async function runAcademyOsValidation(
  options: ValidationRunOptions = {}
): Promise<ReleaseReadinessDashboard> {
  const organizationIds = defaultOrgs(options);
  const primaryOrg = organizationIds[0]!;
  const selected = new Set<ValidationScenarioId>(
    options.scenarioIds ?? ALL_VALIDATION_SCENARIOS.map((s) => s.id)
  );

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
  // Ensure secondary orgs are registered in SDK extension lifecycle
  for (const org of organizationIds.slice(1)) {
    installAcademyOsIndustryPack({ organizationId: org, freshSdk: false });
  }

  const results: ValidationScenarioResult[] = [];
  for (const def of ALL_VALIDATION_SCENARIOS) {
    if (!selected.has(def.id)) continue;
    const result = await executeScenario(def, primaryOrg, organizationIds);
    results.push(result);
    appendValidationRun(result);
  }

  return buildReleaseReadinessDashboard({
    results,
    organizationId: primaryOrg,
  });
}

export function getLastValidationDashboard(): ReleaseReadinessDashboard | null {
  const runs = listValidationRuns();
  if (runs.length === 0) return null;
  // Group by latest ranAt batch — use all stored runs from last append sequence
  return buildReleaseReadinessDashboard({ results: runs });
}

export function listScenarioCatalog() {
  return Object.freeze(
    ALL_VALIDATION_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      domains: s.domains,
    }))
  );
}
