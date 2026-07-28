/** JS-003 — Release intelligence (gates, artifacts) + manager re-export. */

export { createReleaseManager } from "../release/manager";
export {
  canAdvanceStage,
  createGateService,
  evaluateReleaseGates,
  stageRank,
  type GateCategory,
  type GateEvaluationReport,
  type GateResult,
} from "./gates";
export {
  createReleaseArtifactService,
  generateReleaseArtifacts,
  type ReleaseArtifactPackage,
} from "./artifacts";
