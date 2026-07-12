/**
 * Legal, Compliance & Risk Intelligence — scores, health, dashboards, briefs,
 * corrective-action planning, and risk/opportunity/recommendation analyzers.
 */

import type {
  BoardComplianceBriefGenerator as BoardComplianceBriefGeneratorContract,
  CorrectiveActionPlanner as CorrectiveActionPlannerContract,
  ExecutiveRiskBriefGenerator as ExecutiveRiskBriefGeneratorContract,
  LegalComplianceRiskDashboard as LegalComplianceRiskDashboardContract,
  LegalComplianceRiskHealth as LegalComplianceRiskHealthContract,
  LegalComplianceRiskIntelligence as LegalComplianceRiskIntelligenceContract,
  LegalComplianceRiskOpportunityAnalyzer as LegalComplianceRiskOpportunityAnalyzerContract,
  LegalComplianceRiskRecommendationComposer as LegalComplianceRiskRecommendationComposerContract,
  LegalComplianceRiskRiskAnalyzer as LegalComplianceRiskRiskAnalyzerContract,
  LegalComplianceRiskSpecializedDashboards as LegalComplianceRiskSpecializedDashboardsContract,
} from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import {
  buildConfidence,
  buildLens,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/legal-compliance-risk/models";
import type {
  AuditDashboardResult,
  BoardComplianceBrief,
  ComplianceDashboardResult,
  ContractDashboardResult,
  CorrectiveActionPlanResult,
  EnterpriseRiskDashboardResult,
  EnterpriseRiskRecordSummary,
  ExecutiveRiskBrief,
  LegalComplianceRiskBaseline,
  LegalComplianceRiskConfidenceScore,
  LegalComplianceRiskDashboardResult,
  LegalComplianceRiskHealthResult,
  LegalComplianceRiskOpportunityRecord,
  LegalComplianceRiskRecommendationRecord,
  LegalComplianceRiskScore,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

type ScoreBundle = ReturnType<LegalComplianceRiskIntelligenceContract["composeScores"]>;

export function defaultLegalComplianceRiskConfidence(input: {
  baseline: LegalComplianceRiskBaseline;
  compliance: { coverageScore: number };
  contracts: { coverageScore: number };
  enterpriseRisk: { overallRiskPressure: number };
}): LegalComplianceRiskConfidenceScore {
  return buildConfidence([
    { key: "compliance", label: "Compliance coverage", contribution: input.compliance.coverageScore / 100 },
    { key: "contracts", label: "Contract coverage", contribution: input.contracts.coverageScore / 100 },
    { key: "risk", label: "Risk containment", contribution: 1 - input.enterpriseRisk.overallRiskPressure / 100 },
    { key: "baseline", label: "Organization health", contribution: input.baseline.organizationHealthScore / 100 },
  ]);
}

export class LegalComplianceRiskIntelligence implements LegalComplianceRiskIntelligenceContract {
  composeScores(input: Parameters<LegalComplianceRiskIntelligenceContract["composeScores"]>[0]): ScoreBundle {
    const contractValue = clamp(input.contracts.coverageScore);
    const regulatoryValue = clamp(input.regulatory.coverageScore);
    const complianceValue = clamp(input.compliance.coverageScore);
    const riskPressure = clamp(input.enterpriseRisk.overallRiskPressure);
    const policyValue = clamp(input.policy.coverageScore);
    const auditValue = clamp(input.audit.readinessScore);
    const licensePermitValue = clamp(input.licensePermit.monitoringScore);
    const insuranceValue = clamp(input.insurance.adequacyScore);
    const litigationValue = clamp(input.litigation.exposureScore);
    const vendorValue = clamp(input.vendorRisk.coverageScore);
    const cyberValue = clamp(input.cyberGovernance.postureScore);
    const knowledgeValue = clamp(input.knowledgeContribution.contributionScore);
    const healthValue = clamp(
      complianceValue * 0.16 +
        contractValue * 0.1 +
        regulatoryValue * 0.1 +
        policyValue * 0.08 +
        auditValue * 0.08 +
        licensePermitValue * 0.07 +
        insuranceValue * 0.06 +
        litigationValue * 0.07 +
        vendorValue * 0.06 +
        cyberValue * 0.08 +
        (100 - riskPressure) * 0.14
    );
    void input.reasoning;
    void input.risks;
    void input.opportunities;
    return {
      healthScore: score("lcr_health", "Legal Compliance Risk Health Score", healthValue),
      complianceHealthScore: score("lcr_compliance_health", "Compliance Health Score", complianceValue),
      riskScore: riskScore(riskPressure),
      contractScore: score("lcr_contract", "Contract Score", contractValue),
      regulatoryScore: score("lcr_regulatory", "Regulatory Score", regulatoryValue),
      policyScore: score("lcr_policy", "Policy Score", policyValue),
      auditScore: score("lcr_audit", "Audit Readiness Score", auditValue),
      licensePermitScore: score("lcr_license_permit", "License & Permit Score", licensePermitValue),
      insuranceScore: score("lcr_insurance", "Insurance Adequacy Score", insuranceValue),
      litigationScore: score("lcr_litigation", "Litigation Exposure Score", litigationValue),
      vendorRiskScore: score("lcr_vendor", "Vendor Risk Score", vendorValue),
      cyberGovernanceScore: score("lcr_cyber", "Cyber Governance Score", cyberValue),
      knowledgeScore: score("lcr_knowledge", "Knowledge Contribution Score", knowledgeValue),
    };
  }
}

export class LegalComplianceRiskHealth implements LegalComplianceRiskHealthContract {
  assess(input: Parameters<LegalComplianceRiskHealthContract["assess"]>[0]): LegalComplianceRiskHealthResult {
    const dimensions: Record<string, number> = {
      compliance: input.scores.complianceHealthScore.value,
      contract: input.scores.contractScore.value,
      regulatory: input.scores.regulatoryScore.value,
      policy: input.scores.policyScore.value,
      audit: input.scores.auditScore.value,
      riskResilience: 100 - input.scores.riskScore.value,
      licensePermit: input.scores.licensePermitScore.value,
      insurance: input.scores.insuranceScore.value,
      cyber: input.scores.cyberGovernanceScore.value,
    };
    const overallScore = clamp(
      Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLens({
        regulationOrPolicyApplies: `Weakest scope ${input.compliance.weakestScope} governs remediation.`,
        evidenceSupports: `Compliance coverage ${Math.round(input.compliance.coverageScore)} and ${input.enterpriseRisk.narrative}`,
        confidence: `Organization health ${Math.round(input.baseline.organizationHealthScore)}.`,
        organizationalRisk: `Overall risk pressure ${Math.round(input.scores.riskScore.value)}.`,
        ifNoActionTaken: `${input.enterpriseRisk.hottestCategory} risk escalates without action.`,
        correctiveActionRecommended: `Prioritize ${input.compliance.weakestScope} obligations and ${input.enterpriseRisk.hottestCategory} mitigation.`,
        whoOwnsAction: "compliance",
        whenShouldComplete: input.licensePermit.nextExpiration ?? "Within current planning cycle.",
      }),
      narrative: `Legal/compliance/risk health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class LegalComplianceRiskDashboard implements LegalComplianceRiskDashboardContract {
  compose(input: Parameters<LegalComplianceRiskDashboardContract["compose"]>[0]): LegalComplianceRiskDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Compliance health ${Math.round(input.scores.complianceHealthScore.value)} - ${input.scores.complianceHealthScore.status}`,
      overall: input.scores.healthScore.value,
      complianceHealthScore: input.scores.complianceHealthScore.value,
      riskScore: input.scores.riskScore.value,
      contractScore: input.scores.contractScore.value,
      regulatoryScore: input.scores.regulatoryScore.value,
      policyScore: input.scores.policyScore.value,
      auditScore: input.scores.auditScore.value,
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      narrative: `Governance dashboard: compliance ${Math.round(input.scores.complianceHealthScore.value)}, risk ${Math.round(input.scores.riskScore.value)}, contracts ${Math.round(input.scores.contractScore.value)}.`,
    };
  }
}

export class LegalComplianceRiskSpecializedDashboards
  implements LegalComplianceRiskSpecializedDashboardsContract
{
  enterpriseRisk(input: Parameters<LegalComplianceRiskSpecializedDashboardsContract["enterpriseRisk"]>[0]): EnterpriseRiskDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Enterprise risk pressure ${Math.round(input.enterpriseRisk.overallRiskPressure)} - hottest ${input.enterpriseRisk.hottestCategory}`,
      overallRiskPressure: input.enterpriseRisk.overallRiskPressure,
      byCategory: input.enterpriseRisk.byCategory,
      hottestCategory: input.enterpriseRisk.hottestCategory,
      topRisks: Object.values(input.enterpriseRisk.risks)
        .flat()
        .sort((a, b) => b.residualScore - a.residualScore)
        .slice(0, 5)
        .map((risk) => risk.title),
      narrative: input.enterpriseRisk.narrative,
    };
  }

  compliance(input: Parameters<LegalComplianceRiskSpecializedDashboardsContract["compliance"]>[0]): ComplianceDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      complianceCoverage: input.compliance.coverageScore,
      byScope: input.compliance.byScope,
      weakestScope: input.compliance.weakestScope,
      openObligations: input.compliance.obligations.filter((obligation) => obligation.status !== "compliant").length,
      narrative: input.compliance.narrative,
    };
  }

  contracts(input: Parameters<LegalComplianceRiskSpecializedDashboardsContract["contracts"]>[0]): ContractDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      contractCount: input.contracts.contracts.length,
      coverageScore: input.contracts.coverageScore,
      expiringSoon: input.contracts.expiringSoon.length,
      missingClauses: input.contracts.missingClauses,
      autoRenewRisk: input.contracts.autoRenewRisk,
      narrative: input.contracts.narrative,
    };
  }

  audit(input: Parameters<LegalComplianceRiskSpecializedDashboardsContract["audit"]>[0]): AuditDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      readinessScore: input.audit.readinessScore,
      openFindings: input.audit.openFindings,
      overdueFindings: input.audit.overdueFindings,
      narrative: input.audit.narrative,
    };
  }
}

export class LegalComplianceRiskRiskAnalyzer implements LegalComplianceRiskRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<LegalComplianceRiskRiskAnalyzerContract["analyze"]>[0]): EnterpriseRiskRecordSummary[] {
    return Object.values(input.enterpriseRisk.risks)
      .flat()
      .map((risk) => ({
        id: this.createId("lcr-risk-summary"),
        title: risk.title,
        category: risk.category,
        severity: priorityFromRisk(risk.residualScore / 100),
        score: risk.residualScore,
        mitigation: risk.mitigation,
        lenses: risk.lenses,
        narrative: risk.narrative,
      }))
      .sort((left, right) => right.score - left.score);
  }
}

export class LegalComplianceRiskOpportunityAnalyzer
  implements LegalComplianceRiskOpportunityAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<LegalComplianceRiskOpportunityAnalyzerContract["analyze"]>[0]): LegalComplianceRiskOpportunityRecord[] {
    return [
      opportunity(this.createId, `Close ${input.compliance.weakestScope} compliance gap`, priorityFromScore(input.compliance.byScope[input.compliance.weakestScope]), clamp(100 - input.compliance.coverageScore + 45), "compliance"),
      opportunity(this.createId, "Remediate missing contract clauses", priorityFromScore(input.contracts.coverageScore), clamp(100 - input.contracts.coverageScore + 48), "legal"),
      opportunity(this.createId, "Publish compliance & risk knowledge drafts", priorityFromScore(input.knowledgeContribution.contributionScore), clamp(100 - input.knowledgeContribution.contributionScore + 46), "knowledge"),
    ].sort((left, right) => right.score - left.score);
  }
}

export class LegalComplianceRiskRecommendationComposer
  implements LegalComplianceRiskRecommendationComposerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: Parameters<LegalComplianceRiskRecommendationComposerContract["compose"]>[0]): LegalComplianceRiskRecommendationRecord[] {
    const now = input.now;
    const dueSoon = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    const dueMedium = new Date(now.getTime() + 60 * 86_400_000).toISOString();
    const recommendations: LegalComplianceRiskRecommendationRecord[] = [];

    const topRisk = input.risks[0];
    if (topRisk) {
      recommendations.push({
        id: this.createId("lcr-rec"),
        title: `Mitigate ${topRisk.category} exposure`,
        priority: topRisk.severity,
        regulationOrPolicyRef: topRisk.lenses.regulationOrPolicyApplies,
        evidenceRefs: [`risk:${topRisk.id}`],
        confidenceScore: clamp(input.baseline.executionScore),
        riskScore: topRisk.score,
        owner: topRisk.lenses.whoOwnsAction,
        dueDate: dueSoon,
        rationale: topRisk.narrative,
        correctiveAction: topRisk.mitigation,
        lenses: topRisk.lenses,
        narrative: `Prioritize ${topRisk.category} remediation before it escalates.`,
      });
    }

    const weakScope = input.compliance.weakestScope;
    const weakObligation = input.compliance.obligations.find((obligation) => obligation.scope === weakScope);
    recommendations.push({
      id: this.createId("lcr-rec"),
      title: `Close ${weakScope} compliance gap`,
      priority: priorityFromScore(input.compliance.byScope[weakScope]),
      regulationOrPolicyRef: `${weakScope} regulatory requirements`,
      evidenceRefs: weakObligation?.evidenceRefs ?? [`scope:${weakScope}`],
      confidenceScore: clamp(input.compliance.coverageScore),
      riskScore: clamp(100 - input.compliance.byScope[weakScope]),
      owner: weakObligation?.owner ?? "compliance",
      dueDate: weakObligation?.dueDate ?? dueMedium,
      rationale: `${weakScope} coverage is the weakest compliance scope.`,
      correctiveAction: `Assemble evidence and remediate ${weakScope} obligations.`,
      lenses: buildLens({
        regulationOrPolicyApplies: `${weakScope} regulatory requirements`,
        evidenceSupports: (weakObligation?.evidenceRefs ?? []).join(", ") || `scope:${weakScope}`,
        confidence: `Compliance coverage ${Math.round(input.compliance.coverageScore)}.`,
        organizationalRisk: `Compliance gap pressure ${Math.round(input.compliance.gapPressure * 100)}.`,
        ifNoActionTaken: `${weakScope} non-compliance risks penalties and funding loss.`,
        correctiveActionRecommended: `Remediate ${weakScope} obligations with documented evidence.`,
        whoOwnsAction: weakObligation?.owner ?? "compliance",
        whenShouldComplete: weakObligation?.dueDate ?? dueMedium,
      }),
      narrative: `Close ${weakScope} compliance gap with owned corrective actions.`,
    });

    if (input.contracts.missingClauses.length > 0) {
      const contract = input.contracts.expiringSoon[0] ?? input.contracts.contracts[0];
      recommendations.push({
        id: this.createId("lcr-rec"),
        title: "Remediate missing contract clauses",
        priority: priorityFromScore(input.contracts.coverageScore),
        regulationOrPolicyRef: "Contract obligations & procurement policy",
        evidenceRefs: input.contracts.missingClauses.slice(0, 4),
        confidenceScore: clamp(input.contracts.coverageScore),
        riskScore: clamp(100 - input.contracts.coverageScore),
        owner: contract?.owner ?? "legal",
        dueDate: contract?.expiresAt ?? dueMedium,
        rationale: `${input.contracts.missingClauses.length} contract clauses are missing.`,
        correctiveAction: "Add missing clauses and re-execute affected agreements.",
        lenses: buildLens({
          regulationOrPolicyApplies: "Contract obligations & procurement policy",
          evidenceSupports: input.contracts.missingClauses.slice(0, 3).join(", "),
          confidence: `Contract coverage ${Math.round(input.contracts.coverageScore)}.`,
          organizationalRisk: "Unprotected contract terms increase legal exposure.",
          ifNoActionTaken: "Missing clauses leave the organization contractually exposed.",
          correctiveActionRecommended: "Add missing clauses and re-execute agreements.",
          whoOwnsAction: contract?.owner ?? "legal",
          whenShouldComplete: contract?.expiresAt ?? dueMedium,
        }),
        narrative: "Remediate missing contract clauses to reduce legal exposure.",
      });
    }

    for (const record of input.opportunities.slice(0, 2)) {
      recommendations.push({
        id: this.createId("lcr-rec"),
        title: record.title,
        priority: record.priority,
        regulationOrPolicyRef: record.lenses.regulationOrPolicyApplies,
        evidenceRefs: [`opportunity:${record.id}`],
        confidenceScore: clamp(record.score),
        riskScore: clamp(100 - record.score),
        owner: record.lenses.whoOwnsAction,
        dueDate: dueMedium,
        rationale: record.narrative,
        correctiveAction: record.lenses.correctiveActionRecommended,
        lenses: record.lenses,
        narrative: record.narrative,
      });
    }

    return recommendations.sort((left, right) => right.riskScore - left.riskScore).slice(0, 8);
  }
}

export class CorrectiveActionPlanner implements CorrectiveActionPlannerContract {
  plan(input: Parameters<CorrectiveActionPlannerContract["plan"]>[0]): CorrectiveActionPlanResult {
    const correctiveActions = input.recommendations;
    const criticalCount = correctiveActions.filter((action) => action.priority === "critical").length;
    const planScore = clamp(
      correctiveActions.length === 0
        ? 0
        : correctiveActions.reduce((sum, action) => sum + action.confidenceScore, 0) / correctiveActions.length
    );
    return {
      generatedAt: input.now.toISOString(),
      correctiveActions,
      planScore,
      criticalCount,
      narrative: `Corrective action plan with ${correctiveActions.length} actions (${criticalCount} critical); plan confidence ${Math.round(planScore)}.`,
    };
  }
}

export class ExecutiveRiskBriefGenerator implements ExecutiveRiskBriefGeneratorContract {
  generate(input: Parameters<ExecutiveRiskBriefGeneratorContract["generate"]>[0]): ExecutiveRiskBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Compliance health ${Math.round(input.scores.complianceHealthScore.value)} - hottest risk ${input.enterpriseRisk.hottestCategory}`,
      summary:
        input.request.question ??
        "Where are our largest legal, compliance, and enterprise-risk exposures, and what corrective actions should leadership take?",
      complianceHealthScore: input.scores.complianceHealthScore.value,
      riskScore: input.scores.riskScore.value,
      contractScore: input.scores.contractScore.value,
      auditScore: input.scores.auditScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((recommendation) => recommendation.title),
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      hottestRiskCategory: input.enterpriseRisk.hottestCategory,
      lenses: buildLens({
        regulationOrPolicyApplies: "Enterprise risk & compliance governance.",
        evidenceSupports: `Confidence ${input.confidence.level}.`,
        confidence: `Confidence ${input.confidence.level}.`,
        organizationalRisk: `Risk pressure ${Math.round(input.scores.riskScore.value)}.`,
        ifNoActionTaken: `${input.enterpriseRisk.hottestCategory} risk escalates.`,
        correctiveActionRecommended: `${input.recommendations.length} corrective actions prepared.`,
        whoOwnsAction: "executive",
        whenShouldComplete: "Refresh each reporting period.",
      }),
      narrative: `Executive risk brief: compliance ${Math.round(input.scores.complianceHealthScore.value)}, risk ${Math.round(input.scores.riskScore.value)}, confidence ${input.confidence.level}.`,
    };
  }
}

