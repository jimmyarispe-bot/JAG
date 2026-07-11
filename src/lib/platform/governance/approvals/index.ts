/**
 * Enterprise Governance — approvals.
 *
 * Supports CEO, President, Executive Team, Board, Committee, and custom chains.
 */

import type {
  GovernanceApprovalRequest,
  GovernanceApprovalStatus,
  GovernanceApprovalStep,
  GovernanceApproverRole,
  GovernanceAuthorityDomain,
  GovernanceCycleRequest,
} from "@/lib/platform/governance/types";

export interface GovernanceApprovalsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

const ROLE_LABEL: Record<GovernanceApproverRole, string> = {
  ceo: "CEO",
  president: "President",
  executive_team: "Executive Team",
  board: "Board",
  committee: "Committee",
  custom: "Custom Approver",
};

export class GovernanceApprovals {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceApprovalRequest>();

  constructor(dependencies: GovernanceApprovalsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  /**
   * Build a chain from autonomy / decision signals.
   */
  createFromCycle(request: GovernanceCycleRequest): GovernanceApprovalRequest[] {
    const created: GovernanceApprovalRequest[] = [];
    const mode = request.autonomy?.decision.approvalMode;

    if (mode && mode !== "automatic") {
      const roles = this.rolesForMode(mode);
      created.push(
        this.create({
          subject: request.subject,
          description:
            request.autonomy?.decision.rationale.join(" ") ??
            request.description ??
            "Approval required",
          domain: this.domainFromSignals(request),
          roles,
          sourceRef: request.autonomy?.decision.decisionId ?? request.requestId,
          organizationId: request.organizationId,
          schoolId: request.schoolId ?? null,
        })
      );
    }

    if (request.decision && !mode) {
      created.push(
        this.create({
          subject: request.decision.recommendation.recommendedOption,
          description: request.decision.analysis.decisionQuestion,
          domain: "strategic",
          roles: ["executive_team", "ceo"],
          sourceRef: request.decision.requestId,
          organizationId: request.organizationId,
          schoolId: request.schoolId ?? null,
        })
      );
    }

    return created;
  }

  create(input: {
    subject: string;
    description: string;
    domain: GovernanceAuthorityDomain;
    roles: readonly GovernanceApproverRole[];
    sourceRef?: string | null;
    organizationId?: string | null;
    schoolId?: string | null;
    customLabel?: string;
  }): GovernanceApprovalRequest {
    const ts = this.now().toISOString();
    const chain: GovernanceApprovalStep[] = input.roles.map((role, index) => ({
      stepId: this.createId("step"),
      order: index + 1,
      role,
      label:
        role === "custom" && input.customLabel
          ? input.customLabel
          : ROLE_LABEL[role],
      required: true,
      status: index === 0 ? "pending" : "draft",
      decidedAt: null,
      decidedBy: null,
      notes: [],
    }));

    const approval: GovernanceApprovalRequest = {
      approvalId: this.createId("approval"),
      subject: input.subject,
      description: input.description,
      status: "pending",
      domain: input.domain,
      chain,
      currentStepOrder: chain.length > 0 ? 1 : null,
      sourceRef: input.sourceRef ?? null,
      organizationId: input.organizationId ?? null,
      schoolId: input.schoolId ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.store.set(approval.approvalId, approval);
    return approval;
  }

  decideStep(
    approvalId: string,
    stepOrder: number,
    status: Extract<GovernanceApprovalStatus, "approved" | "rejected" | "deferred">,
    decidedBy: string,
    note?: string
  ): GovernanceApprovalRequest {
    const existing = this.store.get(approvalId);
    if (!existing) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    const ts = this.now().toISOString();
    const chain = existing.chain.map((step) => {
      if (step.order !== stepOrder) return step;
      return {
        ...step,
        status,
        decidedAt: ts,
        decidedBy,
        notes: note ? [...step.notes, note] : [...step.notes],
      };
    });

    let overall: GovernanceApprovalStatus = existing.status;
    let currentStepOrder = existing.currentStepOrder;

    if (status === "rejected") {
      overall = "rejected";
      currentStepOrder = null;
    } else if (status === "deferred") {
      overall = "deferred";
    } else {
      const next = chain.find((s) => s.order === stepOrder + 1);
      if (next) {
        currentStepOrder = next.order;
        const advanced = chain.map((s) =>
          s.order === next.order ? { ...s, status: "pending" as const } : s
        );
        const updated: GovernanceApprovalRequest = {
          ...existing,
          chain: advanced,
          currentStepOrder,
          status: "pending",
          updatedAt: ts,
        };
        this.store.set(approvalId, updated);
        return updated;
      }
      overall = "approved";
      currentStepOrder = null;
    }

    const updated: GovernanceApprovalRequest = {
      ...existing,
      chain,
      currentStepOrder,
      status: overall,
      updatedAt: ts,
    };
    this.store.set(approvalId, updated);
    return updated;
  }

  list(filter?: { status?: GovernanceApprovalStatus }): readonly GovernanceApprovalRequest[] {
    let items = Array.from(this.store.values());
    if (filter?.status) {
      items = items.filter((a) => a.status === filter.status);
    }
    return items;
  }

  get(approvalId: string): GovernanceApprovalRequest | null {
    return this.store.get(approvalId) ?? null;
  }

  private rolesForMode(
    mode: NonNullable<GovernanceCycleRequest["autonomy"]>["decision"]["approvalMode"]
  ): GovernanceApproverRole[] {
    if (mode === "board_approval") return ["executive_team", "ceo", "board"];
    if (mode === "ceo_approval") return ["executive_team", "ceo"];
    if (mode === "approval_required") return ["executive_team"];
    return ["ceo"];
  }

  private domainFromSignals(
    request: GovernanceCycleRequest
  ): GovernanceAuthorityDomain {
    const kind = request.autonomy?.diagnosis.causes[0]?.kind;
    if (kind === "financial_pressure") return "financial";
    if (kind === "staffing_capacity") return "hr";
    if (kind === "academic_performance") return "academic";
    if (kind === "strategic_misalignment") return "strategic";
    if (kind === "compliance_risk") return "mission";
    return "operational";
  }
}
