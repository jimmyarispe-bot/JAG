/**
 * JAG Runtime Generation Engine — public API.
 */

export type {
  GenerateRuntimeSpecificationInput,
  GenerateRuntimeSpecificationResult,
  GenerationDiagnostic,
  GenerationPlan,
  GenerationValidationResult,
  ResolvedRuntimeModel,
  RuntimeArtifactKind,
  RuntimeDiffChangeKind,
  RuntimeDiffEntry,
  RuntimeSpecificationDiff,
} from "@/jag/runtime-generation/contracts";

export { generateRuntimeSpecification } from "@/jag/runtime-generation/generate";
export { planRuntimeGeneration, selectCapabilityPacks } from "@/jag/runtime-generation/planner";
export { resolveRuntimeModel } from "@/jag/runtime-generation/resolver";
export { diffRuntimeSpecifications } from "@/jag/runtime-generation/diff";
export {
  validateGenerationInputs,
  validateResolvedModel,
} from "@/jag/runtime-generation/validation";
export {
  fullRuntimeSpecificationIds,
  runtimeSpecificationFingerprint,
} from "@/jag/runtime-generation/testing";
export { sortByKey, stableStringify } from "@/jag/runtime-generation/artifacts";
