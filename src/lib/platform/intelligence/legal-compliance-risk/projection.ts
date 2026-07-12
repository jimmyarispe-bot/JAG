/**
 * Legal, Compliance & Risk Intelligence — projection and queries.
 */

import type {
  LegalComplianceRiskProjection as LegalComplianceRiskProjectionContract,
  LegalComplianceRiskQueries as LegalComplianceRiskQueriesContract,
} from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import type {
  LegalComplianceRiskProjectionResult,
  LegalComplianceRiskQueryRequest,
  LegalComplianceRiskQueryResult,
  LegalComplianceRiskResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export class LegalComplianceRiskProjection implements LegalComplianceRiskProjectionContract {
  project(input: Parameters<LegalComplianceRiskProjectionContract["project"]>[0]): LegalComplianceRiskProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      complianceHealthScore: input.scores.complianceHealthScore.value,
      riskScore: input.scores.riskScore.value,
      contractScore: input.scores.contractScore.value,
      regulatoryScore: input.scores.regulatoryScore.value,
      policyScore: input.scores.policyScore.value,
      auditScore: input.scores.auditScore.value,
      licensePermitScore: input.scores.licensePermitScore.value,
      insuranceScore: input.scores.insuranceScore.value,
      litigationScore: input.scores.litigationScore.value,
      vendorRiskScore: input.scores.vendorRiskScore.value,
      cyberGovernanceScore: input.scores.cyberGovernanceScore.value,
      dashboard: input.dashboard,
      enterpriseRiskDashboard: input.enterpriseRiskDashboard,
      complianceDashboard: input.complianceDashboard,
      brief: input.brief,
      metrics: {
        contractCount: input.baseline.contractCount,
        obligationCount: input.baseline.obligationCount,
        riskPressure: input.baseline.riskPressure,
        complianceCoverage: input.baseline.complianceCoverage,
        litigationExposure: input.baseline.litigationExposure,
        vendorRiskPressure: input.baseline.vendorRiskPressure,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class LegalComplianceRiskQueries implements LegalComplianceRiskQueriesContract {
  ask(result: LegalComplianceRiskResult, request: LegalComplianceRiskQueryRequest): LegalComplianceRiskQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer: string;
    let references: string[];

    switch (focus) {
      case "contracts":
        answer = result.contracts.narrative;
        references = result.contracts.contracts.slice(0, max).map((contract) => contract.narrative);
        break;
      case "regulatory":
        answer = result.regulatory.narrative;
        references = result.regulatory.requirements.slice(0, max).map((requirement) => requirement.narrative);
        break;
      case "compliance":
        answer = result.compliance.narrative;
        references = result.compliance.obligations.slice(0, max).map((obligation) => obligation.narrative);
        break;
      case "risk":
        answer = result.enterpriseRisk.narrative;
        references = result.risks.slice(0, max).map((risk) => risk.narrative);
        break;
      case "policy":
        answer = result.policy.narrative;
        references = result.policy.policies.slice(0, max).map((policy) => policy.narrative);
        break;
      case "audit":
        answer = result.audit.narrative;
        references = result.audit.findings.slice(0, max).map((finding) => finding.narrative);
        break;
      case "licenses":
        answer = result.licensePermit.narrative;
        references = result.licensePermit.records.slice(0, max).map((record) => record.narrative);
        break;
      case "insurance":
        answer = result.insurance.narrative;
        references = result.insurance.policies.slice(0, max).map((policy) => policy.narrative);
        break;
      case "litigation":
        answer = result.litigation.narrative;
        references = result.litigation.matters.slice(0, max).map((matter) => matter.narrative);
        break;
      case "vendor":
        answer = result.vendorRisk.narrative;
        references = result.vendorRisk.vendors.slice(0, max).map((vendor) => vendor.narrative);
        break;
      case "cyber":
        answer = result.cyberGovernance.narrative;
        references = result.cyberGovernance.controls.slice(0, max).map((control) => control.narrative);
        break;
      case "corrective":
        answer = result.correctiveActionPlan.narrative;
        references = result.correctiveActions.slice(0, max).map((action) => action.title);
        break;
      case "reasoning":
        answer = result.reasoning.answer;
        references = result.reasoning.connectedObligations.slice(0, max);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((recommendation) => recommendation.title);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.55 : 0.82 },
      ]),
    };
  }
}
