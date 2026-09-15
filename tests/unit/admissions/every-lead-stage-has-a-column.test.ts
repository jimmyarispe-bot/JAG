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
