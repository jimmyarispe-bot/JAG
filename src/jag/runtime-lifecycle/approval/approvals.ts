/**
 * Declarative approval model — definitions only, no workflow engine.
 */

import type {
  RuntimeApproval,
  RuntimeApprovalKind,
} from "@/jag/runtime-lifecycle/contracts";

export type ApprovalRequirement = {
  readonly kind: RuntimeApprovalKind;
  readonly required: boolean;
  readonly label: string;
};

/** Default approval kinds required before publish (declarative catalog). */
export const DEFAULT_PUBLISH_APPROVAL_REQUIREMENTS: readonly ApprovalRequirement[] =
  Object.freeze([
    Object.freeze({
      kind: "technical",
      required: true,
      label: "Technical approval",
    }),
    Object.freeze({
      kind: "organization",
      required: true,
      label: "Organization approval",
    }),
    Object.freeze({
      kind: "compliance",
      required: false,
      label: "Compliance approval",
    }),
  ]);

export function createApproval(input: {
  readonly id?: string;
  readonly kind: RuntimeApprovalKind;
  readonly approverId: string;
  readonly approvedAt?: string;
  readonly notes?: string;
}): RuntimeApproval {
  return Object.freeze({
    id: input.id ?? `approval.${input.kind}.${input.approverId}`,
    kind: input.kind,
    approverId: input.approverId,
    approvedAt: input.approvedAt ?? new Date().toISOString(),
    notes: input.notes,
  });
}

export function hasRequiredApprovals(
  approvals: readonly RuntimeApproval[],
  requirements: readonly ApprovalRequirement[] = DEFAULT_PUBLISH_APPROVAL_REQUIREMENTS
): boolean {
  const present = new Set(approvals.map((a) => a.kind));
  return requirements
    .filter((r) => r.required)
    .every((r) => present.has(r.kind));
}
