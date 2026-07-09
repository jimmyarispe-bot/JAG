import type {
  JagObjectOwnership,
  JagOrganizationContext,
  JagOrgNodeRef,
  JagOwnedEntityKind,
} from "@/lib/platform/jag-organization/types";

const SCHOOL_SCOPED: Set<JagOwnedEntityKind> = new Set([
  "student",
  "employee",
  "family",
  "schedule",
  "budget",
  "instructional_session",
  "evidence",
  "learning_journey",
  "competency",
  "task",
  "work_item",
]);

const DEPARTMENT_SCOPED: Set<JagOwnedEntityKind> = new Set([
  "publication",
  "research",
]);

/** Resolve organizational owner for any JAG object — single ownership model. */
export function resolveObjectOrganizationalOwner(
  org: JagOrganizationContext,
  entityKind: JagOwnedEntityKind,
  entityId: string,
  hints?: { schoolId?: string | null; departmentId?: string | null }
): JagObjectOwnership {
  const scope = org.activeScope;
  const schoolId = hints?.schoolId ?? scope.schoolId;
  const departmentId = hints?.departmentId ?? scope.departmentId;

  let owner: JagOrgNodeRef;
  const chain: JagOrgNodeRef[] = [];

  if (entityKind === "knowledge_asset") {
    owner = {
      id: org.ownership.organizationalOwner.id,
      kind: org.ownership.organizationalOwner.kind,
      name: org.ownership.organizationalOwner.name,
    };
    chain.push(owner);
  } else if (entityKind === "workflow" || entityKind === "rule" || entityKind === "recommendation") {
    owner = org.ownership.organizationalOwner;
    chain.push(owner);
    if (scope.organizationId && scope.organizationName) {
      chain.push({
        id: scope.organizationId,
        kind: "organization",
        name: scope.organizationName,
      });
    }
  } else if (DEPARTMENT_SCOPED.has(entityKind) && departmentId && scope.departmentName) {
    owner = { id: departmentId, kind: "department", name: scope.departmentName };
    chain.push(owner);
    if (schoolId && scope.schoolName) {
      chain.push({ id: schoolId, kind: "school", name: scope.schoolName });
    }
  } else if (SCHOOL_SCOPED.has(entityKind) && schoolId && scope.schoolName) {
    owner = { id: schoolId, kind: "school", name: scope.schoolName };
    chain.push(owner);
  } else {
    owner = org.ownership.organizationalOwner;
    chain.push(owner);
  }

  if (scope.organizationId && scope.organizationName && chain[chain.length - 1]?.kind !== "organization") {
    chain.push({
      id: scope.organizationId,
      kind: "organization",
      name: scope.organizationName,
    });
  }

  return { entityKind, entityId, owner, ownershipChain: chain };
}

export function attachCapabilityOwnership(
  org: JagOrganizationContext,
  grantedCapabilities: Array<{
    capabilityKey: string;
    workflowContext: { knowledgeAssetKeys: string[] };
    binding: { knowledgeAssetKeys?: string[] };
  }>
): JagOrganizationContext {
  const knowledgeOwnerKeys = new Set<string>();
  const workflowOwnerKeys = new Set<string>();

  for (const cap of grantedCapabilities) {
    workflowOwnerKeys.add(cap.capabilityKey);
    for (const key of cap.workflowContext.knowledgeAssetKeys) {
      knowledgeOwnerKeys.add(key);
    }
    for (const key of cap.binding.knowledgeAssetKeys ?? []) {
      knowledgeOwnerKeys.add(key);
    }
  }

  return {
    ...org,
    ownership: {
      ...org.ownership,
      knowledgeOwnerKeys: [...knowledgeOwnerKeys],
      workflowOwnerKeys: [...workflowOwnerKeys],
    },
  };
}
