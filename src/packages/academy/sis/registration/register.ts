/**
 * Re-export SIS registration from the Academy registration boundary.
 * Keeps `sis/registration` as the documented ownership home.
 */

export {
  registerAcademyPackageSis,
  ACADEMY_SIS_ENTITY_DEFINITIONS,
  ACADEMY_SIS_ENTITY_TYPES,
  type AcademySisRegistrationResult,
} from "@/packages/academy/registration/sis/register";
