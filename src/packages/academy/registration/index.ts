/**
 * Academy package contribution registration.
 * Phase 1: entities/forms/workflows/nav/permissions/reports/terminology/localization
 * Phase 2: documents/communications/decisions/processes (Admissions)
 * Phase 2A: SIS (Student Information System) entity/report/permission contributions
 * Phase 2B: Scheduling & Timetable entity/report/permission contributions
 */

import { AcademyOSManifest } from "@/applications/academyos/manifest";
import { ACADEMYOS_FORMS } from "@/applications/academyos/forms";
import { ACADEMYOS_NAVIGATION } from "@/applications/academyos/navigation/definition";
import { ACADEMYOS_PERMISSION_ROLE_PACKS } from "@/applications/academyos/permissions";
import { ACADEMYOS_REPORTS } from "@/applications/academyos/reports";
import { ACADEMYOS_ENTITY_TYPES } from "@/applications/academyos/schemas/definitions";
import { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows";
import { GraphService } from "@/lib/platform/graph";
import { SdkService } from "@/lib/platform/sdk";
import { ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS } from "@/packages/academy/communications";
import { ACADEMY_DECISION_DEFINITION_IDS } from "@/packages/academy/decisions";
import { ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS } from "@/packages/academy/documents";
import { registerAcademyPackageCommunications } from "@/packages/academy/registration/communications/register";
import { registerAcademyPackageDecisions } from "@/packages/academy/registration/decisions/register";
import { registerAcademyPackageDocuments } from "@/packages/academy/registration/documents/register";
import { registerAcademyPackageEntities } from "@/packages/academy/registration/entities/register";
import { registerAcademyPackageForms } from "@/packages/academy/registration/forms/register";
import { listAcademyLocalizationPacks } from "@/packages/academy/registration/localization/register";
import { registerAcademyPackageLocalization } from "@/packages/academy/registration/localization/register";
import { registerAcademyPackageNavigation } from "@/packages/academy/registration/navigation/register";
import { registerAcademyPackagePermissions } from "@/packages/academy/registration/permissions/register";
import { registerAcademyPackageProcesses } from "@/packages/academy/registration/processes/register";
import { registerAcademyPackageReports } from "@/packages/academy/registration/reports/register";
import { listAcademyTerminologyPacks } from "@/packages/academy/registration/terminology/register";
import { registerAcademyPackageTerminology } from "@/packages/academy/registration/terminology/register";
import { registerAcademyPackageWorkflows } from "@/packages/academy/registration/workflows/register";
import { ACADEMY_SIS_REPORT_IDS } from "@/packages/academy/sis/reports";
import {
  ACADEMY_SIS_ENTITY_TYPES,
  registerAcademyPackageSis,
} from "@/packages/academy/registration/sis/register";
import {
  ACADEMY_SCHEDULING_ENTITY_TYPES,
  registerAcademyPackageScheduling,
} from "@/packages/academy/registration/scheduling/register";
import { ACADEMY_SCHEDULING_REPORT_IDS } from "@/packages/academy/scheduling/reports";

export type AcademyPhase1RegistrationResult = {
  readonly applicationId: string;
  readonly entityCount: number;
  readonly formCount: number;
  readonly workflowCount: number;
  readonly permissionRoleCount: number;
  readonly navigationItems: number;
  readonly reportCount: number;
  readonly terminologyPackCount: number;
  readonly localizationPackCount: number;
  readonly processCount: number;
  readonly documentCount: number;
  readonly communicationCount: number;
  readonly decisionCount: number;
  readonly sisEntityCount: number;
  readonly sisReportCount: number;
  readonly schedulingEntityCount: number;
  readonly schedulingReportCount: number;
  readonly graphNodes: number;
};

function enableSdk(): void {
  SdkService.register(AcademyOSManifest);
  if (SdkService.get(AcademyOSManifest.id)?.state === "installed") {
    SdkService.validateApp(AcademyOSManifest.id);
  }
  if (SdkService.get(AcademyOSManifest.id)?.state === "validated") {
    SdkService.enable(AcademyOSManifest.id);
  }
}

/**
 * Register Academy contributions into JAG frameworks.
 * Order: SDK → workflows → entities → forms → permissions → navigation →
 * reports → terminology → localization → documents → communications →
 * decisions → processes → SIS → Scheduling → graph rebuild.
 */
export function registerAcademyPhase1Contributions(): AcademyPhase1RegistrationResult {
  enableSdk();
  registerAcademyPackageWorkflows();
  registerAcademyPackageEntities();
  registerAcademyPackageForms();
  registerAcademyPackagePermissions();
  registerAcademyPackageNavigation();
  registerAcademyPackageReports();
  registerAcademyPackageTerminology();
  registerAcademyPackageLocalization();

  // Phase 2 — Admissions process + related engine contributions
  registerAcademyPackageDocuments();
  registerAcademyPackageCommunications();
  registerAcademyPackageDecisions();
  registerAcademyPackageProcesses();

  // Phase 2A — Student Information System (definitions only)
  const sis = registerAcademyPackageSis();

  // Phase 2B — Scheduling & Timetable (definitions only)
  const scheduling = registerAcademyPackageScheduling();

  const graph = GraphService.rebuild();

  const entityTypes = new Set([
    ...ACADEMYOS_ENTITY_TYPES,
    ...ACADEMY_SIS_ENTITY_TYPES,
    ...ACADEMY_SCHEDULING_ENTITY_TYPES,
  ]);

  return {
    applicationId: AcademyOSManifest.id,
    entityCount: entityTypes.size,
    formCount: ACADEMYOS_FORMS.length,
    workflowCount: ACADEMYOS_WORKFLOWS.length,
    permissionRoleCount: ACADEMYOS_PERMISSION_ROLE_PACKS.length,
    navigationItems: ACADEMYOS_NAVIGATION.items.length,
    reportCount:
      ACADEMYOS_REPORTS.length +
      ACADEMY_SIS_REPORT_IDS.length +
      ACADEMY_SCHEDULING_REPORT_IDS.length,
    terminologyPackCount: listAcademyTerminologyPacks().length,
    localizationPackCount: listAcademyLocalizationPacks().length,
    processCount: 1,
    documentCount: ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS.length,
    communicationCount: ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS.length,
    decisionCount: ACADEMY_DECISION_DEFINITION_IDS.length,
    sisEntityCount: sis.entityCount,
    sisReportCount: sis.reportCount,
    schedulingEntityCount: scheduling.entityCount,
    schedulingReportCount: scheduling.reportCount,
    graphNodes: graph.nodes,
  };
}

/** Alias for clarity — Phase 1 + Phase 2 registrations. */
export const registerAcademyPackageContributions =
  registerAcademyPhase1Contributions;

export { registerAcademyPackageEntities } from "@/packages/academy/registration/entities/register";
export { registerAcademyPackageForms } from "@/packages/academy/registration/forms/register";
export { registerAcademyPackageWorkflows } from "@/packages/academy/registration/workflows/register";
export { registerAcademyPackageNavigation } from "@/packages/academy/registration/navigation/register";
export { registerAcademyPackagePermissions } from "@/packages/academy/registration/permissions/register";
export { registerAcademyPackageReports } from "@/packages/academy/registration/reports/register";
export { registerAcademyPackageTerminology } from "@/packages/academy/registration/terminology/register";
export { registerAcademyPackageLocalization } from "@/packages/academy/registration/localization/register";
export { registerAcademyPackageDocuments } from "@/packages/academy/registration/documents/register";
export { registerAcademyPackageCommunications } from "@/packages/academy/registration/communications/register";
export { registerAcademyPackageDecisions } from "@/packages/academy/registration/decisions/register";
export { registerAcademyPackageProcesses } from "@/packages/academy/registration/processes/register";
export { registerAcademyPackageSis } from "@/packages/academy/registration/sis/register";
export { registerAcademyPackageScheduling } from "@/packages/academy/registration/scheduling/register";
