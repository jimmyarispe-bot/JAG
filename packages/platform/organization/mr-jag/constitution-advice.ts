/**
 * Mr. JAG constitution reasoning — additive bridge; does not modify Help/Academy/Coach.
 */

import { getGovernanceProfile } from "../profiles/catalog";
import { getOrganization } from "../store";
import type { ConstitutionAdvice } from "../types";

export function adviseWithConstitution(input: {
  organizationId: string;
  action: string;
  domain?: string | null;
  amount?: number | null;
  currency?: string | null;
}): ConstitutionAdvice {
  const org = getOrganization(input.organizationId);
  if (!org) {
    return {
      organizationId: input.organizationId,
      allowed: false,
      reasons: Object.freeze(["Organization not found in Universal Organization Model."]),
      mrJagMessage:
        "I cannot advise yet — register this organization in the Universal Organization Model first.",
      applicableRules: Object.freeze([]),
    };
  }

  const c = org.constitution;
  const profile = getGovernanceProfile(c.legalStructure);
  const domain = (input.domain ?? "general").toLowerCase();
  const action = input.action.toLowerCase();
  const reasons: string[] = [];
  const rules: string[] = [...c.decisionMakingRules];
  let allowed = true;

  // Risk tolerance
  if (
    c.riskTolerance === "conservative" &&
    /\b(aggressive|speculate|high.?risk)\b/.test(action)
  ) {
    allowed = false;
    reasons.push(
      `Constitution risk tolerance is conservative; action "${input.action}" conflicts.`
    );
  }

  // Spending thresholds
  if (
    (domain === "spending" || /\b(spend|purchase|budget|pay)\b/.test(action)) &&
    input.amount != null
  ) {
    const thr = c.approvalThresholds.find((t) => t.domain === "spending");
    if (thr?.amount != null && input.amount > thr.amount) {
      if (thr.requiresBoard) {
        allowed = false;
        reasons.push(
          `Amount ${input.amount} exceeds spending threshold ${thr.amount}; board approval required.`
        );
        rules.push(thr.description);
      } else {
        reasons.push(
          `Amount ${input.amount} exceeds spending threshold ${thr.amount}; elevated approval required.`
        );
      }
    }
  }

  // Hiring
  if (domain === "hiring" || /\b(hire|recruit|headcount)\b/.test(action)) {
    rules.push(...c.hiringAuthority);
    reasons.push("Hiring must follow constitution hiring authority.");
  }

  // Public reporting orgs
  if (profile?.publicReporting && /\b(nondisclosure|hide|conceal)\b/.test(action)) {
    allowed = false;
    reasons.push("Public reporting obligations forbid concealing material information.");
  }

  // Strategy mode guidance
  if (
    c.strategyMode === "strategy_driven" &&
    /\b(new goal|set goal)\b/.test(action) &&
    !org.strategicPlan
  ) {
    reasons.push(
      "Strategy-driven mode: prefer aligning goals to an active strategic plan/objectives."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      `Action reviewed under ${profile?.title ?? c.legalStructure} constitution v${c.version}.`
    );
  }

  const mrJagMessage = allowed
    ? `I checked your Organizational Constitution (${profile?.title ?? c.legalStructure}). ${reasons[0]} Recommendation may proceed with stated rules.`
    : `I checked your Organizational Constitution (${profile?.title ?? c.legalStructure}). I recommend pausing: ${reasons.join(" ")}`;

  return {
    organizationId: input.organizationId,
    allowed,
    reasons: Object.freeze(reasons),
    mrJagMessage,
    applicableRules: Object.freeze([...new Set(rules)].slice(0, 12)),
  };
}
