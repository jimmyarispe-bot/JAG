export const DECISION_PERMISSION_KEYS = Object.freeze({
  access: "decision.access",
  typesRead: "decision.types.read",
  typesUpdate: "decision.types.update",
  decisionsRead: "decision.decisions.read",
  decisionsUpdate: "decision.decisions.update",
  optionsRead: "decision.options.read",
  optionsUpdate: "decision.options.update",
  evidenceRead: "decision.evidence.read",
  evidenceUpdate: "decision.evidence.update",
  approvalsRead: "decision.approvals.read",
  approvalsUpdate: "decision.approvals.update",
} as const);

export const DECISION_PERMISSION_PACK_ID = "decision.permission.core" as const;
