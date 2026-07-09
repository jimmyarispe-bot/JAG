import type { OrgAssignment } from "@/lib/platform/identity/types";

/** Enterprise org node kinds — divisions map to regions when no division table exists. */
export type JagOrgNodeKind =
  | "organization"
  | "division"
  | "region"
  | "school"
  | "campus"
  | "program"
  | "department"
  | "team"
  | "position";

export interface JagOrgNodeRef {
  id: string;
  kind: JagOrgNodeKind;
  name: string;
  code?: string | null;
  parentId?: string | null;
}

export interface JagOrgHierarchySnapshot {
  organization: { id: string; name: string; slug: string } | null;
  regions: Array<{ id: string; name: string; code: string | null }>;
  schools: Array<{ id: string; name: string; organization_id: string | null; region_id?: string | null }>;
  campuses: Array<{ id: string; school_id: string; name: string; is_primary: boolean; code?: string | null }>;
  programs: Array<{ id: string; school_id: string; name: string; code: string }>;
  departments: Array<{ id: string; school_id: string; campus_id: string | null; name: string; code: string | null }>;
}

export interface JagOrgTreeNode extends JagOrgNodeRef {
  children: JagOrgTreeNode[];
}

export interface JagOrgActiveScope {
  organizationId: string | null;
  organizationName: string | null;
  regionId: string | null;
  regionName: string | null;
  schoolId: string | null;
  schoolName: string | null;
  campusId: string | null;
  campusName: string | null;
  programId: string | null;
  programName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  positionTitle: string | null;
}

export interface JagOrgPosition {
  id: string;
  title: string;
  department: string | null;
  isPrimary: boolean;
}

export interface JagOrgReportingChain {
  employeeId: string | null;
  positions: JagOrgPosition[];
  /** Upward chain from position → department → school → organization. */
  chain: JagOrgNodeRef[];
}

export interface JagOrgOwnershipChain {
  organizationalOwner: JagOrgNodeRef;
  knowledgeOwnerKeys: string[];
  workflowOwnerKeys: string[];
  financialOwner: { schoolId: string | null; departmentId: string | null; label: string };
}

export interface JagOrgDelegatedAuthority {
  assignmentScopes: Array<{
    schoolId: string;
    campusId: string | null;
    programId: string | null;
    departmentId: string | null;
    allCampuses: boolean;
    allPrograms: boolean;
    isPrimary: boolean;
  }>;
  grantedPermissions: string[];
  inheritedPermissions: string[];
}

export interface JagOrgOperationalVisibility {
  accessibleSchoolIds: string[];
  accessibleCampusIds: string[];
  accessibleProgramIds: string[];
  accessibleDepartmentIds: string[];
  hasUnrestrictedAccess: boolean;
}

/**
 * Authoritative enterprise organization context consumed by every workspace.
 * Flat legacy fields remain for Execution Engine and Rules Engine compatibility.
 */
export interface JagOrganizationContext {
  resolvedAt: string;
  /** @deprecated Use activeScope — kept for pipeline consumers. */
  schoolId: string | null;
  /** @deprecated Use activeScope — kept for pipeline consumers. */
  organizationId: string | null;
  primaryAssignment: OrgAssignment | null;
  accessibleSchoolIds: string[];
  hasUnrestrictedSchoolAccess: boolean;
  hierarchy: {
    snapshot: JagOrgHierarchySnapshot;
    tree: JagOrgTreeNode[];
    visibleTree: JagOrgTreeNode[];
  };
  activeScope: JagOrgActiveScope;
  reporting: JagOrgReportingChain;
  ownership: JagOrgOwnershipChain;
  authority: JagOrgDelegatedAuthority;
  visibility: JagOrgOperationalVisibility;
}

/** Entity kinds that must belong to an organizational owner in The JAG™. */
export type JagOwnedEntityKind =
  | "competency"
  | "evidence"
  | "learning_journey"
  | "rule"
  | "recommendation"
  | "task"
  | "knowledge_asset"
  | "workflow"
  | "schedule"
  | "budget"
  | "employee"
  | "student"
  | "family"
  | "publication"
  | "research"
  | "instructional_session"
  | "work_item";

export interface JagObjectOwnership {
  entityKind: JagOwnedEntityKind;
  entityId: string;
  owner: JagOrgNodeRef;
  ownershipChain: JagOrgNodeRef[];
}
