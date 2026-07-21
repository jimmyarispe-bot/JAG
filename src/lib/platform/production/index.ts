/**
 * RC-10 — Production GA
 *
 * No new product features.
 * Performance · Load testing · Pen testing · Security review
 * Disaster Recovery · Backup validation · Monitoring · Logging · Observability
 * Accessibility · Documentation · CI/CD · End-to-end tests
 * Deployment verification · Release documentation · GA sign-off
 */

export {
  PRODUCTION_GA_VERSION,
  GA_PRODUCT_RC_PACKAGES,
  GA_READINESS_DOMAINS,
  type GaProductRcPackage,
  type GaReadinessDomain,
  type GaGateResult,
  type GaPackageMatrixRow,
  type GaCharacteristicsCheck,
  type GaSignOffRecord,
  type ProductionReadinessReport,
} from "./types";

export {
  evaluatePackageMatrix,
  smokeImportPackages,
} from "./matrix";

export { evaluateReadinessGates } from "./gates";
export { evaluateGaCharacteristics } from "./characteristics";
export {
  buildGaSignOff,
  type BuildGaSignOffOptions,
} from "./sign-off";
export {
  listProductionHealthProbes,
  type HealthProbe,
} from "./adapters/health";
