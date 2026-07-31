export {
  bootstrapAcademyOS,
  type AcademyBootstrapResult,
} from "@/applications/academyos/bootstrap";

export {
  AcademyOSManifest,
  createAcademyOSManifest,
  ACADEMYOS_APPLICATION_ID,
  ACADEMYOS_VERSION,
} from "@/applications/academyos/manifest";

export { ACADEMYOS_SCHEMAS, ACADEMYOS_ENTITY_TYPES } from "@/applications/academyos/schemas";
export { ACADEMYOS_FORMS } from "@/applications/academyos/forms";
export { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows";
export {
  ACADEMYOS_ENDPOINTS,
  ACADEMYOS_API_CATALOG,
  listAcademyApiCatalog,
} from "@/applications/academyos/api";
export {
  ACADEMYOS_PERMISSION_KEYS,
  ACADEMYOS_PERMISSION_ROLE_PACKS,
  listAcademyPermissionRoles,
  resetAcademyPermissionsForTests,
} from "@/applications/academyos/permissions";
export {
  ACADEMYOS_NAVIGATION,
  getAcademyNavigation,
  listAcademyNavigation,
  registerAcademyNavigation,
  resetAcademyNavigationForTests,
  resolveAcademyNavigation,
  getAcademyNavigationService,
} from "@/applications/academyos/navigation";
export {
  ACADEMYOS_DASHBOARDS,
  listAcademyDashboards,
  resetAcademyDashboardsForTests,
} from "@/applications/academyos/dashboards";
export {
  ACADEMYOS_REPORTS,
  listAcademyReports,
  resetAcademyReportsForTests,
} from "@/applications/academyos/reports";
export {
  ACADEMYOS_INTELLIGENCE_PACKS,
  listAcademyIntelligencePacks,
  resetAcademyIntelligenceForTests,
} from "@/applications/academyos/intelligence";
export {
  ACADEMYOS_SEED,
  getAcademySeed,
  resetAcademySeedForTests,
} from "@/applications/academyos/seed";

/** Phase 2 — Application Runtime (UI / APIs call this layer only). */
export * from "@/applications/academyos/application";
export * from "@/applications/academyos/domain";
export * from "@/applications/academyos/workflow-adapters";
export * from "@/applications/academyos/platform-adapters";

/** Phase 3 — Composition root (resolve services here; do not construct elsewhere). */
export * from "@/applications/academyos/composition";
export * from "@/applications/academyos/configuration";

/** Phase 4 — Infrastructure providers + repository implementations. */
export * from "@/applications/academyos/infrastructure";

/** Phase 5 — Live runtime boot, workspace landing, diagnostics. */
export * from "@/applications/academyos/runtime";
export * from "@/applications/academyos/workspace";

import { resetAcademyDashboardsForTests } from "@/applications/academyos/dashboards";
import { resetAcademyIntelligenceForTests } from "@/applications/academyos/intelligence";
import { resetAcademyNavigationForTests } from "@/applications/academyos/navigation";
import { resetAcademyPermissionsForTests } from "@/applications/academyos/permissions";
import { resetAcademyReportsForTests } from "@/applications/academyos/reports";
import { resetAcademySeedForTests } from "@/applications/academyos/seed";
import { setActiveAcademyContainer } from "@/applications/academyos/composition/services";
import { resetAcademyOSBootForTests } from "@/applications/academyos/runtime/boot";

export function resetAcademyOSAppRegistriesForTests(): void {
  resetAcademyPermissionsForTests();
  resetAcademyNavigationForTests();
  resetAcademyDashboardsForTests();
  resetAcademyReportsForTests();
  resetAcademyIntelligenceForTests();
  resetAcademySeedForTests();
  setActiveAcademyContainer(null);
  resetAcademyOSBootForTests();
}
