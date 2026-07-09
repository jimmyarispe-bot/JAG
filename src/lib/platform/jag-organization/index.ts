/** The JAG Organization™ — enterprise org model consumed by every workspace. */
export type {
  JagObjectOwnership,
  JagOrganizationContext,
  JagOrgActiveScope,
  JagOrgDelegatedAuthority,
  JagOrgHierarchySnapshot,
  JagOrgNodeKind,
  JagOrgNodeRef,
  JagOrgOperationalVisibility,
  JagOrgOwnershipChain,
  JagOrgPosition,
  JagOrgReportingChain,
  JagOrgTreeNode,
  JagOwnedEntityKind,
} from "@/lib/platform/jag-organization/types";

export { buildJagOrganizationTree, filterVisibleOrganizationTree } from "@/lib/platform/jag-organization/hierarchy-tree";
export {
  attachCapabilityOwnership,
  resolveObjectOrganizationalOwner,
} from "@/lib/platform/jag-organization/ownership";
export {
  buildJagOrganizationContextFromIdentity,
  resolveJagOrganizationContext,
  type ResolveJagOrganizationOptions,
} from "@/lib/platform/jag-organization/resolve";
