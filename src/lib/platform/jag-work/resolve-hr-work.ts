import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { HR_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveHrJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";

function orgOwnerLabel(input: ResolveHrJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "employee", "hr-queue").owner.name;
}

function buildApplicationWorkItems(input: ResolveHrJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const knowledgeKeys = input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [];

  return input.applications
    .filter((a) => !["hired", "rejected", "withdrawn"].includes(a.status))
    .map((app) => ({
      id: `application-${app.id}`,
      title: `Review application`,
      description: `Status: ${app.status.replace(/_/g, " ")}`,
      workType: "recruiting",
      perspectives: ["awaiting_review", "today", "highest_priorities"],
      priority: app.status === "interview_scheduled" ? "high" : "medium",
      ownerLabel: owner,
      dueDate: app.created_at.split("T")[0],
      status: app.status === "new" ? "not_started" : "awaiting_review",
      requiredCapabilityKey: "cap.hr.workforce_operations",
      requiredKnowledgeKeys: knowledgeKeys,
      requiredEvidenceTypes: [],
      recommendedNextAction: "Review candidate and advance recruiting pipeline",
      blockingDependencies: [],
      completionCriteria: ["Application status updated", "Interview or offer recorded"],
      href: `/dashboard/hr?view=recruiting`,
      entityType: "hr_job_applications",
      entityId: app.id,
      source: "hr",
    }));
}

function buildComplianceWorkItems(input: ResolveHrJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const today = new Date().toISOString().split("T")[0]!;

  return input.expiringCertifications.map((cert) => {
    const profile = cert.employees?.employee_profiles;
    const p = Array.isArray(profile) ? profile[0] : profile;
    const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "Employee";
    const expired = cert.expiration_date && cert.expiration_date < today;

    return {
      id: `cert-${cert.id}`,
      title: `Certification renewal — ${name}`,
      description: cert.expiration_date ? `Expires ${cert.expiration_date}` : "Expiration pending",
      workType: "compliance",
      perspectives: ["compliance_due", "today", "highest_priorities"],
      priority: expired ? "critical" : "high",
      ownerLabel: owner,
      dueDate: cert.expiration_date,
      status: expired ? "blocked" : "in_progress",
      requiredCapabilityKey: "cap.hr.workforce_operations",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Verify renewal documentation and update certification record",
      blockingDependencies: expired ? ["Certification expired"] : [],
      completionCriteria: ["Certification renewed or role adjusted"],
      href: `/dashboard/hr?view=compliance`,
      entityType: "employee_certifications",
      entityId: cert.id,
      source: "hr",
    };
  });
}

function buildOnboardingWorkItems(input: ResolveHrJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const today = new Date().toISOString().split("T")[0]!;

  return input.pendingOnboarding.map((task) => {
    const perspectives: string[] = ["ready_to_onboard", "today"];
    if (task.due_date && task.due_date <= today) perspectives.push("highest_priorities", "compliance_due");

    return {
      id: `onboard-${task.id}`,
      title: task.task_name,
      description: "Onboarding task pending",
      workType: "onboarding",
      perspectives: [...new Set(perspectives)],
      priority: task.due_date && task.due_date <= today ? "high" : "medium",
      ownerLabel: owner,
      dueDate: task.due_date,
      status: task.status === "in_progress" ? "in_progress" : "not_started",
      requiredCapabilityKey: "cap.hr.workforce_operations",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Complete onboarding checklist item",
      blockingDependencies: [],
      completionCriteria: ["Onboarding task marked completed"],
      href: `/dashboard/hr?view=compliance`,
      entityType: "hr_onboarding_tasks",
      entityId: task.id,
      source: "hr",
    };
  });
}

function buildEngineWorkItems(input: ResolveHrJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations.map((rec) => ({
    id: `engine-${rec.id}`,
    title: rec.title,
    description: rec.rationale,
    workType: "engine_recommendation",
    perspectives: ["needs_human_decision", "awaiting_review"],
    priority: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    status: "awaiting_review" as const,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: rec.rationale,
    blockingDependencies: [],
    completionCriteria: ["Recommendation acknowledged"],
    href: "/dashboard/hr?work=needs_human_decision",
    source: "execution_engine" as const,
  }));
}

export function resolveHrJagWork(input: ResolveHrJagWorkInput): JagWorkQueue {
  return buildJagWorkQueue(
    "hr",
    HR_WORK_PERSPECTIVES,
    [
      ...buildApplicationWorkItems(input),
      ...buildComplianceWorkItems(input),
      ...buildOnboardingWorkItems(input),
      ...buildEngineWorkItems(input),
    ],
    input.activePerspective
  );
}
