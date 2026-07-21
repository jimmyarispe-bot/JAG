export {
  listFamiliesForDashboard,
  getFamilyById,
  normalizeStatusFilter,
} from "./queries";
export type {
  FamilyListRow,
  FamilyListQuery,
  FamilyListResult,
  FamilyStatusFilter,
  FamilySortKey,
} from "./queries";

export {
  canManageFamilyLifecycle,
  canEditFamilies,
  canViewFamilies,
  assertCanManageFamilyLifecycle,
  assertCanEditFamilies,
  requireFamilyLifecycleAccess,
  requireFamilyEditAccess,
  FAMILY_LIFECYCLE_ROLES,
  FAMILY_EDIT_ROLES,
} from "./access";

export {
  archiveFamily,
  restoreFamily,
  deleteFamily,
  getFamilyDependencyReport,
  inspectFamilyDependencies,
} from "./lifecycle";

export { mergeFamilies } from "./merge";
export { splitFamily } from "./split";
export { moveStudentToFamily, getFamilySiblings } from "./relationships";
