/**
 * RC-7 — nine reference studio workflows.
 */

import { defineWorkflow, e, n } from "@/lib/platform/workflows/catalog/builders";
import type {
  ExampleWorkflowKey,
  StudioWorkflowDefinition,
} from "@/lib/platform/workflows/types";

export function employeeOnboardingWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "New hire created", {
    triggerType: "event",
    eventKey: "hr.employee.created",
    description: "Fires when HR creates an employee record",
  }, "eo-trigger");
  const hrSoft = n("integration", "Soft-read HR feed", {
    provider: "hr",
    mode: "soft_read",
    objectHint: "Employee",
  }, "eo-hr");
  const cond = n("condition", "Role requires equipment?", {
    field: "needsEquipment",
    operator: "equals",
    value: true,
  }, "eo-cond");
  const task = n("action", "Create onboarding tasks", {
    actionType: "create_task",
    target: "hr_onboarding_checklist",
    description: "IT, facilities, and orientation tasks",
  }, "eo-task");
  const notify = n("notification", "Welcome email", {
    channel: "email",
    template: "employee_welcome",
    audience: "new_hire",
  }, "eo-notify");
  const delay = n("delay", "Wait 1 day", {
    durationHours: 24,
    reason: "Allow IT provisioning",
  }, "eo-delay");
  const approval = n("approval", "Manager day-1 sign-off", {
    role: "hiring_manager",
    rationale: "Confirm workstation and access ready",
    requireHuman: true,
  }, "eo-approval");
  const graph = n("graph_update", "Refresh org graph", {
    mode: "rebuild",
    description: "Include new Employee in knowledge graph",
  }, "eo-graph");
  const skipEquip = n("action", "Skip equipment path", {
    actionType: "record_audit",
    target: "onboarding_no_equipment",
  }, "eo-skip");

  return defineWorkflow({
    id: "wf-employee-onboarding",
    key: "employee_onboarding",
    name: "Employee Onboarding",
    description: "HR onboarding with equipment branch, manager approval, and graph refresh",
    category: "hr",
    tags: ["onboarding", "hr", "approval"],
    entryNodeId: trigger.id,
    nodes: [trigger, hrSoft, cond, task, notify, delay, approval, graph, skipEquip],
    edges: [
      e(trigger.id, hrSoft.id),
      e(hrSoft.id, cond.id),
      e(cond.id, task.id, "true"),
      e(cond.id, skipEquip.id, "false"),
      e(task.id, notify.id),
      e(notify.id, delay.id),
      e(delay.id, approval.id),
      e(approval.id, graph.id, "approved"),
      e(skipEquip.id, notify.id),
    ],
  });
}

export function studentEnrollmentWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Application submitted", {
    triggerType: "event",
    eventKey: "admissions.application.submitted",
  }, "se-trigger");
  const ai = n("ai_step", "Assess enrollment readiness", {
    question: "Summarize everything affecting student enrollment readiness.",
    softReadOnly: true,
    capabilityHint: "initiative_impact",
  }, "se-ai");
  const cond = n("condition", "Documents complete?", {
    field: "documentsComplete",
    operator: "equals",
    value: true,
  }, "se-cond");
  const notifyMissing = n("notification", "Request missing docs", {
    channel: "portal",
    template: "enrollment_docs_missing",
    audience: "parent",
  }, "se-notify-miss");
  const approval = n("approval", "Registrar approval", {
    role: "registrar",
    rationale: "Approve enrollment into SIS",
    requireHuman: true,
  }, "se-approval");
  const action = n("action", "Create enrollment record", {
    actionType: "create_task",
    target: "sis_enroll_student",
  }, "se-action");
  const edu = n("integration", "Soft-read education feed", {
    provider: "education",
    mode: "soft_read",
  }, "se-edu");
  const graph = n("graph_update", "Update student graph", {
    mode: "rebuild",
  }, "se-graph");

  return defineWorkflow({
    id: "wf-student-enrollment",
    key: "student_enrollment",
    name: "Student Enrollment",
    description: "Admissions → AI readiness → registrar approval → SIS enrollment",
    category: "admissions",
    tags: ["enrollment", "education", "approval"],
    entryNodeId: trigger.id,
    nodes: [trigger, ai, cond, notifyMissing, approval, action, edu, graph],
    edges: [
      e(trigger.id, ai.id),
      e(ai.id, cond.id),
      e(cond.id, approval.id, "true"),
      e(cond.id, notifyMissing.id, "false"),
      e(approval.id, action.id, "approved"),
      e(action.id, edu.id),
      e(edu.id, graph.id),
    ],
  });
}

