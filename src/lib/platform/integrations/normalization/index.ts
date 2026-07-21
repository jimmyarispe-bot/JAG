export {
  IntegrationNormalizationPipeline,
  createNormalizationPipeline,
  type NormalizationPipelineOptions,
} from "./pipeline";
export {
  DefaultFieldMapper,
  createFieldMapper,
  applyFieldMap,
  type FieldMap,
  type MapperOptions,
} from "./mapper";
export {
  CanonicalRecordValidator,
  createRecordValidator,
} from "./validator";
export {
  IdentityDeduplicator,
  createDeduplicator,
} from "./deduplicator";
export {
  CanonicalIdentityResolver,
  createIdentityResolver,
} from "./identity";
