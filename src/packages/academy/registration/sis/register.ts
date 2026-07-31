/**
 * Register Academy SIS package contributions into JAG Entity Framework.
 * Allowed registration boundary for platform entity imports.
 */

import { EntityService } from "@/lib/platform/entities";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { AcademySisAcademicProfileEntity } from "@/packages/academy/sis/academic-record";
import {
  AcademySisAccommodationEntity,
  AcademySisIepEntity,
  AcademySisPlan504Entity,
} from "@/packages/academy/sis/accommodations";
import { AcademySisAttendanceProfileEntity } from "@/packages/academy/sis/attendance-profile";
import {
  AcademySisAuthorizedPickupEntity,
  AcademySisEmergencyContactEntity,
} from "@/packages/academy/sis/contacts";
import { AcademySisEnrollmentEntity } from "@/packages/academy/sis/enrollment";
import { AcademySisGuardianEntity } from "@/packages/academy/sis/guardians";
import {
  AcademySisMedicalRecordEntity,
  AcademySisMedicationAuthorizationEntity,
} from "@/packages/academy/sis/medical";
import {
  ACADEMY_SIS_PERMISSION_PACK,
  ACADEMY_SIS_PERMISSION_PACK_ID,
} from "@/packages/academy/sis/permissions";
import {
  registerAcademySisPermissionPack,
  registerAcademySisReports,
} from "@/packages/academy/sis/reports";
import { AcademySisStudentEntity } from "@/packages/academy/sis/students";
import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";

/** Entity types owned/enriched by the SIS package contribution. */
export const ACADEMY_SIS_ENTITY_DEFINITIONS: readonly SisEntityTypeDefinition[] =
  Object.freeze([
    AcademySisStudentEntity,
    AcademySisGuardianEntity,
    AcademySisEmergencyContactEntity,
    AcademySisAuthorizedPickupEntity,
    AcademySisEnrollmentEntity,
    AcademySisAcademicProfileEntity,
    AcademySisAttendanceProfileEntity,
    AcademySisIepEntity,
    AcademySisPlan504Entity,
    AcademySisAccommodationEntity,
    AcademySisMedicalRecordEntity,
    AcademySisMedicationAuthorizationEntity,
  ]);

export const ACADEMY_SIS_ENTITY_TYPES = Object.freeze(
  ACADEMY_SIS_ENTITY_DEFINITIONS.map((e) => e.entityType)
);

export type AcademySisRegistrationResult = {
  readonly entityCount: number;
  readonly reportCount: number;
  readonly permissionPackId: typeof ACADEMY_SIS_PERMISSION_PACK_ID;
  readonly entityTypes: readonly string[];
};

function asEntityTypeDefinition(
  definition: SisEntityTypeDefinition
): EntityTypeDefinition {
  return definition as unknown as EntityTypeDefinition;
}

export function registerAcademyPackageSis(): AcademySisRegistrationResult {
  for (const definition of ACADEMY_SIS_ENTITY_DEFINITIONS) {
    EntityService.registerType(asEntityTypeDefinition(definition));
  }
  const reports = registerAcademySisReports();
  registerAcademySisPermissionPack(ACADEMY_SIS_PERMISSION_PACK);

  return {
    entityCount: ACADEMY_SIS_ENTITY_DEFINITIONS.length,
    reportCount: reports.length,
    permissionPackId: ACADEMY_SIS_PERMISSION_PACK_ID,
    entityTypes: ACADEMY_SIS_ENTITY_TYPES,
  };
}
