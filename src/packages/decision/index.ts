/**
 * Decision Capability Pack — Universal Organizational Decision.
 */

export {
  DECISION_APPLICATION_ID,
  DECISION_PACKAGE_ID,
  DECISION_PACKAGE_VERSION,
  DECISION_PACK_ID,
} from "@/packages/decision/package";

export {
  buildDecisionCapabilityPacks,
  buildDecisionCorePack,
  describeDecisionCorePack,
  assembleDecisionContributionBundle,
  decisionPackCatalogPayload,
} from "@/packages/decision/capability-packs";

export {
  DECISION_ENTITY_DEFINITIONS,
  BusinessDecisionEntity,
  DecisionEvidenceRefEntity,
  DecisionOptionEntity,
  DecisionParticipantEntity,
  DecisionRationaleEntity,
  DecisionScheduleLinkEntity,
  DecisionWorkLinkEntity,
  DecisionCommunicationRefEntity,
} from "@/packages/decision/entities";
export {
  DECISION_PERMISSION_KEYS,
  DECISION_PERMISSION_PACK,
  DECISION_PERMISSION_PACK_ID,
  DECISION_PERMISSION_PACKS,
} from "@/packages/decision/permissions";
export { DECISION_NAVIGATION } from "@/packages/decision/navigation";
export {
  DECISION_CATEGORY_EXAMPLES,
  DECISION_STATUS_STATES,
  DECISION_OUTCOMES,
  DECISION_PARTICIPANT_ROLES,
  DECISION_EVIDENCE_ROLES,
} from "@/packages/decision/catalogs";

export {
  buildDecisionProofOrganizationBlueprint,
  compileDecisionProofRuntime,
  generateDecisionProofRuntime,
  registerDecisionHandwrittenBaseline,
  resetDecisionProofPortsForTests,
  listDecisionProofPermissionPacks,
} from "@/packages/decision/proof";
