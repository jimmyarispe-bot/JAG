/**
 * Executive governance dashboard — readiness, blockers, compliance, trends.
 */

import { listCertifications } from "../certification/engine";
import { createProductRegistryService } from "../products/registry";
import { evaluatePolicies } from "../policies/engine";
import { computeProductQualityScore } from "../quality/scorer";
import { evaluateReleaseGates } from "../releases/gates";
import { getApprovalWorkflow, listApprovals } from "./approvals";

export type GovernanceDashboard = {
  readonly generatedAt: string;
  readonly productsAwaitingApproval: readonly {
    readonly productId: string;
    readonly nextRole: string;
    readonly stage: string;
  }[];
  readonly blockedReleases: readonly {
    readonly productId: string;
    readonly blockers: readonly string[];
    readonly stage: string;
  }[];
  readonly certificationProgress: readonly {
    readonly productId: string;
    readonly stage: string;
    readonly version: string;
    readonly certification: string;
    readonly blockerCount: number;
    readonly signedArtifacts: number;
  }[];
  readonly policyCompliance: readonly {
    readonly productId: string;
    readonly compliancePercent: number;
    readonly passedRequired: boolean;
  }[];
  readonly qualityTrends: readonly {
    readonly productId: string;
    readonly overall: number;
  }[];
  readonly openCriticalIssues: readonly {
    readonly productId: string;
    readonly issue: string;
  }[];
};

export function buildGovernanceDashboard(root?: string): GovernanceDashboard {
  const products = createProductRegistryService().list();
  const certs = listCertifications(root);

  const productsAwaitingApproval = products
    .map((p) => {
      const wf = getApprovalWorkflow({ productId: p.id });
      if (!wf.nextRole || wf.complete || wf.blocked) return null;
      return {
        productId: p.id,
        nextRole: wf.nextRole,
        stage: p.releaseStatus,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const blockedReleases = certs
    .filter((c) => c.outstandingBlockers.length > 0)
    .map((c) => ({
      productId: c.productId,
      blockers: c.outstandingBlockers,
      stage: c.releaseStage,
    }));

  // Also include approval-blocked
  for (const p of products) {
    const wf = getApprovalWorkflow({ productId: p.id });
    if (wf.blocked && !blockedReleases.some((b) => b.productId === p.id)) {
      blockedReleases.push({
        productId: p.id,
        blockers: Object.freeze(["Approval workflow rejected"]),
        stage: p.releaseStatus,
      });
    }
  }

  const certificationProgress = certs.map((c) => {
    const product = products.find((p) => p.id === c.productId);
    return {
      productId: c.productId,
      stage: c.releaseStage,
      version: c.currentVersion,
      certification: product?.certification ?? "None",
      blockerCount: c.outstandingBlockers.length,
      signedArtifacts: c.signedArtifacts.length,
    };
  });

  const policyCompliance = products.map((p) => {
    const report = evaluatePolicies({ productId: p.id, root });
    return {
      productId: p.id,
      compliancePercent: report.compliancePercent,
      passedRequired: report.passedRequired,
    };
  });

  const qualityTrends = products.map((p) => ({
    productId: p.id,
    overall: computeProductQualityScore({ productId: p.id, root }).overall,
  }));

  const openCriticalIssues: { productId: string; issue: string }[] = [];
  for (const p of products) {
    const gates = evaluateReleaseGates({
      productId: p.id,
      targetStage: p.releaseStatus,
      root,
    });
    for (const b of gates.blockers.slice(0, 5)) {
      openCriticalIssues.push({ productId: p.id, issue: b });
    }
  }

  void listApprovals;

  return {
    generatedAt: new Date().toISOString(),
    productsAwaitingApproval: Object.freeze(productsAwaitingApproval),
    blockedReleases: Object.freeze(blockedReleases),
    certificationProgress: Object.freeze(certificationProgress),
    policyCompliance: Object.freeze(policyCompliance),
    qualityTrends: Object.freeze(qualityTrends),
    openCriticalIssues: Object.freeze(openCriticalIssues),
  };
}

export function createGovernanceService() {
  return {
    dashboard: buildGovernanceDashboard,
  };
}