export class BoardComplianceBriefGenerator implements BoardComplianceBriefGeneratorContract {
  generate(input: Parameters<BoardComplianceBriefGeneratorContract["generate"]>[0]): BoardComplianceBrief {
    const openObligations = input.compliance.obligations.filter((obligation) => obligation.status !== "compliant");
    return {
      generatedAt: input.now.toISOString(),
      headline: `Board compliance ${Math.round(input.scores.complianceHealthScore.value)} - weakest ${input.compliance.weakestScope}`,
      summary:
        input.request.question ??
        "How compliant is the organization across all regulatory and policy scopes, and what does the board need to act on?",
      complianceHealthScore: input.scores.complianceHealthScore.value,
      weakestScope: input.compliance.weakestScope,
      openObligations: openObligations.length,
      topObligations: openObligations.slice(0, 5).map((obligation) => `${obligation.scope}: ${obligation.requirement}`),
      correctiveActions: input.recommendations.slice(0, 5).map((recommendation) => recommendation.title),
      lenses: buildLens({
        regulationOrPolicyApplies: `Board policies and ${input.compliance.weakestScope} requirements.`,
        evidenceSupports: `Compliance coverage ${Math.round(input.compliance.coverageScore)}.`,
        confidence: `Coverage ${Math.round(input.compliance.coverageScore)}.`,
        organizationalRisk: `${openObligations.length} open obligations.`,
        ifNoActionTaken: "Board-level compliance exposure grows.",
        correctiveActionRecommended: `${input.recommendations.length} corrective actions recommended.`,
        whoOwnsAction: "governance",
        whenShouldComplete: "Review at next board meeting.",
      }),
      narrative: `Board compliance brief: coverage ${Math.round(input.compliance.coverageScore)} with ${openObligations.length} open obligations.`,
    };
  }
}

