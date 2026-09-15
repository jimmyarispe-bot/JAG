import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEAD_STAGES } from "@/lib/constants/admissions";
import {
  ACTIVE_PIPELINE_LEGACY_STAGES,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";

/**
 * EVERY STAGE A PERSON CAN CHOOSE MUST PUT THE CARD SOMEWHERE.
 *
 * 15 September 2026. Heather Badger-Brown clicked "finished shadow day" for
 * Julian Oubre Towa - the correct action, the one that opens the accept-or-deny
 * decision - and he disappeared from the pipeline board.
 *
 * `shadow_day_completed` was a real lead stage in every part of JAG except the
 * one that draws the board. It is in LEAD_STAGES, so it was in the dropdown on
 * every card. shadow-days-actions.ts writes it. Gate 3 opens at it. It arrived
 * in migration 246 and the pipeline registry was never told, so
 * resolvePipelineStageFromLeadStage returned null, the card matched no column,
 * and it was not drawn. No error. No empty state. No "1 hidden".
 *
 * The general fault is not one missing stage. It is that a stage could be
 * OFFERED in the dropdown while having nowhere to land, and nothing anywhere
 * checked that those two lists agreed. This test is that check. Any stage added
 * to LEAD_STAGES from now on fails here until the registry knows about it.
 */
describe("every lead stage resolves to a pipeline column", () => {
  /** THE ONE THAT MATTERS. */
  it.each(LEAD_STAGES.map((s) => s.value))(
    "%s maps to a pipeline stage",
    (value) => {
      expect(
        resolvePipelineStageFromLeadStage(value),
        `${value} is offered in the dropdown but maps to no column - a card set to it vanishes`
      ).toBeTruthy();
    }
  );

  /** Proves the check can fail rather than saying yes to anything. */
  it("rejects a stage the registry has never heard of", () => {
    expect(resolvePipelineStageFromLeadStage("not_a_real_stage")).toBeFalsy();
  });

  it("puts shadow_day_completed in its own column, not under Scheduled", () => {
    expect(resolvePipelineStageFromLeadStage("shadow_day_completed")).toBe(
      "shadow_day_completed"
    );
    expect(resolvePipelineStageFromLeadStage("shadow_day_scheduled")).toBe(
      "shadow_day_scheduled"
    );
  });

  /**
   * The second half of the same bug, and the quieter one. Executive KPIs and
   * dashboard metrics both count from ACTIVE_PIPELINE_LEGACY_STAGES, so a stage
   * missing from the registry is missing from the network's own numbers - and
   * these are the families closest to enrolling.
   */
  it("counts a completed shadow day as active pipeline", () => {
    expect(ACTIVE_PIPELINE_LEGACY_STAGES).toContain("shadow_day_completed");
  });

  it("still counts the stages either side of it", () => {
    expect(ACTIVE_PIPELINE_LEGACY_STAGES).toContain("shadow_day_scheduled");
    expect(ACTIVE_PIPELINE_LEGACY_STAGES).toContain("application_started");
  });
});

/**
 * THE GUARANTEE, NOT THE SPOT CHECK.
 *
 * "How can we be sure Julian was the only one?"
 *
 * Checking LEAD_STAGES above proves the dropdown agrees with the board. It does
 * not prove the DATABASE agrees, and the database is the only thing that
 * decides what a row may actually contain. A value could exist in a lead row
 * that no TypeScript constant ever mentions - written by an import, a migration
 * or an RPC - and it would vanish from the board exactly as he did.
 *
 * So this reads the CHECK constraint straight out of the migrations directory
 * and asserts that EVERY value Postgres will accept resolves to a column.
 *
 * That closes it completely. The database physically refuses any stage outside
 * this list, and every stage in the list now has somewhere to land. There is no
 * third place a value could come from. A future migration that widens the
 * constraint without teaching the registry fails here, on the migration, before
 * a single family can reach the new stage.
 */
const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

/** Last write wins: migrations replay in filename order. */
function stagesThePostgresConstraintAllows(): string[] {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  let allowed: string[] | null = null;

  for (const file of files) {
    // Comments first. Prose inside them carries apostrophes and parentheses
    // that otherwise terminate the value list early.
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8").replace(/--[^\n]*/g, "");
    const re = /admissions_leads_lead_stage_check[\s\S]*?in\s*\(([^)]*)\)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) {
      allowed = m[1]
        .split(",")
        .map((v) => v.trim().replace(/'/g, ""))
        .filter(Boolean);
    }
  }

  if (!allowed || allowed.length === 0) {
    throw new Error("no admissions_leads_lead_stage_check found in migrations");
  }
  return allowed;
}

describe("every stage the DATABASE allows resolves to a column", () => {
  const allowed = stagesThePostgresConstraintAllows();

  /** If this ever reads as a handful, the parse broke and the test is lying. */
  it("found a real constraint to read", () => {
    expect(allowed.length).toBeGreaterThanOrEqual(19);
    expect(allowed).toContain("new_inquiry");
    expect(allowed).toContain("enrolled");
  });

  /** THE ONE THAT MATTERS. */
  it.each(stagesThePostgresConstraintAllows())(
    "a lead stored as %s appears on the board",
    (stage) => {
      expect(
        resolvePipelineStageFromLeadStage(stage),
        `Postgres accepts ${stage}, but it maps to no column - any child stored at it is invisible`
      ).toBeTruthy();
    }
  );

  /** The stage that started this. Belt and braces. */
  it("includes the stage that erased Julian", () => {
    expect(allowed).toContain("shadow_day_completed");
    expect(resolvePipelineStageFromLeadStage("shadow_day_completed")).toBeTruthy();
  });
});
