import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { ADMISSIONS_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveAdmissionsJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";
import { leadStageLabel } from "@/lib/constants/admissions";

const REVIEW_STAGES = new Set(["admissions_review", "application_submitted", "new_inquiry"]);
const DOCUMENT_STAGES = new Set(["records_requested", "application_started", "application_submitted"]);
const ENROLLMENT_STAGES = new Set(["accepted"]);
const INTERVIEW_STAGES = new Set(["interview_scheduled", "assessment_scheduled"]);
const DECISION_STAGES = new Set(["waitlisted", "admissions_review"]);

function leadName(lead: { first_name: string; last_name: string }) {
  return `${lead.first_name} ${lead.last_name}`.trim();
}

function orgOwnerLabel(input: ResolveAdmissionsJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "task", "admissions-queue").owner.name;
}

function buildLeadWorkItems(input: ResolveAdmissionsJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const knowledgeKeys = input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [];
  const items: JagWorkItem[] = [];

  for (const lead of input.leads) {
    if (["enrolled", "declined"].includes(lead.lead_stage)) continue;

    const name = leadName(lead);
    const href = `/dashboard/admissions/cases/${lead.id}`;
    const stageLabel = leadStageLabel(lead.lead_stage);
    const perspectives: string[] = ["today"];

    if (REVIEW_STAGES.has(lead.lead_stage)) perspectives.push("awaiting_review", "highest_priorities");
    if (DOCUMENT_STAGES.has(lead.lead_stage)) perspectives.push("documents_pending");
    if (ENROLLMENT_STAGES.has(lead.lead_stage)) perspectives.push("ready_for_enrollment", "highest_priorities");
    if (INTERVIEW_STAGES.has(lead.lead_stage)) perspectives.push("today", "highest_priorities");
    if (DECISION_STAGES.has(lead.lead_stage)) perspectives.push("needs_human_decision");

    items.push({
      id: `lead-${lead.id}`,
      title: `Advance case — ${name}`,
      description: `${stageLabel}${lead.program ? ` · ${lead.program}` : ""}`,
      workType: "admissions_case",
      perspectives: [...new Set(perspectives)],
      priority: ENROLLMENT_STAGES.has(lead.lead_stage) ? "high" : REVIEW_STAGES.has(lead.lead_stage) ? "medium" : "low",
      ownerLabel: owner,
      dueDate: lead.inquiry_date,
      status: REVIEW_STAGES.has(lead.lead_stage) ? "awaiting_review" : "in_progress",
      requiredCapabilityKey: "cap.admissions.case_review",
      requiredKnowledgeKeys: knowledgeKeys,
      requiredEvidenceTypes: [],
      recommendedNextAction: ENROLLMENT_STAGES.has(lead.lead_stage)
        ? "Collect enrollment agreement signatures and complete SIS handoff"
        : INTERVIEW_STAGES.has(lead.lead_stage)
          ? "Conduct interview or assessment and advance pipeline"
          : REVIEW_STAGES.has(lead.lead_stage) && lead.lead_stage === "new_inquiry"
            ? "Qualify lead and schedule next step"
            : `Review case and advance from ${stageLabel}`,
      blockingDependencies: [],
      completionCriteria: ENROLLMENT_STAGES.has(lead.lead_stage)
        ? ["Enrollment packet fully signed", "Student activated in SIS"]
        : ["Lead stage updated", "Required documents verified"],
      href,
      entityType: "admissions_leads",
      entityId: lead.id,
      studentName: name,
      source: "admissions",
    });
  }

  return items;
}

function buildTaskWorkItems(input: ResolveAdmissionsJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const today = new Date().toISOString().split("T")[0]!;
  const leadById = new Map(input.leads.map((l) => [l.id, l]));

  return input.tasks
    .filter((t) => t.task_status !== "completed")
    .map((task) => {
      const lead = leadById.get(task.lead_id);
      const name = lead ? leadName(lead) : "Lead";
      const perspectives: string[] = ["today", "highest_priorities"];
      if (task.due_date && task.due_date < today) perspectives.push("needs_human_decision");
      if (task.task_status === "pending_review") perspectives.push("awaiting_review");

      return {
        id: `task-${task.id}`,
        title: task.task_name,
        description: name,
        workType: "admissions_task",
        perspectives: [...new Set(perspectives)],
        priority: task.due_date && task.due_date <= today ? "high" : "medium",
        ownerLabel: owner,
        dueDate: task.due_date,
        status: task.task_status === "in_progress" ? "in_progress" : "not_started",
        requiredCapabilityKey: "cap.admissions.case_review",
        requiredKnowledgeKeys: [],
        requiredEvidenceTypes: [],
        recommendedNextAction: "Open case and complete assigned task",
        blockingDependencies: [],
        completionCriteria: ["Task marked completed"],
        href: `/dashboard/admissions/cases/${task.lead_id}?section=tasks`,
        entityType: "admissions_tasks",
        entityId: task.id,
        studentName: name,
        source: "admissions" as const,
      };
    });
}

function buildTourWorkItems(input: ResolveAdmissionsJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const leadById = new Map(input.leads.map((l) => [l.id, l]));

  return input.tours
    .filter((t) => t.tour_status !== "cancelled" && t.tour_status !== "completed")
    .map((tour) => {
      const lead = leadById.get(tour.lead_id);
      const name = lead ? leadName(lead) : "Prospective family";
      return {
        id: `tour-${tour.id}`,
        title: `Campus tour — ${name}`,
        description: new Date(tour.scheduled_at).toLocaleString(),
        workType: "campus_tour",
        perspectives: ["today", "highest_priorities"],
        priority: "high",
        ownerLabel: owner,
        dueDate: tour.scheduled_at.split("T")[0],
        status: tour.tour_status === "scheduled" ? "ready" : "in_progress",
        requiredCapabilityKey: "cap.admissions.case_review",
        requiredKnowledgeKeys: [],
        requiredEvidenceTypes: [],
        recommendedNextAction: "Conduct tour and record outcomes on case profile",
        blockingDependencies: [],
        completionCriteria: ["Tour marked completed", "Follow-up task created if needed"],
        href: `/dashboard/admissions/cases/${tour.lead_id}?section=tours`,
        entityType: "admissions_tours",
        entityId: tour.id,
        studentName: name,
        source: "admissions" as const,
      };
    });
}

function buildEngineWorkItems(input: ResolveAdmissionsJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations.map((rec) => ({
    id: `engine-${rec.id}`,
    title: rec.title,
    description: rec.rationale,
    workType: "engine_recommendation",
    perspectives: ["needs_human_decision", "highest_priorities"],
    priority: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    status: "awaiting_review" as const,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: rec.rationale,
    blockingDependencies: [],
    completionCriteria: ["Recommendation acknowledged or action taken"],
    href: "/dashboard/admissions?work=needs_human_decision",
    source: "execution_engine" as const,
  }));
}

export function resolveAdmissionsJagWork(input: ResolveAdmissionsJagWorkInput): JagWorkQueue {
  const allItems = [
    ...buildLeadWorkItems(input),
    ...buildTaskWorkItems(input),
    ...buildTourWorkItems(input),
    ...buildEngineWorkItems(input),
  ];

  return buildJagWorkQueue(
    "admissions",
    ADMISSIONS_WORK_PERSPECTIVES,
    allItems,
    input.activePerspective
  );
}
