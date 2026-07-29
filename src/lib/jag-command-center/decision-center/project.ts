/**
 * Project real action proposals into Decision Center cards.
 * Never invents decisions that do not come from proposals.
 */

import { createHash } from "node:crypto";
import type {
  EducationActionProposal,
} from "@/lib/domains/education";
import type { JagStoredExecution } from "../intelligence-store";
import {
  decisionGroupLabel,
  resolveContributorCatalog,
} from "./catalog";
import {
  ensureDecisionTracked,
  getDecisionStatus,
} from "./status-store";
import type {
  JagDecisionCard,
  JagDecisionPriorityLabel,
} from "./types";

export function projectDecisionId(input: {
  organizationId: string;
  executionId: string;
  actionId: string;
}): string {
  return createHash("sha256")
    .update(
      `${input.organizationId}|${input.executionId}|${input.actionId}`
    )
    .digest("hex")
    .slice(0, 24);
}

export function priorityLabelFromRank(
  priority: number
): JagDecisionPriorityLabel {
  if (priority <= 1) return "P1";
  if (priority === 2) return "P2";
  return "P3";
}

export function projectDecisionCard(input: {
  execution: JagStoredExecution;
  proposal: EducationActionProposal;
  organizationName: string;
}): JagDecisionCard {
  const catalog = resolveContributorCatalog(input.execution.contributorId);
  const id = projectDecisionId({
    organizationId: input.execution.organizationId,
    executionId: input.execution.id,
    actionId: input.proposal.actionId,
  });

  ensureDecisionTracked(id, input.execution.analyzedAt);

  return {
    id,
    title: input.proposal.label || input.proposal.kind,
    category: catalog.group,
    categoryLabel: decisionGroupLabel(catalog.group),
    organizationId: input.execution.organizationId,
    organizationName: input.organizationName,
    domainId: catalog.domainId,
    domainName: catalog.domainName,
    capabilityPackId: catalog.capabilityPackId,
    capabilityPackName: catalog.capabilityPackName,
    contributorId: input.execution.contributorId,
    contributorLabel: catalog.contributorLabel,
    priority: priorityLabelFromRank(input.proposal.priority),
    priorityRank: input.proposal.priority,
    confidence: input.execution.confidence,
    evidenceCount: input.execution.evidenceCount,
    recommendedAction: input.proposal.rationale || input.proposal.label,
    status: getDecisionStatus(id),
    actionId: input.proposal.actionId,
    actionKind: input.proposal.kind,
    executionId: input.execution.id,
    analyzedAt: input.execution.analyzedAt,
    rationale: input.proposal.rationale,
  };
}

export function projectDecisionsFromExecutions(input: {
  executions: readonly JagStoredExecution[];
  organizationNames: Readonly<Record<string, string>>;
}): JagDecisionCard[] {
  const cards: JagDecisionCard[] = [];
  for (const execution of input.executions) {
    for (const proposal of execution.suggestedActions) {
      cards.push(
        projectDecisionCard({
          execution,
          proposal,
          organizationName:
            input.organizationNames[execution.organizationId] ??
            execution.organizationId,
        })
      );
    }
  }
  return cards.sort((a, b) => {
    const pr = a.priorityRank - b.priorityRank;
    if (pr !== 0) return pr;
    return b.analyzedAt.localeCompare(a.analyzedAt);
  });
}
