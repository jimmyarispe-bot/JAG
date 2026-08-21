import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";
import { LEAD_STATUS_MAP } from "@/lib/platform/imports/entities/lead/stage-mapping";

/**
 * Guards the seam that broke the Aug 2026 admissions migration.
 *
 * The application decides what `admissions_leads.lead_stage` may contain via the
 * pipeline registry. Postgres decides via a CHECK constraint written in a
 * migration. Nothing connected the two, so a registry rewrite shipped stage
 * values the database rejected — every affected row failed on INSERT while the
 * app layer reported them valid, and the mismatch only surfaced mid-import.
 *
 * This test reads the constraint out of the migrations directory and asserts the
 * application can never emit a value the database will refuse.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const CONSTRAINT = "admissions_leads_lead_stage_check";

/**
 * Last-write-wins: migrations replay in filename order, so the final ADD
 * CONSTRAINT for this name is the one in force.
 */
function allowedLeadStagesFromMigrations(): Set<string> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let allowed: Set<string> | null = null;

  for (const file of files) {
    // Strip `--` comments first: prose inside them contains parentheses and
    // apostrophes that otherwise terminate the value list early.
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8").replace(
      /--[^\n]*/g,
      ""
    );
    // `add constraint <name> ... check ( lead_stage in ( '<a>', '<b>', ... ) )`
    const pattern = new RegExp(
      `add\\s+constraint\\s+${CONSTRAINT}[\\s\\S]*?lead_stage\\s+in\\s*\\(([\\s\\S]*?)\\)`,
      "gi"
    );
    for (const match of sql.matchAll(pattern)) {
      const values = [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
      if (values.length) allowed = new Set(values);
    }
  }

  return allowed ?? new Set<string>();
}

describe("admissions lead_stage: application ↔ database contract", () => {
  const allowed = allowedLeadStagesFromMigrations();

  it("finds the constraint in the migrations directory", () => {
    // A rename or refactor that hides the constraint must fail loudly rather
    // than silently turning every assertion below into a no-op.
    expect(allowed.size).toBeGreaterThan(0);
  });

  it("accepts every stage the pipeline registry can write", () => {
    const emitted = ADMISSIONS_PIPELINE_STAGES.flatMap((s) => s.legacyLeadStages);
    const rejected = [...new Set(emitted)].filter((s) => !allowed.has(s)).sort();

    expect(
      rejected,
      `Pipeline stages the database would reject on INSERT: ${rejected.join(", ")}. ` +
        `Add them to the ${CONSTRAINT} constraint in a new migration.`
    ).toEqual([]);
  });

  it("accepts every stage the lead importer can write", () => {
    const emitted = Object.values(LEAD_STATUS_MAP).map((m) => m.leadStage);
    const rejected = [...new Set(emitted)].filter((s) => !allowed.has(s)).sort();

    expect(
      rejected,
      `Legacy statuses map to stages the database would reject: ${rejected.join(", ")}. ` +
        `These rows fail at commit time after passing validation.`
    ).toEqual([]);
  });

  it("maps every importer stage to a real pipeline stage", () => {
    // The reverse drift: a status map pointing at a stage the registry dropped
    // would import rows that no pipeline column can display.
    const known = new Set(ADMISSIONS_PIPELINE_STAGES.flatMap((s) => s.legacyLeadStages));
    const orphaned = [
      ...new Set(Object.values(LEAD_STATUS_MAP).map((m) => m.leadStage)),
    ]
      .filter((s) => !known.has(s))
      .sort();

    expect(
      orphaned,
      `Importer stages with no pipeline column: ${orphaned.join(", ")}`
    ).toEqual([]);
  });
});
