export {
  archiveStudent,
  restoreStudent,
  deleteStudent,
  getStudentDependencyReport,
  getStudentImportOrigin,
  isArchivedStatus,
  coerceStudentId,
  loadStudent,
} from "./service";
export {
  canManageStudentLifecycle,
  assertCanManageStudentLifecycle,
  requireStudentLifecycleAccess,
  STUDENT_LIFECYCLE_ROLES,
} from "./access";
export { inspectStudentDependencies, findStudentImportOrigin } from "./dependencies";
export type {
  StudentStatusFilter,
  StudentDependencyHit,
  StudentDependencyReport,
  StudentImportOrigin,
  ArchiveStudentInput,
  RestoreStudentInput,
  DeleteStudentInput,
  LifecycleResult,
} from "./types";
