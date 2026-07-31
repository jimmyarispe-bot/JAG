/**
 * AcademyPackageManifest — declarative Package Runtime contract.
 * No runtime logic; registration entry point is documented in capabilities.
 */

import { ACADEMYOS_FORMS } from "@/applications/academyos/forms";
import { ACADEMYOS_NAVIGATION } from "@/applications/academyos/navigation/definition";
import { ACADEMYOS_PERMISSION_ROLE_PACKS } from "@/applications/academyos/permissions";
import { ACADEMYOS_REPORTS } from "@/applications/academyos/reports";
import { ACADEMYOS_ENTITY_TYPES } from "@/applications/academyos/schemas/definitions";
import { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows";
import type { PackageManifest } from "@/jag/packages";
import {
  ACADEMY_APPLICATION_ID,
  ACADEMY_LOCALIZATION_PACK_IDS,
  ACADEMY_PACKAGE_ID,
  ACADEMY_PACKAGE_VERSION,
  ACADEMY_TERMINOLOGY_PACK_IDS,
} from "@/packages/academy/package";
import { ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS } from "@/packages/academy/communications";
import { ACADEMY_DECISION_DEFINITION_IDS } from "@/packages/academy/decisions";
import { ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS } from "@/packages/academy/documents";
import { ACADEMY_ADMISSIONS_PROCESS_ID } from "@/packages/academy/processes/admissions";
import {
  ACADEMY_SIS_ENTITY_TYPES,
  ACADEMY_SIS_PERMISSION_PACK_ID,
  ACADEMY_SIS_REPORT_IDS,
} from "@/packages/academy/sis";
import {
  ACADEMY_SCHEDULING_ENTITY_TYPES,
  ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
  ACADEMY_SCHEDULING_REPORT_IDS,
} from "@/packages/academy/scheduling";

/** Registration entry module for package contributions. */
export const ACADEMY_REGISTRATION_ENTRY =
  "@/packages/academy/registration" as const;

export type AcademyPackageManifest = PackageManifest & {
  readonly metadata: PackageManifest["metadata"] & {
    readonly id: typeof ACADEMY_PACKAGE_ID;
    readonly applicationId: typeof ACADEMY_APPLICATION_ID;
  };
};

/**
 * Immutable Academy package manifest for the Universal Package Runtime.
 * Phase 1 + Phase 2 (Admissions) + Phase 2A (SIS) + Phase 2B (Scheduling).
 */
export const AcademyPackageManifest: AcademyPackageManifest = Object.freeze({
  metadata: Object.freeze({
    id: ACADEMY_PACKAGE_ID,
    applicationId: ACADEMY_APPLICATION_ID,
    displayName: "Academy",
    description:
      "Reference education application package for The JAG OS (configuration only).",
    version: ACADEMY_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze([
      "education",
      "reference-package",
      "sis",
      "scheduling",
    ]),
  }),
  compatibility: Object.freeze({
    jagMinVersion: "1.0.0",
  }),
  capabilities: Object.freeze([
    Object.freeze({
      id: "academy.registration.phase1",
      label: "Phase 1 declarative registrations",
      description: `Entry: ${ACADEMY_REGISTRATION_ENTRY}`,
    }),
    Object.freeze({
      id: "academy.registration.phase2.processes",
      label: "Phase 2 Admissions process",
      description: ACADEMY_ADMISSIONS_PROCESS_ID,
    }),
    Object.freeze({
      id: "academy.registration.phase2a.sis",
      label: "Phase 2A Student Information System",
      description: "Declarative SIS entities, permissions, and reports",
    }),
    Object.freeze({
      id: "academy.registration.phase2b.scheduling",
      label: "Phase 2B Scheduling & Timetable",
      description:
        "Declarative calendars, programs, classes, assignments, and schedules",
    }),
    Object.freeze({
      id: "academy.entities",
      label: "Entity types",
    }),
    Object.freeze({
      id: "academy.forms",
      label: "Forms",
    }),
    Object.freeze({
      id: "academy.workflows",
      label: "Workflows",
    }),
    Object.freeze({
      id: "academy.navigation",
      label: "Navigation",
    }),
    Object.freeze({
      id: "academy.permissions",
      label: "Permission role packs",
    }),
    Object.freeze({
      id: "academy.reports",
      label: "Reports",
    }),
    Object.freeze({
      id: "academy.terminology",
      label: "Terminology",
    }),
    Object.freeze({
      id: "academy.localization",
      label: "Localization",
    }),
    Object.freeze({
      id: "academy.processes",
      label: "Business processes",
    }),
    Object.freeze({
      id: "academy.documents",
      label: "Document definitions",
    }),
    Object.freeze({
      id: "academy.communications",
      label: "Communication templates",
    }),
    Object.freeze({
      id: "academy.decisions",
      label: "Decision placeholders",
    }),
  ]),
  dependencies: Object.freeze([]),
  contributions: Object.freeze([
    Object.freeze({
      kind: "entities" as const,
      ids: Object.freeze([
        ...new Set([
          ...ACADEMYOS_ENTITY_TYPES,
          ...ACADEMY_SIS_ENTITY_TYPES,
          ...ACADEMY_SCHEDULING_ENTITY_TYPES,
        ]),
      ]),
    }),
    Object.freeze({
      kind: "forms" as const,
      ids: Object.freeze(ACADEMYOS_FORMS.map((f) => f.id)),
    }),
    Object.freeze({
      kind: "workflows" as const,
      ids: Object.freeze(ACADEMYOS_WORKFLOWS.map((w) => w.id)),
    }),
    Object.freeze({
      kind: "navigation" as const,
      ids: Object.freeze([ACADEMYOS_NAVIGATION.id]),
    }),
    Object.freeze({
      kind: "permissions" as const,
      ids: Object.freeze([
        ...ACADEMYOS_PERMISSION_ROLE_PACKS.map(
          (p) => `academy.permission.${p.id}`
        ),
        ACADEMY_SIS_PERMISSION_PACK_ID,
        ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
      ]),
    }),
    Object.freeze({
      kind: "reports" as const,
      ids: Object.freeze([
        ...ACADEMYOS_REPORTS.map((r) => r.id),
        ...ACADEMY_SIS_REPORT_IDS,
        ...ACADEMY_SCHEDULING_REPORT_IDS,
      ]),
    }),
    Object.freeze({
      kind: "terminology" as const,
      ids: Object.freeze([...ACADEMY_TERMINOLOGY_PACK_IDS]),
    }),
    Object.freeze({
      kind: "localization" as const,
      ids: Object.freeze([...ACADEMY_LOCALIZATION_PACK_IDS]),
    }),
    Object.freeze({
      kind: "processes" as const,
      ids: Object.freeze([ACADEMY_ADMISSIONS_PROCESS_ID]),
    }),
    Object.freeze({
      kind: "documents" as const,
      ids: Object.freeze([...ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS]),
    }),
    Object.freeze({
      kind: "communications" as const,
      ids: Object.freeze([...ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS]),
    }),
    Object.freeze({
      kind: "decisions" as const,
      ids: Object.freeze([...ACADEMY_DECISION_DEFINITION_IDS]),
    }),
  ]),
});
