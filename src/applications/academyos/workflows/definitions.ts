import type { WorkflowDefinition } from "@/lib/platform/workflows/framework";

function flow(input: {
  id: string;
  name: string;
  entityTypes: string[];
  permission: string;
  states: Array<{ key: string; label: string; kind: "initial" | "intermediate" | "terminal" }>;
  transitions: Array<{
    key: string;
    from: string;
    to: string;
    label: string;
  }>;
}): WorkflowDefinition {
  return {
    id: input.id,
    applicationId: "academyos",
    name: input.name,
    version: "1.1.0",
    entityTypes: input.entityTypes,
    states: input.states,
    transitions: input.transitions.map((t) => ({
      ...t,
      permission: input.permission,
      allowedParticipantRoles: ["owner", "reviewer", "approver", "assignee"],
      actions: [
        {
          type: "record_timeline",
          params: { title: t.label, eventType: `workflow.${t.key}` },
        },
      ],
    })),
    participants: [
      { role: "owner", label: "Owner", required: true },
      { role: "reviewer", label: "Reviewer" },
      { role: "approver", label: "Approver" },
      { role: "assignee", label: "Assignee" },
    ],
    permissions: [{ action: "start", permission: input.permission }],
    metadata: { application: "academyos", phase: "domain-completion" },
  };
}

