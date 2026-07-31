/**
 * Validation gates integrated with lifecycle stages.
 *
 * Draft → Structural → Reference → Diff Analysis → Approval Ready → Publish Ready
 */

import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import { diffRuntimeSpecifications } from "@/jag/runtime-generation";
import { hasRequiredApprovals } from "@/jag/runtime-lifecycle/approval";
import type {
  RuntimeVersion,
  ValidationGateResult,
} from "@/jag/runtime-lifecycle/contracts";

function gate(
  gateId: ValidationGateResult["gateId"],
  ok: boolean,
  messages: string[]
): ValidationGateResult {
  return Object.freeze({ gateId, ok, messages: Object.freeze(messages) });
}

export function runStructuralGate(
  version: RuntimeVersion
): ValidationGateResult {
  const messages: string[] = [];
  const spec = version.specification;
  if (!spec.metadata?.id) messages.push("Missing metadata.id");
  if (!spec.metadata?.applicationId)
    messages.push("Missing metadata.applicationId");
  if (!version.checksum) messages.push("Missing checksum");
  if (!version.versionId) messages.push("Missing versionId");
  return gate("structural", messages.length === 0, messages);
}

export function runReferenceGate(
  version: RuntimeVersion
): ValidationGateResult {
  const messages: string[] = [];
  const entityTypes = new Set(
    (version.specification.entities ?? []).map((e) => e.entityType)
  );
  for (const report of version.specification.reports ?? []) {
    if (report.entityType && !entityTypes.has(report.entityType)) {
      messages.push(
        `Report "${report.id}" references unknown entity "${report.entityType}"`
      );
    }
  }
  // Reference issues are warnings for gate pass if structural entities exist;
  // fail only when there are broken refs AND no entities at all.
  if (!entityTypes.size && (version.specification.reports?.length ?? 0) > 0) {
    return gate("reference", false, [
      "Reports present but no entities in specification",
      ...messages,
    ]);
  }
  return gate("reference", true, messages);
}

export function runDiffAnalysisGate(
  version: RuntimeVersion,
  previous?: RuntimeSpecification
): ValidationGateResult {
  const diff = diffRuntimeSpecifications(previous, version.specification);
  const messages = [
    `added=${diff.added.length}`,
    `removed=${diff.removed.length}`,
    `modified=${diff.modified.length}`,
    `breaking=${diff.breaking.length}`,
    `safe=${diff.safe.length}`,
  ];
  // Diff analysis always completes; breaking changes are reported, not auto-blocked.
  return gate("diff_analysis", true, messages);
}

export function runApprovalReadyGate(
  version: RuntimeVersion
): ValidationGateResult {
  const structural = runStructuralGate(version);
  const reference = runReferenceGate(version);
  const ok = structural.ok && reference.ok && version.state === "validated";
  const messages: string[] = [];
  if (version.state !== "validated") {
    messages.push(`State must be validated (current: ${version.state})`);
  }
  if (!structural.ok) messages.push(...structural.messages);
  if (!reference.ok) messages.push(...reference.messages);
  return gate("approval_ready", ok, messages);
}

export function runPublishReadyGate(
  version: RuntimeVersion
): ValidationGateResult {
  const messages: string[] = [];
  if (version.state !== "approved") {
    messages.push(`State must be approved (current: ${version.state})`);
  }
  if (!hasRequiredApprovals(version.approvals)) {
    messages.push("Missing required technical and organization approvals");
  }
  return gate("publish_ready", messages.length === 0, messages);
}

/** Run Draft → Validated gate sequence. */
export function runValidationGates(
  version: RuntimeVersion,
  previousSpecification?: RuntimeSpecification
): readonly ValidationGateResult[] {
  return Object.freeze([
    runStructuralGate(version),
    runReferenceGate(version),
    runDiffAnalysisGate(version, previousSpecification),
  ]);
}
