import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const complianceWorkflow: WorkflowTemplate = {
  kind: "compliance",
  label: "Compliance remediation",
  objectiveTemplate: "Remediate compliance gap with documented evidence trail",
  defaultTasks: [
    {
      title: "Scope finding and owners",
      description: "Confirm finding, severity, and accountable owners",
      ownerRole: "compliance_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["Finding ID", "Owner assigned", "Due date set"],
      milestone: "Scoped",
    },
    {
      title: "Collect evidence and remediate",
      description: "Close control gaps and assemble evidence pack",
      ownerRole: "operations_lead",
      estimatedDays: 10,
      dependsOn: [],
      checklist: ["Evidence attached", "Control retested"],
      milestone: "Remediated",
    },
    {
      title: "Verify and close",
      description: "Independent verification and closure record",
      ownerRole: "compliance_lead",
      estimatedDays: 3,
      dependsOn: [],
      checklist: ["Verification sign-off", "Closure logged"],
      milestone: "Closed",
    },
  ],
  successCriteria: [
    "Finding closed with verified evidence",
    "No unauthorized policy override",
    "Board/CEO notified if severity requires",
  ],
  rollbackDefaults: {
    conditions: ["Evidence insufficient", "Retest fails", "Scope expands materially"],
    recoverySteps: [
      "Reopen finding",
      "Escalate severity if required",
      "Notify compliance and executive sponsors",
    ],
    notifications: ["compliance_lead", "executive_director", "board"],
    impactAssessment: "Finding remains open; regulatory exposure continues.",
  },
  assumptions: ["Regulatory calendar is accurate", "Evidence systems are accessible"],
};
