/**
 * Standardized approval form catalog for Release Governance.
 * Every recorded approval must include the fields in ApprovalRecord.
 */

export interface ApprovalFormDefinition {
  id: string;
  title: string;
  phase: string;
  requiredRoles: string[];
  evidenceHints: string[];
  description: string;
}

export const APPROVAL_FORMS: ApprovalFormDefinition[] = [
  {
    id: "engineering_approval",
    title: "Engineering Approval Form",
    phase: "rc1",
    requiredRoles: ["Engineering Lead"],
    evidenceHints: ["Engineering readiness report", "CI logs", "Build log"],
    description: "Attests engineering certification package is complete for RC1.",
  },
  {
    id: "rc1_sign_off",
    title: "RC1 Sign-Off",
    phase: "rc1",
    requiredRoles: ["Engineering Lead", "QA Lead", "Release Manager"],
    evidenceHints: ["RC1 engineering certification report", "Release blocker list"],
    description: "Formal RC1 exit approval.",
  },
  {
    id: "operations_approval",
    title: "Operations Approval Form",
    phase: "rc2",
    requiredRoles: ["Ops"],
    evidenceHints: ["Operations checklist", "Support readiness"],
    description: "Attests operations validation for RC2.",
  },
  {
    id: "product_approval",
    title: "Product Approval Form",
    phase: "rc2",
    requiredRoles: ["Product"],
    evidenceHints: ["Business validation report", "Workflow matrix"],
    description: "Attests product / UAT validation for RC2.",
  },
  {
    id: "rc2_sign_off",
    title: "RC2 Sign-Off",
    phase: "rc2",
    requiredRoles: ["Product", "Ops", "Release Manager"],
    evidenceHints: ["RC2 package"],
    description: "Formal RC2 exit approval.",
  },
  {
    id: "pilot_approval",
    title: "Pilot Approval Form",
    phase: "rc3",
    requiredRoles: ["Pilot Sponsor", "Ops", "Security"],
    evidenceHints: ["Pilot success criteria", "Weekly reports"],
    description: "Authorizes or exits the pilot program.",
  },
  {
    id: "rc3_sign_off",
    title: "RC3 Sign-Off",
    phase: "rc3",
    requiredRoles: ["Pilot Sponsor", "Ops", "Security", "Release Manager"],
    evidenceHints: ["Final pilot report"],
    description: "Formal RC3 exit approval.",
  },
  {
    id: "dress_rehearsal_approval",
    title: "Dress Rehearsal Approval Form",
    phase: "rc3_5",
    requiredRoles: ["Ops", "Release Manager", "Engineering Lead"],
    evidenceHints: ["Dress rehearsal report", "Rollback / restore logs"],
    description: "Attests RC3.5 production dress rehearsal.",
  },
  {
    id: "go_no_go",
    title: "Go / No-Go Form",
    phase: "rc4",
    requiredRoles: ["Executive Sponsor", "Release Manager"],
    evidenceHints: ["Decision matrix", "Risk register", "Known issues"],
    description: "Executive go / no-go decision for GA eligibility.",
  },
  {
    id: "executive_approval",
    title: "Executive Approval Form",
    phase: "rc4",
    requiredRoles: ["Executive Sponsor", "Security", "Ops", "Product"],
    evidenceHints: ["Final certification report", "Production approval package"],
    description: "Multi-role executive attestation for production GA.",
  },
  {
    id: "rc4_sign_off",
    title: "RC4 Sign-Off",
    phase: "rc4",
    requiredRoles: ["Executive Sponsor", "Release Manager"],
    evidenceHints: ["Go decision", "Production approval"],
    description: "Formal RC4 exit / GA authorization.",
  },
];

export function getApprovalForm(id: string): ApprovalFormDefinition {
  const form = APPROVAL_FORMS.find((f) => f.id === id);
  if (!form) throw new Error(`Unknown approval form: ${id}`);
  return form;
}
