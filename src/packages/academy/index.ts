/**
 * Academy application package — ownership home for The JAG OS.
 */

export {
  ACADEMY_APPLICATION_ID,
  ACADEMY_LOCALIZATION_PACK_IDS,
  ACADEMY_PACKAGE,
  ACADEMY_PACKAGE_ID,
  ACADEMY_PACKAGE_VERSION,
  ACADEMY_TERMINOLOGY_PACK_IDS,
  type AcademyPackageDescriptor,
} from "@/packages/academy/package";

export {
  AcademyPackageManifest,
  ACADEMY_REGISTRATION_ENTRY,
} from "@/packages/academy/manifest";

export {
  registerAcademyPackage,
  type RegisterAcademyPackageOptions,
} from "@/packages/academy/register";

export { bindAcademyPackageHost } from "@/packages/academy/host";

export {
  registerAcademyPhase1Contributions,
  type AcademyPhase1RegistrationResult,
} from "@/packages/academy/registration";

export { resetAcademyPackageRuntimeForTests } from "@/packages/academy/testing";

export {
  AcademyAdmissionsProcessDefinition,
  ACADEMY_ADMISSIONS_PROCESS_ID,
  ACADEMY_PROCESS_DEFINITIONS,
} from "@/packages/academy/processes";

export {
  AcademyAdmissionsEligibilityDecision,
  ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
  ACADEMY_DECISION_DEFINITIONS,
  ACADEMY_DECISION_DEFINITION_IDS,
  formatAdmissionsEligibilityExplanation,
} from "@/packages/academy/decisions";

export {
  ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS,
  ACADEMY_ADMISSIONS_DOCUMENT_IDS,
} from "@/packages/academy/documents";

export {
  ACADEMY_ADMISSIONS_COMMUNICATION_DEFINITION_IDS,
  ACADEMY_ADMISSIONS_COMMUNICATION_IDS,
  ACADEMY_ADMISSIONS_COMMUNICATION_TEMPLATE_ID_LIST,
} from "@/packages/academy/communications";

export {
  ACADEMY_ADMISSIONS_FORM_DEFINITION_IDS,
  ACADEMY_ADMISSIONS_FORM_IDS,
} from "@/packages/academy/forms";

export {
  registerAcademyPackageSis,
  ACADEMY_SIS_ENTITY_TYPES,
  ACADEMY_SIS_ENROLLMENT_DEFINITION_IDS,
  ACADEMY_SIS_PERMISSION_KEYS,
  ACADEMY_SIS_PERMISSION_PACK_ID,
  ACADEMY_SIS_REPORT_IDS,
  ACADEMY_SIS_STUDENT_METADATA_KEYS,
  getAcademySisPermissionPack,
  listAcademySisReports,
} from "@/packages/academy/sis";

export {
  registerAcademyPackageScheduling,
  ACADEMY_SCHEDULING_ENTITY_TYPES,
  ACADEMY_SCHEDULING_PERMISSION_KEYS,
  ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
  ACADEMY_SCHEDULING_REPORT_IDS,
  ACADEMY_SCHEDULING_PROGRAMS,
  ACADEMY_ACADEMIC_CALENDAR_DEFINITION_IDS,
  getAcademySchedulingPermissionPack,
  listAcademySchedulingReports,
  listRegisteredAcademySchedulingPrograms,
  listRegisteredAcademySchedulingCalendars,
} from "@/packages/academy/scheduling";

export {
  buildAcademyApplicationModel,
  compileAcademyApplication,
} from "@/packages/academy/modeling";

export {
  buildAcademyOrganizationBlueprint,
  materializeAcademyRuntimeSpecification,
  generateAcademyRuntimeSpecification,
  compileAcademyFromBlueprints,
} from "@/packages/academy/blueprints";

export {
  describeAcademyOrganization,
  buildAcademyOrganizationBlueprintFromStudio,
} from "@/packages/academy/studio";

export {
  buildAcademyCapabilityPacks,
  assembleAcademyContributionBundle,
} from "@/packages/academy/capability-packs";

export {
  EDUCATION_FOUNDATION_PACK_IDS,
  buildEducationFoundationCapabilityPacks,
  educationFoundationModules,
} from "@/packages/academy/composition";

export {
  runAcademyLifecycleProof,
  type AcademyLifecycleProofResult,
} from "@/packages/academy/lifecycle";



