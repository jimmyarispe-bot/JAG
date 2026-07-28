/**
 * Studio JS-002 — Repository Intelligence
 */

import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  buildRepositoryIntelligence,
  resetStudioStoreForTests,
} from "@studio";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";

const root = join(__dirname, "../../..");

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("Repository Intelligence JS-002", () => {
  it(
    "indexes services, APIs, events, permissions, and dependencies",
    () => {
      const report = buildRepositoryIntelligence(root);

      expect(report.scan.rootsFound).toContain("packages");
      expect(report.coverage.packages).toBeGreaterThanOrEqual(2);
      expect(report.coverage.services).toBeGreaterThan(0);
      expect(report.coverage.apis).toBeGreaterThan(0);
      expect(report.apiRoutes.some((r) => r.path.includes("academyos"))).toBe(
        true
      );
      expect(
        report.symbols.some(
          (s) => s.kind === "service" && s.name.includes("Service")
        )
      ).toBe(true);
      expect(report.dependencyGraph.some((g) => g.packageId === "academyos")).toBe(
        true
      );
      expect(report.dependencyGraph.some((g) => g.packageId === "studio")).toBe(
        true
      );
      expect(report.recommendations.length).toBeGreaterThan(0);
    },
    30_000
  );
});