export function grantRenewalWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Grant renewal window", {
    triggerType: "schedule",
    cron: "0 9 1 * *",
    eventKey: "grants.renewal.window",
  }, "gr-trigger");
  const fin = n("integration", "Soft-read finance", {
    provider: "finance",
    mode: "soft_read",
  }, "gr-fin");
  const ai = n("ai_step", "Risk scan", {
    question: "Show organizational risks this month.",
    softReadOnly: true,
  }, "gr-ai");
  const approval = n("approval", "Grants director approval", {
    role: "grants_director",
    rationale: "Approve grant renewal package",
    requireHuman: true,
  }, "gr-approval");
  const notify = n("notification", "Notify program owners", {
    channel: "email",
    template: "grant_renewal_packet",
    audience: "program_owners",
  }, "gr-notify");
  const action = n("action", "Open renewal tasks", {
    actionType: "create_task",
    target: "grant_renewal_checklist",
  }, "gr-action");

  return defineWorkflow({
    id: "wf-grant-renewal",
    key: "grant_renewal",
    name: "Grant Renewal",
    description: "Scheduled grant renewal with finance soft-read and director approval",
    category: "grants",
    tags: ["grants", "finance", "approval"],
    entryNodeId: trigger.id,
    nodes: [trigger, fin, ai, approval, notify, action],
    edges: [
      e(trigger.id, fin.id),
      e(fin.id, ai.id),
      e(ai.id, approval.id),
      e(approval.id, notify.id, "approved"),
      e(notify.id, action.id),
    ],
  });
}

export function budgetApprovalWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Budget request submitted", {
    triggerType: "event",
    eventKey: "finance.budget.requested",
  }, "ba-trigger");
  const cond = n("condition", "Amount over threshold?", {
    field: "amount",
    operator: "greater_than",
    value: 10000,
  }, "ba-cond");
  const cfo = n("approval", "CFO approval", {
    role: "cfo",
    rationale: "Budget above $10k requires CFO",
    requireHuman: true,
  }, "ba-cfo");
  const manager = n("approval", "Budget owner approval", {
    role: "budget_owner",
    rationale: "Standard budget approval",
    requireHuman: true,
  }, "ba-mgr");
  const fin = n("integration", "Finance soft-read", {
    provider: "finance",
    mode: "soft_read",
  }, "ba-fin");
  const notify = n("notification", "Budget decision notice", {
    channel: "dashboard",
    template: "budget_decision",
    audience: "requester",
  }, "ba-notify");
  const audit = n("action", "Record budget audit", {
    actionType: "record_audit",
    target: "budget_approval",
  }, "ba-audit");

  return defineWorkflow({
    id: "wf-budget-approval",
    key: "budget_approval",
    name: "Budget Approval",
    description: "Tiered budget approval with finance soft-read",
    category: "finance",
    tags: ["budget", "approval", "finance"],
    entryNodeId: trigger.id,
    nodes: [trigger, cond, cfo, manager, fin, notify, audit],
    edges: [
      e(trigger.id, cond.id),
      e(cond.id, cfo.id, "true"),
      e(cond.id, manager.id, "false"),
      e(cfo.id, fin.id, "approved"),
      e(manager.id, fin.id, "approved"),
      e(fin.id, notify.id),
      e(notify.id, audit.id),
    ],
  });
}

export function purchaseApprovalWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Purchase request", {
    triggerType: "event",
    eventKey: "finance.purchase.requested",
  }, "pa-trigger");
  const cond = n("condition", "Vendor on approved list?", {
    field: "vendorApproved",
    operator: "equals",
    value: true,
  }, "pa-cond");
  const vendorReview = n("action", "Flag vendor review", {
    actionType: "escalate",
    target: "vendor_compliance",
  }, "pa-flag");
  const approval = n("approval", "Procurement approval", {
    role: "procurement",
    rationale: "Approve purchase order",
    requireHuman: true,
  }, "pa-approval");
  const notify = n("notification", "PO status", {
    channel: "email",
    template: "purchase_order_status",
    audience: "requester",
  }, "pa-notify");
  const action = n("action", "Create PO task", {
    actionType: "create_task",
    target: "create_purchase_order",
  }, "pa-action");

  return defineWorkflow({
    id: "wf-purchase-approval",
    key: "purchase_approval",
    name: "Purchase Approval",
    description: "Purchase request with vendor check and procurement approval",
    category: "finance",
    tags: ["purchase", "approval", "vendor"],
    entryNodeId: trigger.id,
    nodes: [trigger, cond, vendorReview, approval, notify, action],
    edges: [
      e(trigger.id, cond.id),
      e(cond.id, approval.id, "true"),
      e(cond.id, vendorReview.id, "false"),
      e(vendorReview.id, approval.id),
      e(approval.id, notify.id, "approved"),
      e(notify.id, action.id),
    ],
  });
}

