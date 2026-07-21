/**
 * Copilot execution planner — routes action prep through Autonomous (Sprint 067).
 * Never bypasses humanAuthorizationRequired.
 */

import { executionPlanRefs } from "@/lib/platform/intelligence/executive-copilot/skills/recommend";
import type { AutonomousResultLight } from "@/lib/platform/intelligence/executive-copilot/types";

export function planExecutionHandoff(autonomous?: AutonomousResultLight): {
  refs: ReturnType<typeof executionPlanRefs>;
  governanceNote: string;
} {
  const refs = executionPlanRefs(autonomous);
  return {
    refs,
    governanceNote:
      refs.length > 0
        ? "Execution prep is available via Executive Autonomous. Human authorization is required — the Copilot will not auto-execute."
        : "No Autonomous execution plans attached. Generate plans through Executive Autonomous before authorizing action.",
  };
}
