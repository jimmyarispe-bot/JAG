export {
  DEFAULT_QUALITY_WEIGHTS,
  getQualityWeights,
  resetQualityWeightsForTests,
  setQualityWeights,
  type QualityWeightKey,
  type QualityWeights,
} from "./config";
export {
  computeProductQualityScore,
  createQualityService,
  type ProductQualityScore,
  type QualityComponent,
} from "./scorer";
