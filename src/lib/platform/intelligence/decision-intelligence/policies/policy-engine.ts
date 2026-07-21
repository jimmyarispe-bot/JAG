import type {
  DecisionApprovalLevel,
  DecisionOption,
  OrganizationalPolicy,
  PolicyFlag,
} from "@/lib/platform/intelligence/decision-intelligence/types";

const APPROVAL_RANK: Record<DecisionApprovalLevel, number> = {
  none: 0,
  manager: 1,
  executive: 2,
  board: 3,
};

export function evaluatePolicies(
  option: Pick<DecisionOption, "id" | "category" | "scorecard" | "title">,
  policies: OrganizationalPolicy[]
): { flags: PolicyFlag[]; approvalRequired: DecisionApprovalLevel } {
  const flags: PolicyFlag[] = [];
  let approval: DecisionApprovalLevel = "none";

  for (const policy of policies) {
    if (policy.blockedCategories?.includes(option.category)) {
      flags.push({
        id: `${policy.id}-block`,
        policy: policy.name,
        severity: "block",
        message: `"${option.title}" conflicts with policy ${policy.name}.`,
        requiresApproval: "board",
      });
      approval = maxApproval(approval, "board");
    }

    if (
      policy.maxFinancialImpact != null &&
      option.scorecard.financialImpact > policy.maxFinancialImpact
    ) {
      flags.push({
        id: `${policy.id}-budget`,
        policy: policy.name,
        severity: "warning",
        message: `Financial impact ${option.scorecard.financialImpact} exceeds budget threshold ${policy.maxFinancialImpact}.`,
        requiresApproval: policy.requiresApprovalAbove ?? "executive",
      });
      approval = maxApproval(approval, policy.requiresApprovalAbove ?? "executive");
    }

    if (policy.kind === "approval" && policy.requiresApprovalAbove) {
      if (option.scorecard.overall >= 70 || option.scorecard.financialImpact >= 70) {
        flags.push({
          id: `${policy.id}-approval`,
          policy: policy.name,
          severity: "info",
          message: `Governance policy requires ${policy.requiresApprovalAbove} approval before acting.`,
          requiresApproval: policy.requiresApprovalAbove,
        });
        approval = maxApproval(approval, policy.requiresApprovalAbove);
      }
    }

    if (policy.kind === "compliance") {
      flags.push({
        id: `${policy.id}-compliance`,
        policy: policy.name,
        severity: "info",
        message: policy.description ?? `Ensure compliance with ${policy.name}.`,
        requiresApproval: policy.requiresApprovalAbove ?? "manager",
      });
      approval = maxApproval(approval, policy.requiresApprovalAbove ?? "manager");
    }
  }

  // High-stakes defaults even without explicit policies
  if (option.scorecard.financialImpact >= 80 || option.scorecard.risk >= 75) {
    approval = maxApproval(approval, "executive");
    if (!flags.some((f) => f.id.endsWith("-high-stakes"))) {
      flags.push({
        id: `${option.id}-high-stakes`,
        policy: "High-stakes default",
        severity: "warning",
        message: "High financial impact or risk — executive review recommended.",
        requiresApproval: "executive",
      });
    }
  }

  return { flags, approvalRequired: approval };
}

function maxApproval(
  a: DecisionApprovalLevel,
  b: DecisionApprovalLevel
): DecisionApprovalLevel {
  return APPROVAL_RANK[a] >= APPROVAL_RANK[b] ? a : b;
}

export const DEFAULT_POLICIES: OrganizationalPolicy[] = [
  {
    id: "budget-cap",
    name: "Operating budget threshold",
    kind: "budget",
    maxFinancialImpact: 75,
    requiresApprovalAbove: "executive",
    description: "Spend above threshold requires executive approval",
  },
  {
    id: "board-material",
    name: "Board materiality",
    kind: "governance",
    maxFinancialImpact: 90,
    requiresApprovalAbove: "board",
    description: "Material commitments require board awareness",
  },
];
