import type { LoopTransitionDefinition, OperationalLoopTransitionKey } from "@/lib/platform/operational-loop/types";

export const OPERATIONAL_LOOP_WORKFLOW_KEY = "ref_operational_loop";

export const LOOP_TRANSITION_REGISTRY: Record<
  OperationalLoopTransitionKey,
  LoopTransitionDefinition
> = {
  admissions_to_enrollment: {
    transitionKey: "admissions_to_enrollment",
    fromStage: "admissions",
    toStage: "enrollment",
    label: "Admissions → Enrollment",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_platform_access_gate", "ref_student_placement"],
    capabilityKey: "cap.admissions.enrollment_handoff",
    nextWorkModule: "sis",
    nextWorkItemType: "admissions_alert",
    nextWorkTitle: "Complete enrollment activation",
    nextWorkHref: "/dashboard/students?work=enrollment_pending",
    profileSections: ["enrollment", "family"],
  },
  enrollment_to_scheduling: {
    transitionKey: "enrollment_to_scheduling",
    fromStage: "enrollment",
    toStage: "scheduling",
    label: "Enrollment → Scheduling",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_student_placement", "ref_structured_literacy_placement"],
    capabilityKey: "cap.scheduling.placement",
    nextWorkModule: "scheduling",
    nextWorkItemType: "scheduling_alert",
    nextWorkTitle: "Confirm section placement",
    nextWorkHref: "/dashboard/scheduling?work=placement_gaps",
    profileSections: ["scheduling", "learning-journey"],
  },
  scheduling_to_instruction: {
    transitionKey: "scheduling_to_instruction",
    fromStage: "scheduling",
    toStage: "instruction",
    label: "Scheduling → Instruction",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_scheduling_block", "ref_teacher_assignment"],
    capabilityKey: "cap.teacher.session_delivery",
    nextWorkModule: "teacher_portal",
    nextWorkItemType: "pending_task",
    nextWorkTitle: "Deliver scheduled session",
    nextWorkHref: "/dashboard/teacher?work=ready_to_teach",
    profileSections: ["scheduling", "teachers"],
  },
  instruction_to_evidence: {
    transitionKey: "instruction_to_evidence",
    fromStage: "instruction",
    toStage: "evidence",
    label: "Instruction → Evidence",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_platform_access_gate"],
    capabilityKey: "cap.paj.evidence_intake",
    nextWorkModule: "teacher_portal",
    nextWorkItemType: "pending_task",
    nextWorkTitle: "Complete session evidence",
    nextWorkHref: "/dashboard/teacher?work=ready_for_completion",
    profileSections: ["learning-journey"],
  },
  evidence_to_progress: {
    transitionKey: "evidence_to_progress",
    fromStage: "evidence",
    toStage: "progress",
    label: "Evidence → Progress",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_student_placement", "ref_structured_literacy_placement"],
    capabilityKey: "cap.teacher.progress_recording",
    nextWorkModule: "sis",
    nextWorkItemType: "pending_task",
    nextWorkTitle: "Review learner progress",
    nextWorkHref: "/dashboard/students?work=records_incomplete",
    profileSections: ["learning-journey", "graduation-readiness"],
  },
  progress_to_parent_communication: {
    transitionKey: "progress_to_parent_communication",
    fromStage: "progress",
    toStage: "parent_communication",
    label: "Progress → Parent Communication",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_parent_permissions"],
    capabilityKey: "cap.teacher.progress_recording",
    nextWorkModule: "parent_portal",
    nextWorkItemType: "pending_task",
    nextWorkTitle: "Send family update",
    nextWorkHref: "/dashboard/teacher?work=ready_for_family_communication",
    profileSections: ["family"],
  },
  parent_communication_to_billing: {
    transitionKey: "parent_communication_to_billing",
    fromStage: "parent_communication",
    toStage: "billing",
    label: "Parent Communication → Billing",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_platform_access_gate"],
    capabilityKey: "cap.finance.billing_operations",
    nextWorkModule: "finance",
    nextWorkItemType: "finance_alert",
    nextWorkTitle: "Review billing account",
    nextWorkHref: "/dashboard/finance?work=overdue_invoices",
    profileSections: ["billing"],
  },
  billing_to_scheduling_cycle: {
    transitionKey: "billing_to_scheduling_cycle",
    fromStage: "billing",
    toStage: "scheduling",
    label: "Billing → Scheduling (next cycle)",
    eventType: "jag.operational_loop.transitioned",
    ruleSetKeys: ["ref_scheduling_block", "ref_student_placement"],
    capabilityKey: "cap.scheduling.intelligence",
    nextWorkModule: "scheduling",
    nextWorkItemType: "scheduling_alert",
    nextWorkTitle: "Plan next scheduling cycle",
    nextWorkHref: "/dashboard/scheduling?work=today",
    profileSections: ["scheduling", "billing"],
  },
};

export function getLoopTransition(
  transitionKey: OperationalLoopTransitionKey
): LoopTransitionDefinition {
  const def = LOOP_TRANSITION_REGISTRY[transitionKey];
  if (!def) throw new Error(`Unknown operational loop transition: ${transitionKey}`);
  return def;
}

export function getTransitionsForStage(stage: string): LoopTransitionDefinition[] {
  return Object.values(LOOP_TRANSITION_REGISTRY).filter((t) => t.fromStage === stage);
}
