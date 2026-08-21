/** RC-10 — Production GA readiness unit tests. */
import { describe, expect, it } from "vitest";
import {
  PRODUCTION_GA_VERSION,
  GA_PRODUCT_RC_PACKAGES,
  GA_READINESS_DOMAINS,
  evaluatePackageMatrix,
  smokeImportPackages,
  evaluateReadinessGates,
  evaluateGaCharacteristics,
  buildGaSignOff,
  listProductionHealthProbes,
} from "@/lib/platform/production";

/**
 * Both tests below dynamically import the six RC package graphs. That is cold
 * module resolution, not compute, and it routinely runs past vitest's 5s
 * default on a loaded machine - it timed out in one run and passed the next.
 * A flaky test is worse than a slow one: it trains you to re-run instead of
 * read. Give the import smoke room to finish and let a real hang fail it.
 */
const IMPORT_SMOKE_TIMEOUT_MS = 60_000;

describe("RC-10 — Production GA", () => {
  it("exports version and readiness catalogs", () => {
    expect(PRODUCTION_GA_VERSION).toBe("1.0.0");
    expect(GA_PRODUCT_RC_PACKAGES).toHaveLength(6);
    expect(GA_READINESS_DOMAINS).toHaveLength(16);
    expect(listProductionHealthProbes().length).toBeGreaterThanOrEqual(5);
  });

  it("verifies RC-4…RC-9 packages and tests are present", () => {
    const matrix = evaluatePackageMatrix();
    expect(matrix).toHaveLength(6);
    for (const row of matrix) {
      expect(row.present, row.id).toBe(true);
      expect(row.testPresent, row.id).toBe(true);
    }
  });

  it("smoke-imports RC-4…RC-9 public exports", async () => {
    const rows = await smokeImportPackages();
    for (const row of rows) {
      expect(row.importOk, `${row.id}: ${row.detail}`).toBe(true);
    }
  }, IMPORT_SMOKE_TIMEOUT_MS);

  it("evaluates readiness gates without inventing features", () => {
    const gates = evaluateReadinessGates();
    expect(gates.length).toBe(GA_READINESS_DOMAINS.length);
    const domains = new Set(gates.map((g) => g.domain));
    for (const d of GA_READINESS_DOMAINS) {
      expect(domains.has(d)).toBe(true);
    }
    // Blocking infrastructure gates should pass in-repo
    const blockingFails = gates.filter(
      (g) => g.blocking && g.status === "fail"
    );
    expect(blockingFails.map((g) => g.id)).toEqual([]);
  });

  it("satisfies final-target GA characteristics", () => {
    const chars = evaluateGaCharacteristics();
    expect(chars.every((c) => c.satisfied)).toBe(true);
  });

  it("produces GA sign-off go or conditional_go", async () => {
    const signOff = await buildGaSignOff({
      runImportSmoke: true,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    expect(signOff.governance.noNewFeatures).toBe(true);
    expect(signOff.governance.readinessOnly).toBe(true);
    expect(["go", "conditional_go"]).toContain(signOff.decision);
    expect(signOff.blockingFailures).toEqual([]);
    expect(signOff.packageMatrix.every((r) => r.importOk)).toBe(true);
    expect(signOff.characteristics.every((c) => c.satisfied)).toBe(true);
  }, IMPORT_SMOKE_TIMEOUT_MS);
});