export function scholarshipApprovalWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Scholarship application", {
    triggerType: "event",
    eventKey: "scholarships.application.submitted",
  }, "sa-trigger");
  const ai = n("ai_step", "Eligibility narrative", {
    question: "Who are the key decision makers?",
    softReadOnly: true,
  }, "sa-ai");
  const cond = n("condition", "GPA meets minimum?", {
    field: "gpa",
    operator: "greater_than",
    value: 2.5,
  }, "sa-cond");
  const rejectNotify = n("notification", "Ineligible notice", {
    channel: "portal",
    template: "scholarship_ineligible",
    audience: "applicant",
  }, "sa-reject");
  const approval = n("approval", "Scholarship committee", {
    role: "scholarship_committee",
    rationale: "Award decision",
    requireHuman: true,
  }, "sa-approval");
  const action = n("action", "Record award", {
    actionType: "create_task",
    target: "scholarship_award",
  }, "sa-action");
  const graph = n("graph_update", "Refresh awards graph", {
    mode: "rebuild",
  }, "sa-graph");

  return defineWorkflow({
    id: "wf-scholarship-approval",
    key: "scholarship_approval",
    name: "Scholarship Approval",
    description: "Scholarship eligibility, committee approval, and graph update",
    category: "scholarships",
    tags: ["scholarship", "approval", "education"],
    entryNodeId: trigger.id,
    nodes: [trigger, ai, cond, rejectNotify, approval, action, graph],
    edges: [
      e(trigger.id, ai.id),
      e(ai.id, cond.id),
      e(cond.id, approval.id, "true"),
      e(cond.id, rejectNotify.id, "false"),
      e(approval.id, action.id, "approved"),
      e(action.id, graph.id),
    ],
  });
}

export function leadFollowUpWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "New CRM lead", {
    triggerType: "event",
    eventKey: "crm.lead.created",
  }, "lf-trigger");
  const crm = n("integration", "Soft-read CRM", {
    provider: "crm",
    mode: "soft_read",
    objectHint: "Lead",
  }, "lf-crm");
  const ai = n("ai_step", "Revenue context", {
    question: "Why is revenue declining?",
    softReadOnly: true,
  }, "lf-ai");
  const notify = n("notification", "Assign sales owner", {
    channel: "dashboard",
    template: "lead_assigned",
    audience: "sales_rep",
  }, "lf-notify");
  const delay = n("delay", "Wait 48h", {
    durationHours: 48,
    reason: "Follow-up SLA",
  }, "lf-delay");
  const cond = n("condition", "Lead contacted?", {
    field: "leadContacted",
    operator: "equals",
    value: true,
  }, "lf-cond");
  const escalate = n("action", "Escalate stale lead", {
    actionType: "escalate",
    target: "sales_manager",
  }, "lf-esc");
  const audit = n("action", "Log follow-up complete", {
    actionType: "record_audit",
    target: "lead_follow_up",
  }, "lf-audit");

  return defineWorkflow({
    id: "wf-lead-follow-up",
    key: "lead_follow_up",
    name: "Lead Follow-up",
    description: "CRM lead soft-read, AI context, SLA delay, and escalation",
    category: "crm",
    tags: ["lead", "crm", "follow-up"],
    entryNodeId: trigger.id,
    nodes: [trigger, crm, ai, notify, delay, cond, escalate, audit],
    edges: [
      e(trigger.id, crm.id),
      e(crm.id, ai.id),
      e(ai.id, notify.id),
      e(notify.id, delay.id),
      e(delay.id, cond.id),
      e(cond.id, audit.id, "true"),
      e(cond.id, escalate.id, "false"),
    ],
  });
}

