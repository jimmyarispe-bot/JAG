import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const financeWorkflow: WorkflowTemplate = {
  kind: "finance",
  label: "Budget revision",
  objectiveTemplate: "Adjust budget allocations to match approved financial decision",
  defaultTasks: [
    {
      title: "Draft revision package",
      description: "Prepare line-item changes with variance narrative",
      ownerRole: "finance_lead",
      estimatedDays: 3,
      dependsOn: [],
      checklist: ["Variance analysis", "Cash impact estimate", "Policy checklist"],
      milestone: "Draft ready",
    },
    {
      title: "Controller review",
      description: "Validate accounting treatment and controls",
      ownerRole: "finance_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["GL mapping", "Control sign-off"],
      milestone: "Controls reviewed",
    },
    {
      title: "Executive / board authorization",
      description: "Route for policy-required financial approvals",
      ownerRole: "executive_director",
      estimatedDays: 5,
      dependsOn: [],
      checklist: ["Approval packet", "Board materials if required"],
      milestone: "Authorized",
    },
    {
      title: "Post and communicate",
      description: "Post revisions and notify budget owners",
      ownerRole: "finance_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["Posted in ledger", "Owners notified"],
      milestone: "Live",
    },
  ],
  successCriteria: [
    "Authorized revisions posted",
    "Cash position remains within policy",
    "Budget owners acknowledged changes",
  ],
  rollbackDefaults: {
    conditions: ["Approval denied", "Cash covenant breach risk", "Material data error"],
    recoverySteps: [
      "Revert draft journal entries",
      "Restore prior budget snapshot",
      "Notify finance and executive sponsors",
    ],
    notifications: ["finance_lead", "executive_director", "ceo"],
    impactAssessment: "Planned allocation changes do not take effect; prior budget remains.",
  },
  assumptions: ["Source financial data is current", "No concurrent conflicting revision"],
};
