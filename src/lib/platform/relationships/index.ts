export { RELATIONSHIP_TYPE_KEYS, STUDENT_RELATIONSHIP_TYPES, isRelationshipTypeKey } from "@/lib/platform/relationships/catalog";
export type { RelationshipTypeKey } from "@/lib/platform/relationships/catalog";
export { createRelationship, endRelationship, upsertPrimaryRelationship } from "@/lib/platform/relationships/actions";
export {
  getRelationshipTypeDefinitions,
  getRelationshipsFrom,
  getRelationshipsTo,
  getStudentRelationships,
  getEmployeeRelationships,
  getEmployeeDirectReports,
  getEmployeeAssignedStudents,
  getStudentSupportTeam,
} from "@/lib/platform/relationships/query";
export type {
  CreateRelationshipInput,
  PlatformRelationship,
  RelationshipQueryFilters,
  RelationshipSource,
  RelationshipStatus,
  RelationshipTypeDefinition,
} from "@/lib/platform/relationships/types";
