/**
 * Education Domain Manifest — declaration only.
 */

import {
  DOMAIN_SDK_MINIMUM_CORE,
  DOMAIN_SDK_RUNTIME_CONTRACT,
  DOMAIN_SDK_VERSION,
  createDomainManifest,
  type DomainManifest,
} from "@/lib/jag/domain-sdk";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";
import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  EDUCATION_DOMAIN_VERSION,
  EDUCATION_PERMISSIONS,
} from "../types";

export function createEducationManifest(): DomainManifest {
  return createDomainManifest({
    id: EDUCATION_DOMAIN_ID,
    name: EDUCATION_DOMAIN_NAME,
    displayName: "Education",
    version: EDUCATION_DOMAIN_VERSION,
    description:
      "Education domain intelligence package for JAG — contracts and contributor registration foundation (not AcademyOS).",
    owner: {
      name: "Education Domain",
      organization: "JAG",
    },
    requiredRuntimeVersion: DOMAIN_SDK_RUNTIME_CONTRACT,
    minimumCoreVersion: DOMAIN_SDK_MINIMUM_CORE,
    requiredSdkVersion: DOMAIN_SDK_VERSION,
    supportedCapabilities: [
      "context",
      "intent",
      "cognition",
      "experience",
      "action",
      "evidence",
      "memory",
      "twin",
    ],
    contributors: [
      { id: EDUCATION_CONTRIBUTOR_IDS.context, kind: "context" },
      { id: EDUCATION_CONTRIBUTOR_IDS.intent, kind: "intent" },
      { id: EDUCATION_CONTRIBUTOR_IDS.cognition, kind: "cognition" },
      {
        id: EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
        kind: "cognition",
        description: "Enrollment Intelligence (D2.1)",
      },
      {
        id: EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        kind: "cognition",
        description: "Attendance Intelligence (D2.3)",
      },
      {
        id: EDUCATION_CONTRIBUTOR_IDS.progressCognition,
        kind: "cognition",
        description: "Academic Progress Intelligence (D4.0)",
      },
      {
        id: EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
        kind: "cognition",
        description: "Student Success Intelligence — synthesis (D4.1)",
      },
      { id: EDUCATION_CONTRIBUTOR_IDS.experience, kind: "experience" },
      { id: EDUCATION_CONTRIBUTOR_IDS.action, kind: "action" },
      { id: EDUCATION_CONTRIBUTOR_IDS.evidence, kind: "evidence" },
      { id: EDUCATION_CONTRIBUTOR_IDS.memory, kind: "memory" },
      { id: EDUCATION_CONTRIBUTOR_IDS.twin, kind: "twin" },
    ],
    permissions: [
      {
        key: EDUCATION_PERMISSIONS.enrollmentApprove,
        description: "Approve enrollment",
        actionScoped: true,
      },
      {
        key: EDUCATION_PERMISSIONS.sessionSchedule,
        description: "Schedule session",
        actionScoped: true,
      },
      {
        key: EDUCATION_PERMISSIONS.attendanceRecord,
        description: "Record attendance",
        actionScoped: true,
      },
      {
        key: EDUCATION_PERMISSIONS.progressPublish,
        description: "Publish progress",
        actionScoped: true,
      },
    ],
    dependencies: [],
    featureFlags: {
      foundationPlaceholders: true,
      enrollmentIntelligence: true,
      attendanceIntelligence: true,
      executionEnabled: false,
    },
    metadata: {
      industries: ["education"],
      tags: [
        "foundation",
        "contracts",
        "reference-domain",
        "enrollment-intelligence",
        "attendance-intelligence",
      ],
      attributes: {
        academyos: false,
        phase: "D2.3",
      },
    },
  });
}

/** Frozen snapshot for docs / tests. */
export const EDUCATION_MANIFEST = createEducationManifest();
