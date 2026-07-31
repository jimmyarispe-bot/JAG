/**
 * ComplianceService — generic policies, requirements, obligations, findings, exceptions.
 */

import { randomUUID } from "node:crypto";
import {
  getComplianceRequirement,
  getRisk,
  listAuditFindings,
  listComplianceRequirements,
  listExceptions,
  listObligations,
  listPolicies,
  upsertAuditFinding,
  upsertComplianceRequirement,
  upsertException,
  upsertObligation,
  upsertPolicy,
  upsertRisk,
} from "@/lib/risk/store";
import { createRiskTimeline } from "@/lib/risk/timeline";
import type {
  ComplianceStatus,
  JagAuditFinding,
  JagComplianceRequirement,
  JagException,
  JagObligation,
  JagPolicy,
  RiskSeverity,
} from "@/lib/risk/types";

export type ComplianceService = {
  createPolicy(input: {
    organizationId: string;
    title: string;
    description: string;
    version?: string;
    owner?: string | null;
    effectiveDate?: string | null;
    reviewDate?: string | null;
    createdBy: string;
  }): JagPolicy | { error: string };
  listPolicies(organizationId: string): readonly JagPolicy[];

  createRequirement(input: {
    organizationId: string;
    title: string;
    description: string;
    policyId?: string | null;
    procedure?: string;
    requiredEvidence?: readonly string[];
    requiredReviews?: readonly string[];
    renewalDate?: string | null;
    status?: ComplianceStatus;
    owner?: string | null;
    relatedRiskIds?: readonly string[];
    createdBy: string;
  }): JagComplianceRequirement | { error: string };
  listRequirements(organizationId: string): readonly JagComplianceRequirement[];
  updateRequirementStatus(input: {
    organizationId: string;
    requirementId: string;
    status: ComplianceStatus;
    actor: string;
  }): JagComplianceRequirement | null;

  createObligation(input: {
    organizationId: string;
    title: string;
    description: string;
    source?: string;
    dueDate?: string | null;
    status?: ComplianceStatus;
    owner?: string | null;
    relatedRequirementId?: string | null;
    createdBy: string;
  }): JagObligation | { error: string };
  listObligations(organizationId: string): readonly JagObligation[];

  createFinding(input: {
    organizationId: string;
    title: string;
    description: string;
    severity?: RiskSeverity;
    relatedRiskId?: string | null;
    relatedRequirementId?: string | null;
    createdBy: string;
  }): JagAuditFinding | { error: string };
  listFindings(organizationId: string): readonly JagAuditFinding[];

  createException(input: {
    organizationId: string;
    title: string;
    rationale: string;
    relatedRiskId?: string | null;
    relatedRequirementId?: string | null;
    expiresAt?: string | null;
    approvedBy?: string | null;
    createdBy: string;
  }): JagException | { error: string };
  listExceptions(organizationId: string): readonly JagException[];
};

function refreshRequirementStatus(
  req: JagComplianceRequirement,
  now = new Date()
): ComplianceStatus {
  if (
    req.renewalDate &&
    Date.parse(req.renewalDate) < now.getTime() &&
    req.status !== "Compliant"
  ) {
    return "Overdue";
  }
  return req.status;
}

export function createComplianceService(): ComplianceService {
  const timeline = createRiskTimeline();

  return {
    createPolicy(input) {
      if (!input.title.trim()) return { error: "Policy title is required." };
      const now = new Date().toISOString();
      const policy: JagPolicy = {
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        version: input.version ?? "1.0.0",
        owner: input.owner ?? null,
        effectiveDate: input.effectiveDate ?? null,
        reviewDate: input.reviewDate ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };
      return upsertPolicy(policy);
    },
    listPolicies,

    createRequirement(input) {
      if (!input.title.trim()) {
        return { error: "Requirement title is required." };
      }
      const now = new Date().toISOString();
      let req: JagComplianceRequirement = {
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        policyId: input.policyId ?? null,
        procedure: input.procedure ?? "",
        requiredEvidence: Object.freeze([...(input.requiredEvidence ?? [])]),
        requiredReviews: Object.freeze([...(input.requiredReviews ?? [])]),
        renewalDate: input.renewalDate ?? null,
        status: input.status ?? "Not Assessed",
        owner: input.owner ?? null,
        relatedRiskIds: Object.freeze([...(input.relatedRiskIds ?? [])]),
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };
      req = {
        ...req,
        status: refreshRequirementStatus(req),
      };
      upsertComplianceRequirement(req);

      for (const riskId of req.relatedRiskIds) {
        const risk = getRisk(input.organizationId, riskId);
        if (!risk) continue;
        const complianceRequirementIds = Object.freeze([
          ...new Set([...risk.complianceRequirementIds, req.id]),
        ]);
        upsertRisk({
          ...risk,
          complianceRequirementIds,
          updatedAt: now,
        });
        timeline.record({
          organizationId: input.organizationId,
          riskId,
          kind: "compliance_linked",
          actor: input.createdBy,
          message: `Compliance requirement “${req.title}” linked.`,
          metadata: { requirementId: req.id },
        });
      }

      return req;
    },
    listRequirements: listComplianceRequirements,

    updateRequirementStatus(input) {
      const current = getComplianceRequirement(
        input.organizationId,
        input.requirementId
      );
      if (!current) return null;
      const next = {
        ...current,
        status: input.status,
        updatedAt: new Date().toISOString(),
      };
      return upsertComplianceRequirement(next);
    },

    createObligation(input) {
      if (!input.title.trim()) return { error: "Obligation title is required." };
      const now = new Date().toISOString();
      return upsertObligation({
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        source: input.source ?? "Internal",
        dueDate: input.dueDate ?? null,
        status: input.status ?? "Not Assessed",
        owner: input.owner ?? null,
        relatedRequirementId: input.relatedRequirementId ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
    },
    listObligations,

    createFinding(input) {
      if (!input.title.trim()) return { error: "Finding title is required." };
      const now = new Date().toISOString();
      return upsertAuditFinding({
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        severity: input.severity ?? "Medium",
        status: "Planned",
        relatedRiskId: input.relatedRiskId ?? null,
        relatedRequirementId: input.relatedRequirementId ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
    },
    listFindings: listAuditFindings,

    createException(input) {
      if (!input.title.trim()) return { error: "Exception title is required." };
      const now = new Date().toISOString();
      return upsertException({
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        rationale: input.rationale.trim(),
        relatedRiskId: input.relatedRiskId ?? null,
        relatedRequirementId: input.relatedRequirementId ?? null,
        expiresAt: input.expiresAt ?? null,
        approvedBy: input.approvedBy ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
    },
    listExceptions,
  };
}