export const ACADEMYOS_WORKFLOWS: WorkflowDefinition[] = [
  flow({
    id: "academyos.admissions",
    name: "Admissions",
    entityTypes: ["Inquiry", "Application", "Student"],
    permission: "academyos.admissions.approve",
    states: [
      { key: "inquiry", label: "Inquiry", kind: "initial" },
      { key: "application", label: "Application", kind: "intermediate" },
      { key: "review", label: "Review", kind: "intermediate" },
      { key: "acceptance", label: "Acceptance", kind: "intermediate" },
      { key: "enrollment", label: "Enrollment", kind: "terminal" },
      { key: "declined", label: "Declined", kind: "terminal" },
    ],
    transitions: [
      { key: "start_application", from: "inquiry", to: "application", label: "Start application" },
      { key: "submit_for_review", from: "application", to: "review", label: "Submit for review" },
      { key: "accept", from: "review", to: "acceptance", label: "Accept" },
      { key: "decline", from: "review", to: "declined", label: "Decline" },
      { key: "enroll", from: "acceptance", to: "enrollment", label: "Enroll" },
    ],
  }),
  flow({
    id: "academyos.enrollment",
    name: "Enrollment",
    entityTypes: ["Enrollment"],
    permission: "academyos.enrollment.approve",
    states: [
      { key: "draft", label: "Draft", kind: "initial" },
      { key: "pending", label: "Pending", kind: "intermediate" },
      { key: "active", label: "Active", kind: "terminal" },
      { key: "cancelled", label: "Cancelled", kind: "terminal" },
    ],
    transitions: [
      { key: "submit", from: "draft", to: "pending", label: "Submit" },
      { key: "activate", from: "pending", to: "active", label: "Activate" },
      { key: "cancel", from: "pending", to: "cancelled", label: "Cancel" },
    ],
  }),
  flow({
    id: "academyos.student-lifecycle",
    name: "Student Lifecycle",
    entityTypes: ["Student"],
    permission: "academyos.students.update",
    states: [
      { key: "enroll", label: "Enroll", kind: "initial" },
      { key: "active", label: "Active", kind: "intermediate" },
      { key: "leave", label: "Leave", kind: "intermediate" },
      { key: "graduate", label: "Graduate", kind: "intermediate" },
      { key: "alumni", label: "Alumni", kind: "terminal" },
      { key: "withdrawn", label: "Withdrawn", kind: "terminal" },
    ],
    transitions: [
      { key: "activate", from: "enroll", to: "active", label: "Activate" },
      { key: "place_on_leave", from: "active", to: "leave", label: "Place on leave" },
      { key: "return", from: "leave", to: "active", label: "Return" },
      { key: "graduate", from: "active", to: "graduate", label: "Graduate" },
      { key: "to_alumni", from: "graduate", to: "alumni", label: "Move to alumni" },
      { key: "withdraw", from: "active", to: "withdrawn", label: "Withdraw" },
    ],
  }),
  flow({
    id: "academyos.student-withdrawal",
    name: "Student Withdrawal",
    entityTypes: ["Student", "Enrollment"],
    permission: "academyos.students.update",
    states: [
      { key: "requested", label: "Requested", kind: "initial" },
      { key: "review", label: "Review", kind: "intermediate" },
      { key: "completed", label: "Completed", kind: "terminal" },
      { key: "cancelled", label: "Cancelled", kind: "terminal" },
    ],
    transitions: [
      { key: "review", from: "requested", to: "review", label: "Review" },
      { key: "complete", from: "review", to: "completed", label: "Complete" },
      { key: "cancel", from: "review", to: "cancelled", label: "Cancel" },
    ],
  }),
  flow({
    id: "academyos.hiring",
    name: "Hiring",
    entityTypes: ["Employee"],
    permission: "academyos.hr.approve",
    states: [
      { key: "applicant", label: "Applicant", kind: "initial" },
      { key: "interview", label: "Interview", kind: "intermediate" },
      { key: "offer", label: "Offer", kind: "intermediate" },
      { key: "hire", label: "Hire", kind: "intermediate" },
      { key: "onboarding", label: "Onboarding", kind: "terminal" },
      { key: "rejected", label: "Rejected", kind: "terminal" },
    ],
    transitions: [
      { key: "interview", from: "applicant", to: "interview", label: "Interview" },
      { key: "offer", from: "interview", to: "offer", label: "Extend offer" },
      { key: "reject", from: "interview", to: "rejected", label: "Reject" },
      { key: "hire", from: "offer", to: "hire", label: "Hire" },
      { key: "onboard", from: "hire", to: "onboarding", label: "Onboard" },
    ],
  }),
  flow({
    id: "academyos.hr-lifecycle",
    name: "HR Lifecycle",
    entityTypes: ["Employee"],
    permission: "academyos.hr.update",
    states: [
      { key: "active", label: "Active", kind: "initial" },
      { key: "leave", label: "Leave", kind: "intermediate" },
      { key: "separated", label: "Separated", kind: "terminal" },
    ],
    transitions: [
      { key: "leave", from: "active", to: "leave", label: "Leave" },
      { key: "return", from: "leave", to: "active", label: "Return" },
      { key: "separate", from: "active", to: "separated", label: "Separate" },
    ],
  }),
  flow({
    id: "academyos.finance",
    name: "Finance Billing",
    entityTypes: ["Invoice", "Payment"],
    permission: "academyos.finance.approve",
    states: [
      { key: "invoice", label: "Invoice", kind: "initial" },
      { key: "billing", label: "Billing", kind: "intermediate" },
      { key: "payment", label: "Payment", kind: "intermediate" },
      { key: "collections", label: "Collections", kind: "intermediate" },
      { key: "closed", label: "Closed", kind: "terminal" },
    ],
    transitions: [
      { key: "bill", from: "invoice", to: "billing", label: "Bill" },
      { key: "receive_payment", from: "billing", to: "payment", label: "Receive payment" },
      { key: "to_collections", from: "billing", to: "collections", label: "Collections" },
      { key: "close_from_payment", from: "payment", to: "closed", label: "Close" },
      { key: "close_from_collections", from: "collections", to: "closed", label: "Close" },
    ],
  }),
  flow({
    id: "academyos.behavior",
    name: "Behavior",
    entityTypes: ["BehaviorIncident", "Intervention"],
    permission: "academyos.behavior.approve",
    states: [
      { key: "incident", label: "Incident", kind: "initial" },
      { key: "review", label: "Review", kind: "intermediate" },
      { key: "action", label: "Action", kind: "intermediate" },
      { key: "resolution", label: "Resolution", kind: "terminal" },
    ],
    transitions: [
      { key: "review", from: "incident", to: "review", label: "Review" },
      { key: "take_action", from: "review", to: "action", label: "Take action" },
      { key: "resolve", from: "action", to: "resolution", label: "Resolve" },
    ],
  }),
  flow({
    id: "academyos.scholarship",
    name: "Scholarship",
    entityTypes: ["Scholarship"],
    permission: "academyos.scholarships.approve",
    states: [
      { key: "application", label: "Application", kind: "initial" },
      { key: "verification", label: "Verification", kind: "intermediate" },
      { key: "approval", label: "Approval", kind: "intermediate" },
      { key: "funding", label: "Funding", kind: "intermediate" },
      { key: "renewal", label: "Renewal", kind: "terminal" },
      { key: "denied", label: "Denied", kind: "terminal" },
    ],
    transitions: [
      { key: "verify", from: "application", to: "verification", label: "Verify" },
      { key: "approve", from: "verification", to: "approval", label: "Approve" },
      { key: "deny", from: "verification", to: "denied", label: "Deny" },
      { key: "fund", from: "approval", to: "funding", label: "Fund" },
      { key: "renew", from: "funding", to: "renewal", label: "Renew" },
    ],
  }),
  flow({
    id: "academyos.payroll-approval",
    name: "Payroll Approval",
    entityTypes: ["PayrollBatch", "Employee"],
    permission: "academyos.hr.approve",
    states: [
      { key: "draft", label: "Draft", kind: "initial" },
      { key: "review", label: "Review", kind: "intermediate" },
      { key: "approved", label: "Approved", kind: "terminal" },
      { key: "rejected", label: "Rejected", kind: "terminal" },
    ],
    transitions: [
      { key: "submit", from: "draft", to: "review", label: "Submit" },
      { key: "approve", from: "review", to: "approved", label: "Approve" },
      { key: "reject", from: "review", to: "rejected", label: "Reject" },
    ],
  }),
  flow({
    id: "academyos.incident-review",
    name: "Incident Review",
    entityTypes: ["BehaviorIncident", "Student", "Employee"],
    permission: "academyos.behavior.approve",
    states: [
      { key: "open", label: "Open", kind: "initial" },
      { key: "investigating", label: "Investigating", kind: "intermediate" },
      { key: "closed", label: "Closed", kind: "terminal" },
    ],
    transitions: [
      { key: "investigate", from: "open", to: "investigating", label: "Investigate" },
      { key: "close", from: "investigating", to: "closed", label: "Close" },
    ],
  }),
];
