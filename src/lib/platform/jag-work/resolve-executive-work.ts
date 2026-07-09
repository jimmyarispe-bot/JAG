import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { EXECUTIVE_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveExecutiveJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";

function orgOwnerLabel(input: ResolveExecutiveJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "recommendation", "executive-queue").owner.name;
}

function buildInsightWorkItems(input: ResolveExecutiveJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const knowledgeKeys = input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [];

  return input.insights.map((insight) => {
    const perspectives: string[] = ["today"];
    if (insight.severity === "critical" || insight.severity === "high") {
      perspectives.push("highest_priorities", "needs_human_decision");
    }
    if (insight.category === "strategic" || insight.category === "risk") {
      perspectives.push("strategic_decisions");
    }
    if (insight.category === "board" || insight.category === "reporting") {
      perspectives.push("board_ready", "awaiting_review");
    }
    if (!perspectives.includes("awaiting_review")) perspectives.push("awaiting_review");

    return {
      id: `insight-${insight.id}`,
      title: insight.title,
      description: insight.recommended_action ?? insight.category,
      workType: "executive_insight",
      perspectives: [...new Set(perspectives)],
      priority: insight.severity === "critical" ? "critical" : insight.severity === "high" ? "high" : "medium",
      ownerLabel: owner,
      status: "awaiting_review",
      requiredCapabilityKey: "cap.executive.intelligence",
      requiredKnowledgeKeys: knowledgeKeys,
      requiredEvidenceTypes: [],
      recommendedNextAction: insight.recommended_action ?? "Review insight and assign follow-up",
      blockingDependencies: [],
      completionCriteria: ["Insight acknowledged", "Action owner assigned"],
      href: `/dashboard/executive/recommendations`,
      entityType: "executive_insights",
      entityId: insight.id,
      source: "executive",
    };
  });
}

function buildAlertWorkItems(input: ResolveExecutiveJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const items: JagWorkItem[] = [];

  if (input.complianceAlerts > 0) {
    items.push({
      id: "compliance-alerts",
      title: `${input.complianceAlerts} compliance obligation${input.complianceAlerts === 1 ? "" : "s"} overdue or due`,
      description: "Compliance center requires executive attention",
      workType: "compliance_alert",
      perspectives: ["highest_priorities", "needs_human_decision", "today"],
      priority: "critical",
      ownerLabel: owner,
      status: "blocked",
      requiredCapabilityKey: "cap.executive.intelligence",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Open compliance center and assign remediation owners",
      blockingDependencies: ["Overdue compliance obligations"],
      completionCriteria: ["Obligations assigned and tracked"],
      href: "/dashboard/executive/compliance",
      source: "executive",
    });
  }

  if (input.missionControlCritical > 0) {
    items.push({
      id: "mission-control-critical",
      title: `${input.missionControlCritical} critical Mission Control item${input.missionControlCritical === 1 ? "" : "s"}`,
      description: "Cross-module operational exceptions",
      workType: "mission_control",
      perspectives: ["highest_priorities", "strategic_decisions", "today"],
      priority: "critical",
      ownerLabel: owner,
      status: "blocked",
      requiredCapabilityKey: "cap.executive.intelligence",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Review Mission Control and escalate as needed",
      blockingDependencies: ["Critical operational exceptions"],
      completionCriteria: ["Critical items resolved or delegated"],
      href: "/dashboard/mission-control",
      source: "executive",
    });
  }

  return items;
}

function buildEngineWorkItems(input: ResolveExecutiveJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations.map((rec) => ({
    id: `engine-${rec.id}`,
    title: rec.title,
    description: rec.rationale,
    workType: "engine_recommendation",
    perspectives: ["strategic_decisions", "needs_human_decision", "board_ready"],
    priority: rec.priority === "high" ? "critical" : rec.priority === "low" ? "low" : "high",
    status: "awaiting_review" as const,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: rec.rationale,
    blockingDependencies: [],
    completionCriteria: ["Executive decision recorded"],
    href: "/dashboard/executive/decisions",
    source: "execution_engine" as const,
  }));
}

export function resolveExecutiveJagWork(input: ResolveExecutiveJagWorkInput): JagWorkQueue {
  return buildJagWorkQueue(
    "executive",
    EXECUTIVE_WORK_PERSPECTIVES,
    [
      ...buildInsightWorkItems(input),
      ...buildAlertWorkItems(input),
      ...buildEngineWorkItems(input),
    ],
    input.activePerspective
  );
}
