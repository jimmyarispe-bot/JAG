import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { TEACHER_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type {
  JagWorkItem,
  JagWorkPerspective,
  JagWorkPriority,
  JagWorkQueue,
  JagWorkStatus,
  ResolveTeacherJagWorkInput,
} from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";
import { getTasks } from "@/lib/work/tasks";
import type { WorkTask } from "@/lib/work/types";

const COMPLETED_STATUSES = new Set(["completed", "complete", "documented"]);

function orgOwnerLabel(input: ResolveTeacherJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  const owner = resolveObjectOrganizationalOwner(org, "work_item", "teacher-queue");
  return owner.owner.name;
}

function priorityRank(p: JagWorkPriority): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p];
}

function sortItems(items: JagWorkItem[]): JagWorkItem[] {
  return [...items].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
  });
}

function mapPlatformPriority(p: string): JagWorkPriority {
  if (p === "critical") return "critical";
  if (p === "high") return "high";
  if (p === "low") return "low";
  return "medium";
}

function mapPlatformStatus(status: WorkTask["status"]): JagWorkStatus {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "blocked":
      return "blocked";
    case "needs_review":
      return "awaiting_review";
    case "waiting":
      return "blocked";
    case "completed":
      return "completed";
    default:
      return "not_started";
  }
}

function mapPlatformTaskToWorkItem(task: WorkTask): JagWorkItem {
  const perspectives: JagWorkPerspective[] = [];
  const today = new Date().toISOString().split("T")[0]!;
  const priority = mapPlatformPriority(task.priority);

  if (task.due_date === today || task.status === "in_progress") perspectives.push("today");
  if (priority === "critical" || priority === "high") perspectives.push("highest_priorities");
  if (task.status === "needs_review" || task.task_type === "approval") {
    perspectives.push("awaiting_review");
  }
  if (task.status === "blocked" || task.status === "waiting") {
    perspectives.push("needs_human_decision");
  }
  if (!perspectives.length) perspectives.push("today");

  return {
    id: `work-task-${task.id}`,
    title: task.title,
    description: task.description ?? undefined,
    workType: task.task_type,
    perspectives,
    priority,
    ownerUserId: task.owner_user_id,
    dueDate: task.due_date,
    status: mapPlatformStatus(task.status),
    requiredCapabilityKey: undefined,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction:
      task.status === "needs_review" ? "Review and approve or return" : "Open task and complete required steps",
    blockingDependencies: task.status === "blocked" ? ["Blocked by dependency or prerequisite"] : [],
    completionCriteria: ["Task marked completed in platform work"],
    href: `/dashboard/work?view=tasks`,
    entityType: "work_tasks",
    entityId: task.id,
    studentId: task.student_id ?? undefined,
    source: "platform_work",
  };
}

function sessionStudentLabel(session: ResolveTeacherJagWorkInput["sessions"][0]): string {
  if (session.students.length > 1) return `${session.students.length} students`;
  const s = session.students[0];
  return s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() : "No enrollments";
}

