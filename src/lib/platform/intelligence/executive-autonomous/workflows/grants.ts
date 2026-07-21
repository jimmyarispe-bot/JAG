import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const grantsWorkflow: WorkflowTemplate = {
  kind: "grants",
  label: "Grant application preparation",
  objectiveTemplate: "Prepare a complete grant application package for human authorization",
  defaultTasks: [
    {
      title: "Confirm eligibility and fit",
      description: "Validate program eligibility against organizational profile",
      ownerRole: "finance_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["Eligibility matrix", "Match requirement check"],
      milestone: "Eligible",
    },
    {
      title: "Assemble documents",
      description: "Collect narratives, budgets, letters, and attachments",
      ownerRole: "operations_lead",
      estimatedDays: 10,
      dependsOn: [],
      checklist: [
        "Narrative draft",
        "Budget worksheet",
        "Letters of support",
        "Required forms checklist",
      ],
      milestone: "Packet assembled",
    },
    {
      title: "Internal review",
      description: "Cross-functional quality and compliance review",
      ownerRole: "compliance_lead",
      estimatedDays: 3,
      dependsOn: [],
      checklist: ["Finance review", "Compliance review", "Executive summary"],
      milestone: "Reviewed",
    },
    {
      title: "Authorization gate",
      description: "Hold for human approval before any submission",
      ownerRole: "executive_director",
      estimatedDays: 3,
      dependsOn: [],
      checklist: ["Approval recorded", "Submitter designated"],
      milestone: "Authorized to submit",
    },
  ],
  successCriteria: [
    "Complete packet ready for authorized submission",
    "No submission without recorded approval",
    "Match and reporting obligations understood",
  ],
  rollbackDefaults: {
    conditions: ["Deadline miss risk", "Eligibility change", "Authorization denied"],
    recoverySteps: [
      "Archive draft packet",
      "Do not submit",
      "Notify grant owners and finance",
    ],
    notifications: ["finance_lead", "executive_director", "operations_lead"],
    impactAssessment: "No application is filed; opportunity remains unused.",
  },
  assumptions: [
    "Grant guidelines are current",
    "No submission occurs without human authorization",
  ],
};