export function contractReviewWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Contract uploaded", {
    triggerType: "event",
    eventKey: "legal.contract.uploaded",
  }, "cr-trigger");
  const ai = n("ai_step", "Cross-domain contract risks", {
    question: "Across domains, what organizational risks affect this contract?",
    softReadOnly: true,
  }, "cr-ai");
  const approvalLegal = n("approval", "Legal review", {
    role: "general_counsel",
    rationale: "Legal sign-off on contract terms",
    requireHuman: true,
  }, "cr-legal");
  const approvalExec = n("approval", "Executive countersign", {
    role: "ceo",
    rationale: "Executive countersignature",
    requireHuman: true,
  }, "cr-exec");
  const notify = n("notification", "Contract status", {
    channel: "email",
    template: "contract_status",
    audience: "counterparties",
  }, "cr-notify");
  const graph = n("graph_update", "Link contract document", {
    mode: "rebuild",
  }, "cr-graph");

  return defineWorkflow({
    id: "wf-contract-review",
    key: "contract_review",
    name: "Contract Review",
    description: "AI risk scan with legal + executive dual approval",
    category: "legal",
    tags: ["contract", "legal", "approval"],
    entryNodeId: trigger.id,
    nodes: [trigger, ai, approvalLegal, approvalExec, notify, graph],
    edges: [
      e(trigger.id, ai.id),
      e(ai.id, approvalLegal.id),
      e(approvalLegal.id, approvalExec.id, "approved"),
      e(approvalExec.id, notify.id, "approved"),
      e(notify.id, graph.id),
    ],
  });
}

export function vendorApprovalWorkflow(): StudioWorkflowDefinition {
  const trigger = n("trigger", "Vendor submitted", {
    triggerType: "event",
    eventKey: "procurement.vendor.submitted",
  }, "va-trigger");
  const cond = n("condition", "Risk score acceptable?", {
    field: "vendorRiskScore",
    operator: "less_than",
    value: 70,
  }, "va-cond");
  const escalate = n("action", "Escalate high-risk vendor", {
    actionType: "escalate",
    target: "compliance",
  }, "va-esc");
  const approval = n("approval", "Vendor committee", {
    role: "vendor_committee",
    rationale: "Approve vendor for preferred list",
    requireHuman: true,
  }, "va-approval");
  const fin = n("integration", "Finance soft-read", {
    provider: "finance",
    mode: "soft_read",
  }, "va-fin");
  const notify = n("notification", "Vendor decision", {
    channel: "email",
    template: "vendor_decision",
    audience: "procurement",
  }, "va-notify");
  const action = n("action", "Add to approved vendor list", {
    actionType: "set_field",
    target: "vendor.status",
    payload: { status: "approved" },
  }, "va-action");
  const graph = n("graph_update", "Refresh vendor graph", {
    mode: "rebuild",
  }, "va-graph");

  return defineWorkflow({
    id: "wf-vendor-approval",
    key: "vendor_approval",
    name: "Vendor Approval",
    description: "Vendor risk gate, committee approval, finance soft-read, graph update",
    category: "procurement",
    tags: ["vendor", "approval", "compliance"],
    entryNodeId: trigger.id,
    nodes: [trigger, cond, escalate, approval, fin, notify, action, graph],
    edges: [
      e(trigger.id, cond.id),
      e(cond.id, approval.id, "true"),
      e(cond.id, escalate.id, "false"),
      e(escalate.id, approval.id),
      e(approval.id, fin.id, "approved"),
      e(fin.id, notify.id),
      e(notify.id, action.id),
      e(action.id, graph.id),
    ],
  });
}

const BUILDERS: Record<ExampleWorkflowKey, () => StudioWorkflowDefinition> = {
  employee_onboarding: employeeOnboardingWorkflow,
  student_enrollment: studentEnrollmentWorkflow,
  grant_renewal: grantRenewalWorkflow,
  budget_approval: budgetApprovalWorkflow,
  purchase_approval: purchaseApprovalWorkflow,
  scholarship_approval: scholarshipApprovalWorkflow,
  lead_follow_up: leadFollowUpWorkflow,
  contract_review: contractReviewWorkflow,
  vendor_approval: vendorApprovalWorkflow,
};

export function getExampleWorkflow(key: ExampleWorkflowKey): StudioWorkflowDefinition {
  return BUILDERS[key]();
}

export function listExampleWorkflows(): StudioWorkflowDefinition[] {
  return (Object.keys(BUILDERS) as ExampleWorkflowKey[]).map((k) => BUILDERS[k]!());
}

export function getExampleWorkflowCatalog(): Array<{
  key: ExampleWorkflowKey;
  name: string;
  category: string;
  description: string;
  nodeTypes: string[];
}> {
  return listExampleWorkflows().map((wf) => ({
    key: wf.key as ExampleWorkflowKey,
    name: wf.name,
    category: wf.category,
    description: wf.description,
    nodeTypes: [...new Set(wf.nodes.map((n) => n.type))],
  }));
}