function buildSessionWorkItems(input: ResolveTeacherJagWorkInput): JagWorkItem[] {
  const items: JagWorkItem[] = [];
  const capabilityKey = "cap.teacher.session_delivery";
  const evidenceTypes = ["jag.evidence.observation_record", "jag.evidence.assessment_result"];
  const knowledgeKeys =
    input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? ["jag.knowledge.sl_teacher_guide"];

  for (const session of input.sessions) {
    const isComplete = COMPLETED_STATUSES.has(session.lessonStatus.toLowerCase());
    const inProgress = ["in_progress", "started"].includes(session.lessonStatus.toLowerCase());
    const courseName = session.course?.name ?? "Instructional session";
    const studentLabel = sessionStudentLabel(session);
    const href = `/dashboard/teacher/sessions/${session.id}?from=work`;

    if (!isComplete) {
      const perspectives: JagWorkPerspective[] = ["today", "ready_to_teach"];
      if (session.alerts.length) perspectives.push("highest_priorities");
      if (inProgress) perspectives.push("ready_for_completion");

      items.push({
        id: `session-deliver-${session.id}`,
        title: `Deliver instruction — ${courseName}`,
        description: `${session.timeDisplay} · ${studentLabel}`,
        workType: "deliver_instruction",
        perspectives,
        priority: session.alerts.length ? "high" : "medium",
        ownerUserId: input.identity.effectiveUserId,
        ownerLabel: orgOwnerLabel(input) ?? input.identity.fullName ?? undefined,
        dueDate: new Date().toISOString().split("T")[0],
        status: inProgress ? "in_progress" : "ready",
        requiredCapabilityKey: capabilityKey,
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: evidenceTypes,
        recommendedNextAction: inProgress ? "Continue live session delivery" : "Open session and begin instruction",
        blockingDependencies: session.alerts.length
          ? session.alerts.slice(0, 2).map((a) => a.message)
          : [],
        completionCriteria: [
          "Session marked complete",
          "Session notes documented",
          "Outcomes recorded for enrolled learners",
        ],
        href,
        entityType: "instructional_sessions",
        entityId: session.id,
        source: "instruction",
      });
    }

    if (inProgress) {
      items.push({
        id: `session-complete-${session.id}`,
        title: `Complete session documentation — ${courseName}`,
        description: `${session.timeDisplay} · Closeout and evidence capture`,
        workType: "complete_session",
        perspectives: ["ready_for_completion", "today"],
        priority: "high",
        ownerUserId: input.identity.effectiveUserId,
        dueDate: new Date().toISOString().split("T")[0],
        status: "in_progress",
        requiredCapabilityKey: "cap.teacher.progress_recording",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: evidenceTypes,
        recommendedNextAction: "Complete session, capture reflection, and run closeout",
        blockingDependencies: ["Session delivery in progress"],
        completionCriteria: ["Lesson status completed", "Continuous improvement loop recorded"],
        href,
        entityType: "instructional_sessions",
        entityId: session.id,
        source: "instruction",
      });
    }

    if (isComplete) {
      items.push({
        id: `session-family-${session.id}`,
        title: `Family communication — ${courseName}`,
        description: `Send or review family update for ${studentLabel}`,
        workType: "contact_family",
        perspectives: ["ready_for_family_communication", "today"],
        priority: "medium",
        ownerUserId: input.identity.effectiveUserId,
        dueDate: new Date().toISOString().split("T")[0],
        status: "ready",
        requiredCapabilityKey: capabilityKey,
        requiredKnowledgeKeys: [],
        requiredEvidenceTypes: [],
        recommendedNextAction: "Review closeout family draft and send parent message",
        blockingDependencies: [],
        completionCriteria: ["Parent outreach sent or scheduled"],
        href: `${href}&focus=closeout`,
        entityType: "instructional_sessions",
        entityId: session.id,
        source: "instruction",
      });
    }
  }

  return items;
}

function buildComplianceWorkItems(input: ResolveTeacherJagWorkInput): JagWorkItem[] {
  return input.compliance.map((c, idx) => {
    const priority: JagWorkPriority =
      c.severity === "high" ? "critical" : c.severity === "medium" ? "high" : "medium";
    const perspectives: JagWorkPerspective[] = ["today", "highest_priorities"];
    if (c.severity === "high") perspectives.push("needs_human_decision");

    return {
      id: `compliance-${idx}-${c.title.slice(0, 24)}`,
      title: c.title,
      description: `${c.type.replace(/_/g, " ")} compliance requirement`,
      workType: "complete_compliance",
      perspectives,
      priority,
      ownerUserId: input.identity.effectiveUserId,
      dueDate: c.dueDate ?? new Date().toISOString().split("T")[0],
      status: "ready",
      requiredCapabilityKey: "cap.platform.workflow_execution",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: ["jag.evidence.observation_record"],
      recommendedNextAction: "Resolve compliance requirement and document completion",
      blockingDependencies: [],
      completionCriteria: ["Compliance obligation satisfied"],
      href: c.href ?? "/dashboard/teacher?work=today",
      source: "compliance",
    };
  });
}

