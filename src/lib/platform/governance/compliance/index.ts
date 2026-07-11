/**
 * Enterprise Governance — compliance.
 */

import type {
  GovernanceComplianceFinding,
  GovernanceCycleRequest,
  GovernancePolicy,
} from "@/lib/platform/governance/types";

export interface GovernanceComplianceDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceCompliance {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceComplianceFinding>();

  constructor(dependencies: GovernanceComplianceDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  evaluate(
    request: GovernanceCycleRequest,
    policies: readonly GovernancePolicy[]
  ): GovernanceComplianceFinding[] {
    const findings: GovernanceComplianceFinding[] = [];
    const missionPolicy = policies.find((p) => p.domain === "mission" && p.active);
    const financialPolicy = policies.find((p) => p.domain === "financial" && p.active);

    const criticalAlerts =
      request.organization?.alerts.filter(
        (a) => a.severity === "critical" || a.severity === "high"
      ) ?? [];

    if (criticalAlerts.length > 0 && financialPolicy) {
      findings.push(
        this.record({
          title: "Financial / operational compliance pressure",
          description: `${criticalAlerts.length} priority alert(s) require policy-aligned remediation`,
          status: "at_risk",
          domain: "financial",
          policyId: financialPolicy.policyId,
          severity: "high",
          remediation: "Route through approval chain and document remediation evidence",
        })
      );
    }

    if (
      request.autonomy?.diagnosis.causes.some((c) => c.kind === "compliance_risk") &&
      missionPolicy
    ) {
      findings.push(
        this.record({
          title: "Mission / compliance risk diagnosed",
          description: request.autonomy.diagnosis.summary,
          status: "non_compliant",
          domain: "mission",
          policyId: missionPolicy.policyId,
          severity: "critical",
          remediation: "Board/committee oversight required before autonomous execution",
        })
      );
    }

    if (findings.length === 0) {
      findings.push(
        this.record({
          title: "No material compliance exceptions",
          description: `Cycle "${request.subject}" within active policy envelope`,
          status: "compliant",
          domain: "operational",
          policyId: null,
          severity: "low",
          remediation: "Continue monitoring",
        })
      );
    }

    return findings;
  }

  record(input: {
    title: string;
    description: string;
    status: GovernanceComplianceFinding["status"];
    domain: GovernanceComplianceFinding["domain"];
    policyId: string | null;
    severity: GovernanceComplianceFinding["severity"];
    remediation: string;
    dueDate?: string | null;
  }): GovernanceComplianceFinding {
    const finding: GovernanceComplianceFinding = {
      findingId: this.createId("finding"),
      title: input.title,
      description: input.description,
      status: input.status,
      domain: input.domain,
      policyId: input.policyId,
      severity: input.severity,
      remediation: input.remediation,
      dueDate: input.dueDate ?? null,
      createdAt: this.now().toISOString(),
    };
    this.store.set(finding.findingId, finding);
    return finding;
  }

  list(): readonly GovernanceComplianceFinding[] {
    return Array.from(this.store.values());
  }
}
