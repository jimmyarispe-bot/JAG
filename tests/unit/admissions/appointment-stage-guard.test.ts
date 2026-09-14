import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_STAGES,
  APPOINTMENT_STAGE_VALUES,
  stageRequiresAppointment,
} from "@/lib/admissions/appointment-stages";

/**
 * A stage that claims an appointment must not be enterable without one.
 *
 * On 14 September 2026, 28 families sat in tour_scheduled, interview_scheduled
 * or shadow_day_scheduled with no tour, no interview and no shadow day anywhere
 * in the database — 23 of them at The Academy Virtual. Nobody did anything
 * wrong: the pipeline board's dropdown called updateLeadStage, which moves the
 * stage and nothing else. No appointment row, no date, no email. The card moved
 * and the only thing that actually happened was that a word changed.
 *
 * scheduleTour had always done it correctly — insert the appointment, then move
 * the stage, then notify. That is the one-door pattern for the third time in one
 * day: a correct function reachable by one path while the traffic arrives by
 * another.
 *
 * These assertions read the source rather than the behaviour, because the fault
 * is structural: it is about which function the board is allowed to reach. They
 * cannot see production and they are not a substitute for clicking the board.
 * What they catch is somebody restoring the shortcut.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

/** Source with comments stripped, so a quoted example cannot satisfy a match. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const boards = [
  "src/components/admissions/KanbanBoard.tsx",
  "src/components/admissions/AdmissionsPipelineBoard.tsx",
] as const;

describe("the list of appointment stages", () => {
  it("is exactly the three stages migration 361 anchors on an appointment", () => {
    expect([...APPOINTMENT_STAGE_VALUES].sort()).toEqual([
      "interview_scheduled",
      "shadow_day_scheduled",
      "tour_scheduled",
    ]);
  });

  /**
   * assessment_scheduled is in LEAD_STAGES and looks like it belongs, but
   * nothing in the codebase writes an assessment appointment, so a guard on it
   * would block a stage with no way to satisfy the block.
   */
  it("does not guard a stage with no table behind it", () => {
    expect(stageRequiresAppointment("assessment_scheduled")).toBe(false);
    expect(stageRequiresAppointment("tour_completed")).toBe(false);
    expect(stageRequiresAppointment("new_inquiry")).toBe(false);
  });

  it("sends each stage to a table that exists, with a matching type column", () => {
    for (const [stage, spec] of Object.entries(APPOINTMENT_STAGES)) {
      expect(["admissions_tours", "admissions_interviews"], stage).toContain(spec.table);
      const expectedColumn =
        spec.table === "admissions_tours" ? "tour_type" : "interview_type";
      expect(spec.typeColumn, stage).toBe(expectedColumn);
      expect(spec.typeOptions.length, stage).toBeGreaterThan(0);
    }
  });
});

describe("neither board can enter an appointment stage on its own", () => {
  /** THE ONE THAT MATTERS. Both boards, because there are two over one pipeline. */
  it.each(boards)("%s checks the stage before changing it", (file) => {
    const src = code(read(file));
    expect(src).toContain("stageRequiresAppointment");
    // The guard must come first and return, not merely be consulted.
    expect(src).toMatch(/if \(stageRequiresAppointment\([\s\S]{0,120}return;/);
  });

  it.each(boards)("%s routes those stages through the booking action", (file) => {
    const src = code(read(file));
    expect(src).toContain("scheduleAppointmentAndAdvance");
  });

  it.each(boards)("%s surfaces a returned error instead of a green tick", (file) => {
    const src = code(read(file));
    // useActionFeedback treats ONLY a rejection as failure. A returned
    // { error } that is not thrown renders "✓ Updated" over a stage that never
    // moved — which is the same class of lie this whole change is about.
    const throwsOnError = src.match(/"error" in result && result\.error\) throw new Error/g);
    expect(throwsOnError, "every action result must be thrown on error").not.toBeNull();
    expect(throwsOnError!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("the booking action books before it moves", () => {
  const src = code(read("src/lib/admissions/actions.ts"));
  const action = src.slice(src.indexOf("export async function scheduleAppointmentAndAdvance"));
  const body = action.slice(0, action.indexOf("export async function scheduleTour"));

  it("refuses a stage that is not an appointment stage", () => {
    expect(body).toMatch(/if \(!stageRequiresAppointment\(leadStage\)\)[\s\S]{0,120}return \{ error/);
  });

  it("refuses a missing or unparseable date", () => {
    expect(body).toContain("Number.isNaN(when.getTime())");
  });

  /**
   * Order is the whole point. Migration 361's trigger fires on the stage change
   * and reads the appointment to date its reminder; a stage that moved first
   * would find nothing and create the loud "no appointment is on record" task.
   */
  it("inserts the appointment before it transitions the stage", () => {
    const insertAt = body.indexOf(".insert(");
    const transitionAt = body.indexOf("transitionCaseStage");
    expect(insertAt).toBeGreaterThan(-1);
    expect(transitionAt).toBeGreaterThan(-1);
    expect(insertAt).toBeLessThan(transitionAt);
  });

  it("checks the insert error rather than discarding it", () => {
    expect(body).toMatch(/if \(created\.error\)[\s\S]{0,120}return \{ error/);
  });

  /** Otherwise a refused transition leaves an appointment for a family who never moved. */
  it("removes the appointment if the stage does not move", () => {
    expect(body).toMatch(/if \(result\.error\)[\s\S]{0,400}\.delete\(\)/);
  });

  it("transitions to the stage that was asked for, not a derived one", () => {
    expect(body).toMatch(/transitionCaseStage\(supabase, leadId, leadStage,/);
  });

  /** Messages to families stay behind the gate; this action does not touch it. */
  it("never moves the automation gate", () => {
    expect(body).not.toContain("automation_started_at");
    expect(body).not.toContain("setAutomationStartedAt");
  });
});

describe("the older door keeps its own promises", () => {
  const src = code(read("src/lib/admissions/actions.ts"));

  /**
   * scheduleInterview awaited its insert and threw the result away, so an RLS
   * refusal moved the stage and returned success with no interview behind it —
   * indistinguishable from what the board was doing to 28 families.
   */
  it("scheduleInterview checks that the interview was actually written", () => {
    const start = src.indexOf("export async function scheduleInterview");
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, start + 2000);
    expect(body).toMatch(
      /const \{ error: interviewError \}[\s\S]{0,400}if \(interviewError\) return \{ error/
    );
  });
});
