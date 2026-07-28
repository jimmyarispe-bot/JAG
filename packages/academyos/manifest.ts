/**
 * AcademyOS™ Industry Pack — Extension Framework manifest.
 * Maps the product descriptor onto Platform SDK ExtensionManifest.
 */

import type { ExtensionManifest } from "@/lib/platform-sdk";
import type { PermissionDefinition } from "@/lib/platform-sdk";

export const ACADEMYOS_PACK_ID = "academyos" as const;
export const ACADEMYOS_PACK_VERSION = "1.0.0" as const;

/** Product-facing industry pack descriptor (Sprint 2.1 shape). */
export type AcademyOsIndustryPackDescriptor = {
  readonly id: typeof ACADEMYOS_PACK_ID;
  readonly name: "AcademyOS";
  readonly version: typeof ACADEMYOS_PACK_VERSION;
  readonly type: "industry-pack";
  readonly requiresPlatform: "1.x";
  readonly modules: readonly string[];
};

export const ACADEMYOS_MODULES = [
  "Admissions",
  "Enrollment",
  "Students",
  "Guardians",
  "Staff",
  "Schools",
  "Classrooms",
  "Scheduling",
  "Attendance",
  "Grading",
  "Transcripts",
  "IEP",
  "Scholarships",
  "Billing",
  "Reporting",
] as const;

export const ACADEMYOS_PACK_DESCRIPTOR: AcademyOsIndustryPackDescriptor =
  Object.freeze({
    id: ACADEMYOS_PACK_ID,
    name: "AcademyOS",
    version: ACADEMYOS_PACK_VERSION,
    type: "industry-pack",
    requiresPlatform: "1.x",
    modules: ACADEMYOS_MODULES,
  });

const PERMISSIONS: readonly PermissionDefinition[] = Object.freeze([
  {
    id: "academyos.students.read",
    name: "Read students",
    description: "View AcademyOS student records",
    scope: "Organization",
    resource: "academyos.student",
    actions: ["read"],
  },
  {
    id: "academyos.students.write",
    name: "Manage students",
    description: "Create and update AcademyOS student records",
    scope: "Organization",
    resource: "academyos.student",
    actions: ["create", "update"],
  },
  {
    id: "academyos.enrollment.write",
    name: "Manage enrollment",
    description: "Manage AcademyOS enrollments",
    scope: "Organization",
    resource: "academyos.enrollment",
    actions: ["create", "update"],
  },
  {
    id: "academyos.intelligence.read",
    name: "Education intelligence",
    description: "View AcademyOS education dashboards",
    scope: "Organization",
    resource: "academyos.intelligence",
    actions: ["read"],
  },
]);

/** Canonical ExtensionManifest for install via Platform SDK. */
/** Labels registered on the SDK twin-entity registry (metadata discovery). */
export const ACADEMYOS_TWIN_ENTITY_LABELS = [
  "AcademyOS Student (Person)",
  "AcademyOS Guardian (Person)",
  "AcademyOS Teacher (Person)",
  "AcademyOS School (Organization)",
  "AcademyOS Classroom (Location)",
  "AcademyOS Course (Product / Service)",
  "AcademyOS Attendance (Event)",
  "AcademyOS IEP (Document)",
  "AcademyOS Scholarship (Asset)",
  "AcademyOS Session (Event)",
] as const;

export const ACADEMYOS_EXTENSION_MANIFEST: ExtensionManifest = Object.freeze({
  id: ACADEMYOS_PACK_ID,
  name: "AcademyOS",
  version: ACADEMYOS_PACK_VERSION,
  category: "Industry Pack",
  description:
    "AcademyOS™ education industry pack — admissions, students, scheduling, attendance, IEP, scholarships, and billing on The JAG™ Foundation.",
  dependencies: [],
  minimumPlatformVersion: "1.0.0",
  minimumSdkVersion: "1.0.0",
  requiredPermissions: PERMISSIONS,
  digitalTwinEntities: [
    "Person",
    "Organization",
    "Location",
    "Product / Service",
    "Event",
    "Document",
  ],
  connectorDependencies: [],
  featureFlags: [
    "academyos.admissions",
    "academyos.students",
    "academyos.scheduling",
    "academyos.attendance",
    "academyos.iep",
    "academyos.scholarships",
    "academyos.billing",
    "academyos.intelligence",
  ],
  configurationSchema: {
    type: "object",
    properties: {
      schoolYear: {
        type: "string",
        description: "Default school year label (e.g. 2026-2027)",
        required: false,
      },
      timezone: {
        type: "string",
        description: "Default school timezone",
        required: false,
      },
    },
  },
});
