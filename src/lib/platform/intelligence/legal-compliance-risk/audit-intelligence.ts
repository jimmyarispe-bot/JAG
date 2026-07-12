/**
 * Audit Intelligence — audit readiness and finding remediation.
 */

import type { AuditIntelligence as AuditIntelligenceContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  type AuditFindingRecord,
  type AuditFindingStatus,
  type AuditSuite,
  type ComplianceSuite,
  type LegalComplianceRiskBaseline,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

const AUDIT_AREAS = [
  "Financial controls",
  "Grant compliance",
  "Data protection",
  "Facility safety",
  "Procurement",
  "Governance",
];

export class AuditIntelligence implements AuditIntelligenceContract {
  assess(input: {
    baseline: LegalComplianceRiskBaseline;
    compliance: ComplianceSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): AuditSuite {
    const { baseline, compliance, now, createId } = input;
    const findings: AuditFindingRecord[] = AUDIT_AREAS.map((area, index) => {
      const severityScore = clamp(100 - baseline.auditReadiness + (index % 3) * 8 - compliance.coverageScore * 0.1);
      const status: AuditFindingStatus = severityScore < 40 ? "closed" : severityScore < 65 ? "remediating" : "open";
      const dueInDays = Math.round((100 - severityScore) * 1.5) - index * 10;
      const dueDate = new Date(now.getTime() + dueInDays * 86_400_000).toISOString();
      const overdue = dueInDays < 0 && status !== "closed";
      return {
        id: createId("lcr-audit"),
        title: `${area} finding`,
        area,
        severity: priorityFromScore(100 - severityScore),
        status,
        owner: index % 2 === 0 ? "compliance" : "operations",
        dueDate,
        overdue,
        narrative: `${area} finding is ${status}${overdue ? " (overdue)" : ""}; severity ${Math.round(severityScore)}.`,
      };
    });

    const openFindings = findings.filter((finding) => finding.status !== "closed").length;
    const overdueFindings = findings.filter((finding) => finding.overdue).length;
    const readinessScore = clamp(
      baseline.auditReadiness * 0.7 + (1 - openFindings / Math.max(1, findings.length)) * 30 - overdueFindings * 4
    );

    return {
      findings,
      readinessScore,
      openFindings,
      overdueFindings,
      narrative: `Audit readiness ${Math.round(readinessScore)}; ${openFindings} open findings, ${overdueFindings} overdue.`,
    };
  }
}
