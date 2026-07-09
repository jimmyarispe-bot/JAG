import type { EventDefinition } from "@/lib/platform/events/types";

export const INSTRUCTION_EVENT_DEFINITIONS: EventDefinition[] = [
  {
    eventType: "instruction.session.improvement_completed",
    name: "Session Improvement Completed",
    description:
      "Continuous Improvement Loop captured and analyzed outcomes after an instructional session",
    domain: "instruction",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["instructional_sessions"],
    sortOrder: 200,
    tags: ["instruction", "continuous_improvement", "jag"],
  },
];
