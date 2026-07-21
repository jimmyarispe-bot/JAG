/**
 * RC-5 — Executive Copilot 2.0
 *
 * Cross-domain reasoning · Organizational investigation · Root-cause analysis
 * Decision support · Executive narratives · Board preparation
 * Digital Twin reasoning · Timeline reasoning · Memory reasoning
 *
 * Soft-reads: knowledge-graph + domain executive feeds / collaboration ECC.
 * Does not call connector vendor APIs. Does not invert DAG into digital-twin/initiative modules.
 */

export {
  EXECUTIVE_COPILOT_V2_VERSION,
  COPILOT_V2_CAPABILITIES,
  COPILOT_V2_INTENTS,
  type CopilotV2Capability,
  type CopilotV2Intent,
  type CopilotV2Answer,
  type CopilotV2Evidence,
} from "./types";

export {
  assembleCopilotV2SoftContext,
  type CopilotV2SoftContext,
} from "./context/soft-reads";

export {
  detectCopilotV2Intent,
  shouldRouteToCopilotV2,
} from "./planners/intent";

export {
  answerExecutiveCopilotV2,
  type CopilotV2Request,
} from "./engine/copilot-v2";

export { surfaceOrganizationalRisks } from "./reasoning/risks";
