/**
 * Approval engine facade (Sprint 066).
 */

import { routeApprovals } from "@/lib/platform/intelligence/executive-autonomous/approvals/routing";
import type {
  ApprovalRole,
  ApprovalStep,
  OrganizationalPolicy,
  WorkflowKind,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export interface ApprovalEngineDeps {
  createId?: (prefix: string) => string;
}

export class ApprovalEngine {
  private readonly createId: (prefix: string) => string;

  constructor(deps: ApprovalEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
  }

  route(input: {
    workflowKind: WorkflowKind;
    policies?: OrganizationalPolicy[];
    financialImpact?: number;
    risk?: number;
    effort?: number;
    approvedRoles?: ApprovalRole[];
  }): { steps: ApprovalStep[]; violations: string[] } {
    return routeApprovals({ ...input, createId: this.createId });
  }
}
