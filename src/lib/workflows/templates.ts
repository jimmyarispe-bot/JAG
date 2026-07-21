import type { WorkflowCategory, WorkflowDefinitionJson } from "./types";
import { createEdge, createNode, emptyDefinition } from "./definition";

export interface StarterWorkflowTemplate {
  key: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerKey: string;
  definition: WorkflowDefinitionJson;
}

function buildLinear(triggerKey: string, actions: Array<{ label: string; actionType: string; config?: Record<string, unknown> }>): WorkflowDefinitionJson {
  const base = emptyDefinition(triggerKey);
  const trigger = base.nodes[0];
  const end = base.nodes[1];
  const actionNodes = actions.map((a, i) =>
    createNode(
      "action",
      a.label,
      { actionType: a.actionType, ...a.config },
      `node-action-${i}`
    )
  );
  const nodes = [trigger, ...actionNodes, end];
  const edges = [
    createEdge(trigger.id, actionNodes[0]?.id ?? end.id),
    ...actionNodes.slice(0, -1).map((n, i) => createEdge(n.id, actionNodes[i + 1].id)),
    createEdge(actionNodes[actionNodes.length - 1]?.id ?? trigger.id, end.id),
  ];
  return { version: "1.0", entryNodeId: trigger.id, nodes, edges, conditionGroups: [] };
}

export const STARTER_WORKFLOW_TEMPLATES: StarterWorkflowTemplate[] = [
  {
    key: "new_lead_welcome",
    name: "New lead → welcome email",
    description: "Send a welcome email when an admissions lead is created",
    category: "admissions",
    triggerKey: "admissions.lead_created",
    definition: buildLinear("admissions.lead_created", [
      {
        label: "Send welcome email",
        actionType: "send_email",
        config: {
          subject: "Welcome to AcademyOS",
          body: "Thank you for your interest. We will be in touch shortly.",
        },
      },
      {
        label: "Create follow-up task",
        actionType: "create_task",
        config: { title: "Follow up with new lead" },
      },
    ]),
  },
  {
    key: "student_accepted_checklist",
    name: "Student accepted → enrollment checklist",
    description: "Create enrollment checklist tasks when a student is accepted",
    category: "admissions",
    triggerKey: "admissions.student_accepted",
    definition: buildLinear("admissions.student_accepted", [
      {
        label: "Portal notification",
        actionType: "portal_notification",
        config: { title: "Enrollment next steps", body: "Complete your enrollment checklist." },
      },
      {
        label: "Create enrollment task",
        actionType: "create_task",
        config: { title: "Complete enrollment checklist" },
      },
      {
        label: "Timeline event",
        actionType: "add_timeline_event",
        config: { title: "Enrollment checklist started" },
      },
    ]),
  },
  {
    key: "scholarship_expiring_reminder",
    name: "Scholarship expiring → reminder",
    description: "Remind families when a scholarship is expiring / expired",
    category: "scholarships",
    triggerKey: "scholarships.expired",
    definition: buildLinear("scholarships.expired", [
      {
        label: "Send reminder email",
        actionType: "send_email",
        config: {
          subject: "Scholarship renewal reminder",
          body: "Your scholarship is expiring soon. Please review renewal steps.",
        },
      },
    ]),
  },
  {
    key: "tuition_overdue_notification",
    name: "Tuition overdue → notification",
    description: "Notify when a balance becomes overdue",
    category: "billing",
    triggerKey: "billing.overdue_balance",
    definition: buildLinear("billing.overdue_balance", [
      {
        label: "Send overdue notice",
        actionType: "send_email",
        config: {
          subject: "Tuition balance overdue",
          body: "Your account has an overdue balance. Please contact billing.",
        },
      },
      {
        label: "Staff notification",
        actionType: "portal_notification",
        config: { title: "Overdue balance alert", body: "A family has an overdue balance." },
      },
    ]),
  },
  {
    key: "student_archived_notify_admins",
    name: "Student archived → notify administrators",
    description: "Alert administrators when a student is archived",
    category: "students",
    triggerKey: "students.student_archived",
    definition: buildLinear("students.student_archived", [
      {
        label: "Notify administrators",
        actionType: "portal_notification",
        config: { title: "Student archived", body: "A student was archived." },
      },
      {
        label: "Publish executive event",
        actionType: "publish_executive_event",
        config: { title: "Student archived via workflow" },
      },
    ]),
  },
  {
    key: "new_family_onboarding",
    name: "New family → onboarding sequence",
    description: "Start family onboarding when a household is created",
    category: "families",
    triggerKey: "families.family_created",
    definition: buildLinear("families.family_created", [
      {
        label: "Welcome email",
        actionType: "send_email",
        config: {
          subject: "Welcome to our school family",
          body: "We are glad you are here. Here are your onboarding next steps.",
        },
      },
      {
        label: "Create onboarding task",
        actionType: "create_task",
        config: { title: "Complete family onboarding" },
      },
      {
        label: "Timeline note",
        actionType: "add_timeline_event",
        config: { title: "Family onboarding started" },
      },
    ]),
  },
];

export function getStarterTemplate(key: string) {
  return STARTER_WORKFLOW_TEMPLATES.find((t) => t.key === key);
}
