/**
 * RC-3.06 — Education Connectors
 * Canvas · PowerSchool · Google Classroom → canonical Student / Teacher /
 * Course / Assignment / Grade / Attendance / Schedule + academic intelligence.
 */

export {
  EDUCATION_PROVIDERS,
  EDUCATION_OBJECT_TYPES,
  EDUCATION_KG_KINDS,
  type EducationProvider,
  type EducationObjectType,
  type EducationKgKind,
  type EducationCanonicalEntity,
  type EducationRawEntity,
} from "./entities";

export {
  educationCanonicalType,
  educationKgKind,
  buildEducationKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeEducationRecords,
  toSyncRecords as toEducationSyncRecords,
  domainAttributes,
} from "./normalization";

export {
  createDemoEducationClient,
  educationStore,
  createEducationPlatformConnector,
  reconnectEducationConnector,
  educationCatalogForProvider,
  objectTypesForEducationProvider,
} from "./services";

export {
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
  EDUCATION_B4_METADATA,
  createEducationProviderPlatformConnector,
  createCanvasPlatformConnector,
  createPowerschoolPlatformConnector,
  createGoogleClassroomPlatformConnector,
  createDemoEducationProviderClient,
} from "./providers";

export {
  computeEducationSignals,
  buildEducationEccWidgets,
  buildEducationExecutiveFeed,
  getEducationExecutiveFeed,
  type EducationEccWidgets,
  type EducationIntelligenceSignals,
  type EducationExecutiveFeed,
} from "./intelligence";

export { registerEducationPlatformConnectors } from "./registry";
export { createEducationB4Connector } from "./b4-connector";
