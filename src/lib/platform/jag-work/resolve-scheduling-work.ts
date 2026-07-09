import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { SCHEDULING_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveSchedulingJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";

function orgOwnerLabel(input: ResolveSchedulingJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "task", "scheduling-queue").owner.name;
}

function buildConflictWorkItems(input: ResolveSchedulingJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  return input.conflicts
    .filter((c) => !c.is_resolved)
    .map((c) => {
      const perspectives: string[] = ["today", "highest_priorities"];
      if (c.severity === "critical") perspectives.push("conflicts_due", "needs_human_decision");
      if (c.conflict_type === "teacher" && (c.metadata as { emergency?: boolean })?.emergency) {
        perspectives.push("coverage_needed");
      }
      if (c.conflict_type === "student") perspectives.push("placement_gaps");
      if (c.conflict_type === "capacity") perspectives.push("capacity_optimization");

      return {
        id: `conflict-${c.id}`,
        title: c.title,
        description: c.description ?? "",
        workType: "schedule_conflict",
        perspectives: [...new Set(perspectives)],
        priority: c.severity === "critical" ? "high" : c.severity === "warning" ? "medium" : "low",
        ownerLabel: owner,
        status: c.severity === "critical" ? "blocked" : "awaiting_review",
        requiredCapabilityKey: "cap.scheduling.conflict_resolution",
        requiredKnowledgeKeys: [],
        requiredEvidenceTypes: [],
        recommendedNextAction: c.recommendation ?? "Review and resolve scheduling conflict",
        blockingDependencies: [],
        completionCriteria: ["Conflict resolved or waived"],
        href: "/dashboard/scheduling?work=conflicts_due",
        entityType: "schedule_conflicts",
        entityId: c.id,
        source: "scheduling" as const,
      };
    });
}

function buildPlacementWorkItems(input: ResolveSchedulingJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  return input.placementGaps.map((gap) => ({
    id: `placement-${gap.studentId}`,
    title: `Place student — ${gap.studentName}`,
    description: gap.reason,
    workType: "student_placement",
    perspectives: ["placement_gaps", "today", "highest_priorities"],
    priority: "high" as const,
    ownerLabel: owner,
    status: "not_started" as const,
    requiredCapabilityKey: "cap.scheduling.placement",
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: "Run placement intelligence and enroll in best-matched section",
    blockingDependencies: [],
    completionCriteria: ["Student enrolled in appropriate section"],
    href: `/dashboard/students/${gap.studentId}?section=scheduling`,
    entityType: "students",
    entityId: gap.studentId,
    studentId: gap.studentId,
    studentName: gap.studentName,
    source: "scheduling" as const,
  }));
}

function buildRecommendationWorkItems(input: ResolveSchedulingJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  return input.recommendations
    .filter((r) => r.priority === "high")
    .map((rec, idx) => ({
      id: `rec-${idx}-${rec.category}`,
      title: rec.title,
      description: rec.detail,
      workType: "scheduling_recommendation",
      perspectives: ["needs_human_decision", "highest_priorities", "capacity_optimization"],
      priority: "high" as const,
      ownerLabel: owner,
      status: "awaiting_review" as const,
      requiredCapabilityKey: "cap.scheduling.intelligence",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: rec.action ?? rec.detail,
      blockingDependencies: [],
      completionCriteria: ["Recommendation acknowledged or executed"],
      href: "/dashboard/scheduling?work=needs_human_decision",
      source: "scheduling" as const,
    }));
}

function buildEngineWorkItems(input: ResolveSchedulingJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations.map((rec) => ({
    id: `engine-${rec.id}`,
    title: rec.title,
    description: rec.rationale,
    workType: "engine_recommendation",
    perspectives: ["needs_human_decision"],
    priority: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    status: "awaiting_review" as const,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: rec.rationale,
    blockingDependencies: [],
    completionCriteria: ["Recommendation acknowledged"],
    href: "/dashboard/scheduling?work=needs_human_decision",
    source: "execution_engine" as const,
  }));
}

export function resolveSchedulingJagWork(input: ResolveSchedulingJagWorkInput): JagWorkQueue {
  const allItems = [
    ...buildConflictWorkItems(input),
    ...buildPlacementWorkItems(input),
    ...buildRecommendationWorkItems(input),
    ...buildEngineWorkItems(input),
  ];

  return buildJagWorkQueue(
    "scheduling",
    SCHEDULING_WORK_PERSPECTIVES,
    allItems,
    input.activePerspective
  );
}
