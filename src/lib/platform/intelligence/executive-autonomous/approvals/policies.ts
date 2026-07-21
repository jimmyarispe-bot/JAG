/**
 * Default organizational approval policies (Sprint 066).
 * Role-based only — no hard-coded person names.
 */

import type { OrganizationalPolicy } from "@/lib/platform/intelligence/executive-autonomous/types";

export const DEFAULT_AUTONOMOUS_POLICIES: OrganizationalPolicy[] = [
  {
    id: "pol-exec-staffing",
    key: "staffing.executive_director",
    description: "Staffing actions require Executive Director approval",
    requiredRoles: ["executive_director"],
    appliesTo: ["staffing"],
    blocking: true,
  },
  {
    id: "pol-school-staffing",
    key: "staffing.school_leader",
    description: "Campus staffing requires School Leader approval",
    requiredRoles: ["school_leader"],
    appliesTo: ["staffing"],
    blocking: true,
  },
  {
    id: "pol-finance-threshold",
    key: "finance.threshold",
    description: "Material financial impact requires CEO and Finance Lead",
    requiredRoles: ["ceo", "finance_lead"],
    appliesTo: ["finance", "grants", "staffing"],
    blocking: true,
    threshold: { financialImpactMin: 0.6 },
  },
  {
    id: "pol-board-material",
    key: "board.material_risk",
    description: "High-risk or material spend requires Board awareness/approval",
    requiredRoles: ["board"],
    appliesTo: ["finance", "compliance", "grants"],
    blocking: true,
    threshold: { riskMin: 60, financialImpactMin: 0.75 },
  },
  {
    id: "pol-founder-strategic",
    key: "founder.strategic",
    description: "Strategic hiring or grant pursuits may require Founder approval",
    requiredRoles: ["founder"],
    appliesTo: ["staffing", "grants"],
    blocking: false,
    threshold: { effortMin: 60 },
  },
  {
    id: "pol-compliance",
    key: "compliance.lead",
    description: "Compliance remediation requires Compliance Lead approval",
    requiredRoles: ["compliance_lead"],
    appliesTo: ["compliance", "grants"],
    blocking: true,
  },
  {
    id: "pol-enrollment",
    key: "enrollment.school_leader",
    description: "Enrollment campaigns require School Leader approval",
    requiredRoles: ["school_leader", "executive_director"],
    appliesTo: ["enrollment"],
    blocking: true,
  },
  {
    id: "pol-ops",
    key: "operations.executive_director",
    description: "Operational improvements require Executive Director approval",
    requiredRoles: ["executive_director"],
    appliesTo: ["operations"],
    blocking: true,
  },
];
