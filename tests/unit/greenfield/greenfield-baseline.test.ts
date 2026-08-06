import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE_SQL = join(ROOT, "supabase", "baseline", "GA_BASELINE_212.sql");
const MANIFEST = join(ROOT, "supabase", "baseline", "manifest.json");
const REQUIRED_158 =
  "540b99a23210795f6b6eba9bfd472f39a7997746";
const PROHIBITED_UUID = "d346c418-26d0-47b0-8655-ce64173dffb1";
const PROHIBITED_EMAIL = "jimmy.arispe@theacademyway.org";
const PRODUCTION = "ybcpaffklggaloxhnqkl";

function gitHashObject(path: string) {
  return execFileSync("git", ["hash-object", path], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

describe("greenfield baseline governance", () => {
  it("keeps historical migration 158 hash unchanged", () => {
    const path = join(
      MIGRATIONS,
      "158_sprint002_authenticated_founder_repair.sql"
    );
    expect(existsSync(path)).toBe(true);
    expect(gitHashObject(path)).toBe(REQUIRED_158);
  });

  it("excludes 158 from greenfield builder output", () => {
    expect(existsSync(MANIFEST)).toBe(true);
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    const included = (manifest.included_migrations || []).map(
      (m: { filename: string }) => m.filename
    );
    const excluded = (manifest.excluded_historical_repairs || []).map(
      (m: { filename: string }) => m.filename
    );
    expect(included.some((f: string) => f.startsWith("158_"))).toBe(false);
    expect(excluded.some((f: string) => f.startsWith("158_"))).toBe(true);
    expect(manifest.cutoff).toBe(212);
    expect(manifest.baseline_id).toBe("GA_BASELINE_212");
  });

  it("baseline executable SQL has no historical founder UUID/email", () => {
    expect(existsSync(BASELINE_SQL)).toBe(true);
    const sql = readFileSync(BASELINE_SQL, "utf8");
    const executable = sql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    expect(executable.includes(PROHIBITED_UUID)).toBe(false);
    expect(executable.toLowerCase().includes(PROHIBITED_EMAIL)).toBe(false);
    expect(sha256(sql)).toBe(
      JSON.parse(readFileSync(MANIFEST, "utf8")).generated_artifact_hash
    );
  });

  it("baseline provenance cutoff is 212", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    expect(manifest.cutoff).toBe(212);
    expect(manifest.historical_repair_158_blob).toBe(REQUIRED_158);
    const sql = readFileSync(BASELINE_SQL, "utf8");
    expect(sql.includes("platform_schema_baselines")).toBe(true);
    expect(sql.includes("platform_forward_migrations")).toBe(true);
  });
});

describe("greenfield composition transforms", () => {
  it("applies 175 founder email transform exactly once and fail-closed", async () => {
    const {
      composeSourceSql,
      TRANSFORM_175_FOUNDER_ARRAY,
      countOccurrences,
      normalizeNewlines,
    } = await import("../../../scripts/greenfield/transforms.mjs");
    const raw = normalizeNewlines(
      readFileSync(join(MIGRATIONS, "175_complete_auth_user_provisioning.sql"), "utf8")
    );
    expect(countOccurrences(raw, TRANSFORM_175_FOUNDER_ARRAY.from)).toBe(1);
    const composed = composeSourceSql(
      "175_complete_auth_user_provisioning.sql",
      raw
    );
    expect(composed.transforms).toHaveLength(1);
    expect(composed.sql.includes(PROHIBITED_EMAIL)).toBe(false);
    expect(composed.sql.includes("jimmy@theacademyway.org")).toBe(true);
    expect(() =>
      composeSourceSql(
        "175_complete_auth_user_provisioning.sql",
        raw.replace(TRANSFORM_175_FOUNDER_ARRAY.from, "array[]::text[]")
      )
    ).toThrow(/expected 1 occurrence/);
  });

  it("resolves supabase CLI portably without hardcoded user paths", async () => {
    const libSrc = readFileSync(
      join(ROOT, "scripts/greenfield/lib.mjs"),
      "utf8"
    );
    expect(libSrc.includes("C:\\\\Users\\\\jimmy")).toBe(false);
    expect(libSrc.includes("resolveSupabaseInvocation")).toBe(true);
    const { resolveSupabaseInvocation } = await import(
      "../../../scripts/greenfield/lib.mjs"
    );
    const inv = resolveSupabaseInvocation();
    expect(["node-entry", "path-bin"]).toContain(inv.mode);
    if (inv.mode === "node-entry") {
      expect(inv.entry.replace(/\\/g, "/").includes("supabase/dist/supabase.js")).toBe(
        true
      );
    }
  });
});

describe("greenfield forward applicator selection", () => {
  it("selects only versions greater than baseline cutoff", async () => {
    const mod = await import("../../../scripts/greenfield/lib.mjs");
    const files = [
      "211_organization_branding.sql",
      "212_jag_org_scoped_authorization.sql",
      "213_example.sql",
      "220_later.sql",
    ];
    const pending = mod.selectForwardMigrations(212, files);
    expect(pending).toEqual(["213_example.sql", "220_later.sql"]);
  });

  it("rejects ambiguous/partial database state", async () => {
    const mod = await import("../../../scripts/greenfield/lib.mjs");
    const ambiguous = mod.resolveApplyMode({
      baselineRows: [{ baseline_id: "GA_BASELINE_212", cutoff_migration: 212 }],
      historicalMigrationVersions: [158, 200],
      productionRef: PRODUCTION,
      targetRef: "deggsksfzhzuoprkacbx",
    });
    expect(ambiguous.mode).toBe("REJECT");
    expect(ambiguous.reason).toBe("ambiguous_baseline_and_historical");

    const empty = mod.resolveApplyMode({
      baselineRows: [],
      historicalMigrationVersions: [],
      productionRef: PRODUCTION,
      targetRef: "deggsksfzhzuoprkacbx",
    });
    expect(empty.mode).toBe("REJECT");
    expect(empty.reason).toBe("empty_uninitialized");
  });

  it("production target protection fails closed for greenfield modes", async () => {
    const mod = await import("../../../scripts/greenfield/lib.mjs");
    const decision = mod.resolveApplyMode({
      baselineRows: [{ baseline_id: "GA_BASELINE_212", cutoff_migration: 212 }],
      historicalMigrationVersions: [],
      productionRef: PRODUCTION,
      targetRef: PRODUCTION,
    });
    expect(decision.mode).toBe("HISTORICAL_UPGRADE_ONLY");
    expect(() => mod.assertNotProduction(PRODUCTION)).toThrow(/PRODUCTION DENY/);
  });

  it("greenfield bootstrap contract forbids historical founder Auth identity", () => {
    const constants = readFileSync(
      join(ROOT, "scripts/greenfield/constants.mjs"),
      "utf8"
    );
    const bootstrap = readFileSync(
      join(ROOT, "scripts/greenfield/bootstrap-greenfield.mjs"),
      "utf8"
    );
    expect(constants.includes(PROHIBITED_EMAIL)).toBe(true);
    expect(constants.includes(PROHIBITED_UUID)).toBe(true);
    expect(bootstrap.includes("PROHIBITED_AUTH_EMAIL")).toBe(true);
    expect(bootstrap.includes("Historical founder Auth identity present")).toBe(
      true
    );
    expect(bootstrap.includes("schema_migrations")).toBe(true);
    expect(bootstrap.includes("HISTORICAL_LEDGER_FABRICATION")).toBe(true);
  });
});
