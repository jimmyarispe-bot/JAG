/**
 * Decision Center — Release Center (governance authority).
 */

import { getApprovalWorkflow } from "../../governance/approvals";
import { listReleases } from "../../store";
import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { ReleaseDecisionView } from "../types";

export function buildReleaseDecisionViews(
  root?: string,
  ctx?: DecisionEvidenceContext
): readonly ReleaseDecisionView[] {
  const c = ctx ?? buildDecisionEvidenceContext(root);

  return Object.freeze(
    c.products.map((p) => {
      const active =
        p.releaseStatus !== "Development" && p.certification !== "None";
      const releases = listReleases(p.id);
      const current = releases[0];
      const wf = getApprovalWorkflow({
        productId: p.id,
        releaseId: current?.id,
      });

      if (!active || p.id !== "academyos") {
        return {
          productId: p.id,
          currentRc: p.releaseStatus,
          remainingGates: Object.freeze([] as string[]),
          gateFailures: Object.freeze([] as string[]),
          approvalStatus: active ? "Not started" : "Not started",
          pendingReviews: Object.freeze([] as string[]),
          releaseRecommendation: active
            ? "Evaluate when advanced"
            : "Scaffold / Development",
          estimatedReadiness: active ? 10 : 0,
          ready: false,
          summary: `${p.name} is in ${p.releaseStatus}; release center idle.`,
        };
      }

      const gates = c.academyGates;
      const readiness = c.academyReadiness;
      const remainingGates = gates.gates
        .filter((g) => g.required && !g.passed)
        .map((g) => g.name);
      const gateFailures = gates.blockers;
      const pendingReviews = wf.steps
        .filter((s) => s.status === "Pending")
        .map((s) => s.role);
      const approvalStatus = wf.blocked
        ? "Rejected"
        : wf.complete
          ? "Approved"
          : wf.nextRole
            ? `Awaiting ${wf.nextRole}`
            : "Not started";

      let releaseRecommendation = "Hold";
      if (readiness.ready && wf.complete) releaseRecommendation = "Approve release";
      else if (readiness.ready) releaseRecommendation = "Complete approvals";
      else if (remainingGates.length <= 2)
        releaseRecommendation = "Clear remaining gates";
      else releaseRecommendation = "Continue hardening";

      return {
        productId: p.id,
        currentRc: current
          ? `${current.status} ${current.version}`
          : p.releaseStatus,
        remainingGates: Object.freeze(remainingGates),
        gateFailures: Object.freeze(gateFailures),
        approvalStatus,
        pendingReviews: Object.freeze(pendingReviews),
        releaseRecommendation,
        estimatedReadiness: readiness.readinessScore,
        ready: readiness.ready,
        summary: readiness.summary,
      };
    })
  );
}
