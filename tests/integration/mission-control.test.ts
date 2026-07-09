import { describe, expect, it } from "vitest";
import {
  composeMissionControlCommandCenter,
  buildActivityHref,
} from "@/lib/platform/automation/mission-control-compose";
import { LOOP_TRANSITION_REGISTRY } from "@/lib/platform/operational-loop/registry";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";

describe("Mission Control command center composition", () => {
  it("exports compose function for null context", async () => {
    const result = await composeMissionControlCommandCenter({} as never, null);
    expect(result.accessDenied).toBe(true);
    expect(result.priorities.critical).toEqual([]);
  });

  it("builds activity hrefs for known entity types", () => {
    expect(
      buildActivityHref({
        id: "1",
        entity_type: "students",
        entity_id: "s-1",
        student_id: "s-1",
      } as never)
    ).toBe("/dashboard/students/s-1");

    expect(
      buildActivityHref({
        id: "2",
        entity_type: "instructional_sessions",
        entity_id: "sess-1",
        student_id: null,
      } as never)
    ).toBe("/dashboard/teacher/sessions/sess-1");
  });

  it("registers operational loop stages for mission map", () => {
    expect(OPERATIONAL_LOOP_STAGES).toHaveLength(8);
    expect(Object.keys(LOOP_TRANSITION_REGISTRY)).toHaveLength(8);
  });
});
