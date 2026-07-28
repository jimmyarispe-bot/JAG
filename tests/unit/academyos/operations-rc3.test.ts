/**
 * AcademyOS RC-3 — Deployment, Operations & Production Readiness
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetDigitalTwinStoreForTests } from "@/lib/digital-twin";
import { resetJagPlatformEventsForTests } from "@/lib/jag-platform/events";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";
import {
  buildOperationsDashboard,
  collectMonitoringMetrics,
  resetAcademyOsStoreForTests,
  resetEducationConnectorStateForTests,
  runDiagnostics,
  validateBackupRecovery,
  validateConfiguration,
  validateDeployment,
  validateUpgrade,
} from "@academyos";
import {
  evaluateAcademyOsRc3WithStudio,
  evaluateReleaseGates,
  resetStudioStoreForTests,
} from "@studio";

const root = join(__dirname, "../../..");

afterEach(() => {
  resetAcademyOsStoreForTests();
  resetEducationConnectorStateForTests();
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
  resetDigitalTwinStoreForTests();
  resetJagPlatformEventsForTests();
});

describe("RC-3 operations", () => {
  it(
    "validates ops surfaces and Studio Ready-for-RC-4 evaluation",
    () => {
      const env = {
        ...process.env,
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv;
      const opts = { root, env, environment: "development" as const };

      expect(validateDeployment(opts).passed).toBe(true);
      expect(validateConfiguration(opts).passed).toBe(true);
      expect(validateUpgrade({ root }).passed).toBe(true);
      expect(validateBackupRecovery({ root }).passed).toBe(true);
      expect(collectMonitoringMetrics({ root }).metrics.length).toBeGreaterThanOrEqual(
        7
      );
      expect(runDiagnostics(opts).passed).toBe(true);

      const dashboard = buildOperationsDashboard({
        ...opts,
        organizationId: "org.rc3.ops",
        seedDemo: true,
      });
      expect(dashboard.deployment.passed).toBe(true);
      expect(dashboard.health.status).not.toBe("Critical");
      expect(dashboard.demo?.counts.campuses).toBeGreaterThanOrEqual(2);
      expect(dashboard.outstandingBlockers.length).toBe(0);

      const studio = evaluateAcademyOsRc3WithStudio({
        ...opts,
        organizationId: "org.rc3.ops.studio",
        seedDemo: false,
      });
      expect(studio.gatesPassed).toBe(true);
      expect(studio.readyForRc4).toBe(true);
      expect(studio.productStatus).toBe("RC-3");

      const gates = evaluateReleaseGates({
        productId: "academyos",
        targetStage: "RC-3",
        root,
      });
      expect(gates.passed).toBe(true);
    },
    240_000
  );
});

describe("RC-3 docs", () => {
  it("ships operations documentation set", () => {
    for (const doc of [
      "01_DEPLOYMENT.md",
      "02_CONFIGURATION.md",
      "03_HEALTH.md",
      "04_MONITORING.md",
      "05_BACKUP_RECOVERY.md",
      "06_UPGRADES.md",
      "07_DIAGNOSTICS.md",
      "08_RUNBOOK.md",
      "09_DEMO_ORGANIZATION.md",
    ]) {
      expect(existsSync(join(root, "docs/academyos/rc3", doc))).toBe(true);
    }
  });
});
