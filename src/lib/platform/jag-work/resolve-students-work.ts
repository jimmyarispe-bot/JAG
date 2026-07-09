import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { STUDENTS_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveStudentsJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";

function studentName(s: { first_name: string; last_name: string }) {
  return `${s.first_name} ${s.last_name}`.trim();
}

function orgOwnerLabel(input: ResolveStudentsJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "student", "students-queue").owner.name;
}

function buildStudentWorkItems(input: ResolveStudentsJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const knowledgeKeys = input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [];

  return input.students.flatMap((student) => {
    const name = studentName(student);
    const href = `/dashboard/students/${student.id}`;
    const items: JagWorkItem[] = [];

    if (student.enrollment_status === "pending") {
      items.push({
        id: `enroll-${student.id}`,
        title: `Complete enrollment — ${name}`,
        description: `${student.grade_level ?? "Grade N/A"} · ${student.program ?? "Program N/A"}`,
        workType: "enrollment",
        perspectives: ["enrollment_pending", "today", "highest_priorities"],
        priority: "high",
        ownerLabel: owner,
        status: "in_progress",
        requiredCapabilityKey: "cap.students.enrollment_management",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: [],
        recommendedNextAction: "Verify records and confirm enrollment status",
        blockingDependencies: [],
        completionCriteria: ["Enrollment status set to enrolled", "SIS records complete"],
        href,
        entityType: "students",
        entityId: student.id,
        studentId: student.id,
        studentName: name,
        source: "students",
      });
    }

    const recordsIncomplete =
      !student.date_of_birth || !student.student_number || !student.grade_level;
    if (recordsIncomplete && student.status === "active") {
      items.push({
        id: `records-${student.id}`,
        title: `Complete student record — ${name}`,
        description: "Missing required demographic or identifier fields",
        workType: "records",
        perspectives: ["records_incomplete", "today"],
        priority: "medium",
        ownerLabel: owner,
        status: "not_started",
        requiredCapabilityKey: "cap.students.record_management",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: [],
        recommendedNextAction: "Open profile and complete missing fields",
        blockingDependencies: [],
        completionCriteria: ["Required fields populated", "Profile validated"],
        href: `${href}?section=identity`,
        entityType: "students",
        entityId: student.id,
        studentId: student.id,
        studentName: name,
        source: "students",
      });
    }

    if (!student.family_id && student.status === "active") {
      items.push({
        id: `family-${student.id}`,
        title: `Link family — ${name}`,
        description: "No family account linked to student record",
        workType: "family_link",
        perspectives: ["records_incomplete", "today", "highest_priorities"],
        priority: "high",
        ownerLabel: owner,
        status: "blocked",
        requiredCapabilityKey: "cap.students.record_management",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: [],
        recommendedNextAction: "Assign family and verify guardian contacts",
        blockingDependencies: [],
        completionCriteria: ["Family linked", "Guardian contacts verified"],
        href: `${href}?section=family`,
        entityType: "students",
        entityId: student.id,
        studentId: student.id,
        studentName: name,
        source: "students",
      });
    }

    if (
      student.lifecycle_stage &&
      student.lifecycle_stage !== "active" &&
      student.enrollment_status === "enrolled"
    ) {
      items.push({
        id: `activate-${student.id}`,
        title: `Activate for instruction — ${name}`,
        description: "Enrolled but not yet active in teacher workspace",
        workType: "activation",
        perspectives: ["enrollment_pending", "highest_priorities"],
        priority: "high",
        ownerLabel: owner,
        status: "in_progress",
        requiredCapabilityKey: "cap.students.enrollment_management",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: [],
        recommendedNextAction: "Verify PAJ journey, roster, and billing activation",
        blockingDependencies: [],
        completionCriteria: ["Lifecycle active", "Instructional team assigned"],
        href: `${href}?section=learning-journey`,
        entityType: "students",
        entityId: student.id,
        studentId: student.id,
        studentName: name,
        source: "students",
      });
    }

    return items;
  });
}

function buildEngineWorkItems(input: ResolveStudentsJagWorkInput): JagWorkItem[] {
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
    href: "/dashboard/students?work=needs_human_decision",
    source: "execution_engine" as const,
  }));
}

export function resolveStudentsJagWork(input: ResolveStudentsJagWorkInput): JagWorkQueue {
  return buildJagWorkQueue(
    "students",
    STUDENTS_WORK_PERSPECTIVES,
    [...buildStudentWorkItems(input), ...buildEngineWorkItems(input)],
    input.activePerspective
  );
}
