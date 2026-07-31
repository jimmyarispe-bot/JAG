/**
 * Academy SIS package contributions — declarative definitions only.
 */

export {
  registerAcademyPackageSis,
  ACADEMY_SIS_ENTITY_DEFINITIONS,
  ACADEMY_SIS_ENTITY_TYPES,
  type AcademySisRegistrationResult,
} from "@/packages/academy/sis/registration";

export {
  AcademySisStudentEntity,
  ACADEMY_SIS_STUDENT_ENTITY_TYPE,
  ACADEMY_SIS_STUDENT_METADATA_KEYS,
} from "@/packages/academy/sis/students";

export {
  AcademySisGuardianEntity,
  ACADEMY_SIS_GUARDIAN_ENTITY_TYPE,
  ACADEMY_SIS_GUARDIAN_RELATIONSHIPS,
} from "@/packages/academy/sis/guardians";

export {
  AcademySisEmergencyContactEntity,
  AcademySisAuthorizedPickupEntity,
  ACADEMY_SIS_AUTHORIZED_PICKUP_ENTITY_TYPE,
  ACADEMY_SIS_CONTACT_RELATIONSHIPS,
} from "@/packages/academy/sis/contacts";

export {
  AcademySisEnrollmentEntity,
  ACADEMY_SIS_ENROLLMENT_DEFINITIONS,
  ACADEMY_SIS_ENROLLMENT_DEFINITION_IDS,
  ACADEMY_SIS_ENROLLMENT_ENTITY_TYPE,
} from "@/packages/academy/sis/enrollment";

export {
  AcademySisAcademicProfileEntity,
  ACADEMY_SIS_ACADEMIC_PROFILE_ENTITY_TYPE,
  ACADEMY_SIS_ACADEMIC_TERMINOLOGY,
} from "@/packages/academy/sis/academic-record";

export {
  AcademySisIepEntity,
  AcademySisPlan504Entity,
  AcademySisAccommodationEntity,
} from "@/packages/academy/sis/accommodations";

export {
  AcademySisMedicalRecordEntity,
  AcademySisMedicationAuthorizationEntity,
} from "@/packages/academy/sis/medical";

export {
  AcademySisAttendanceProfileEntity,
  ACADEMY_SIS_ATTENDANCE_PROFILE_ENTITY_TYPE,
} from "@/packages/academy/sis/attendance-profile";

export {
  ACADEMY_SIS_PERMISSIONS,
  ACADEMY_SIS_PERMISSION_KEYS,
  ACADEMY_SIS_PERMISSION_PACK,
  ACADEMY_SIS_PERMISSION_PACK_ID,
} from "@/packages/academy/sis/permissions";

export {
  ACADEMY_SIS_REPORTS,
  ACADEMY_SIS_REPORT_IDS,
  listAcademySisReports,
  getAcademySisReport,
  getAcademySisPermissionPack,
} from "@/packages/academy/sis/reports";

export { resetAcademySisForTests } from "@/packages/academy/sis/testing";