function score(key: string, label: string, value: number): LegalComplianceRiskScore {
  const normalized = clamp(value);
  const status = statusFromScore(normalized);
  return {
    key,
    label,
    value: normalized,
    status,
    band: priorityFromScore(normalized),
    narrative: scoreNarrative(label, normalized, status),
  };
}

function riskScore(value: number): LegalComplianceRiskScore {
  const normalized = clamp(value);
  return {
    key: "lcr_risk",
    label: "Risk Health Score",
    value: normalized,
    status: statusFromScore(100 - normalized),
    band: priorityFromRisk(normalized / 100),
    narrative: `Enterprise risk is ${priorityFromRisk(normalized / 100)} at ${Math.round(normalized)}.`,
  };
}

function opportunity(
  createId: (prefix: string) => string,
  title: string,
  priority: LegalComplianceRiskOpportunityRecord["priority"],
  scoreValue: number,
  owner: string
): LegalComplianceRiskOpportunityRecord {
  return {
    id: createId("lcr-opp"),
    title,
    priority,
    score: scoreValue,
    expectedValue: Math.round(scoreValue * 2),
    lenses: buildLens({
      regulationOrPolicyApplies: "Compliance & risk governance policy.",
      evidenceSupports: title,
      confidence: "Derived from baseline coverage signals.",
      organizationalRisk: "Reduces compliance, contractual, or knowledge gaps.",
      ifNoActionTaken: "Opportunity value is left unrealized.",
      correctiveActionRecommended: title,
      whoOwnsAction: owner,
      whenShouldComplete: "Within current planning cycle.",
    }),
    narrative: title,
  };
}