function buildInterventionWorkItems(input: ResolveTeacherJagWorkInput): JagWorkItem[] {
  const today = new Date().toISOString().split("T")[0]!;
  return input.interventions
    .filter((iv) => iv.review_date && iv.review_date <= today)
    .map((iv) => {
      const st = iv.students;
      const row = Array.isArray(st) ? st[0] : st;
      const studentName = row
        ? `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim()
        : undefined;

      return {
        id: `intervention-review-${iv.id}`,
        title: `Review intervention — ${iv.intervention_type ?? "Intervention"}`,
        description: iv.goal_description ?? studentName,
        workType: "schedule_intervention",
        perspectives: ["awaiting_review", "today", "highest_priorities"],
        priority: "high",
        ownerUserId: input.identity.effectiveUserId,
        dueDate: iv.review_date,
        status: "awaiting_review",
        requiredCapabilityKey: "cap.teacher.progress_recording",
        requiredKnowledgeKeys: ["jag.knowledge.sl_teacher_guide"],
        requiredEvidenceTypes: ["jag.evidence.observation_record"],
        recommendedNextAction: "Review intervention effectiveness and adjust plan",
        blockingDependencies: [],
        completionCriteria: ["Intervention review documented"],
        href: iv.student_id
          ? `/dashboard/teacher/students/${iv.student_id}?view=growth`
          : "/dashboard/teacher?work=awaiting_review",
        entityType: "student_academic_interventions",
        entityId: iv.id,
        studentId: iv.student_id,
        studentName,
        source: "intervention",
      };
    });
}

function buildProfileWorkItems(input: ResolveTeacherJagWorkInput): JagWorkItem[] {
  if (!input.jagProfilesByStudent?.size) return [];

  const items: JagWorkItem[] = [];
  for (const [studentId, profile] of input.jagProfilesByStudent) {
    if (profile.instruction.parentReminders.length) {
      items.push({
        id: `family-reminder-${studentId}`,
        title: `Contact family — ${profile.identity.displayName}`,
        description: profile.instruction.parentReminders.map((r) => r.subject).join("; "),
        workType: "contact_family",
        perspectives: ["ready_for_family_communication", "today"],
        priority: "medium",
        ownerUserId: input.identity.effectiveUserId,
        dueDate: new Date().toISOString().split("T")[0],
        status: "ready",
        requiredCapabilityKey: "cap.teacher.session_delivery",
        requiredKnowledgeKeys: profile.instruction.strategies.slice(0, 2),
        requiredEvidenceTypes: [],
        recommendedNextAction: "Send parent message or schedule outreach",
        blockingDependencies: [],
        completionCriteria: ["Family communication logged"],
        href: `/dashboard/teacher/students/${studentId}?view=overview`,
        entityType: "student",
        entityId: studentId,
        studentId,
        studentName: profile.identity.displayName,
        source: "jag_profile",
      });
    }

    const missingEvidence = profile.evidence.artifacts.length === 0 && profile.learning.activeCompetency;
    if (missingEvidence) {
      items.push({
        id: `evidence-review-${studentId}`,
        title: `Review evidence — ${profile.identity.displayName}`,
        description: `Capture competency evidence for ${profile.learning.activeCompetency?.title ?? "active competency"}`,
        workType: "review_evidence",
        perspectives: ["today", "ready_for_completion"],
        priority: "medium",
        ownerUserId: input.identity.effectiveUserId,
        status: "ready",
        requiredCapabilityKey: "cap.paj.evidence_intake",
        requiredKnowledgeKeys: [],
        requiredEvidenceTypes: ["jag.evidence.observation_record", "jag.evidence.assessment_result"],
        recommendedNextAction: "Upload artifact or record observation",
        blockingDependencies: [],
        completionCriteria: ["Minimum evidence count met for competency"],
        href: `/dashboard/teacher/students/${studentId}?view=evidence`,
        studentId,
        studentName: profile.identity.displayName,
        source: "jag_profile",
      });
    }
  }
  return items;
}

function buildEngineRecommendationWorkItems(input: ResolveTeacherJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations
    .filter((rec) => rec.priority === "high")
    .map((rec) => ({
      id: `engine-rec-${rec.id}`,
      title: rec.title,
      description: rec.rationale,
      workType: "human_decision",
      perspectives: ["needs_human_decision", "highest_priorities"] as JagWorkPerspective[],
      priority: "high" as JagWorkPriority,
      ownerUserId: input.identity.effectiveUserId,
      status: "ready" as JagWorkStatus,
      requiredCapabilityKey: input.executionState?.grantedCapabilities[0]?.capabilityKey,
      requiredKnowledgeKeys: input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [],
      requiredEvidenceTypes: [],
      recommendedNextAction: rec.rationale,
      blockingDependencies: [],
      completionCriteria: ["Recommendation acknowledged or action taken"],
      href: "/dashboard/teacher?work=needs_human_decision",
      source: "execution_engine" as const,
    }));
}

/** Resolve Teacher Workspace work queue — composes platform work, instruction, profile, and engine. */
export async function resolveTeacherJagWork(
  input: ResolveTeacherJagWorkInput
): Promise<JagWorkQueue> {
  const platformTasks =
    input.platformWorkTasks ??
    (await getTasks(input.supabase, {
      assigneeUserId: input.identity.effectiveUserId,
      limit: 80,
    }));

  const allItems = sortItems([
    ...platformTasks.map(mapPlatformTaskToWorkItem),
    ...buildSessionWorkItems(input),
    ...buildComplianceWorkItems(input),
    ...buildInterventionWorkItems(input),
    ...buildProfileWorkItems(input),
    ...buildEngineRecommendationWorkItems(input),
  ]);

  return buildJagWorkQueue(
    "teacher",
    TEACHER_WORK_PERSPECTIVES,
    allItems,
    input.activePerspective
  );
}
