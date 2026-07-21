import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const staffingWorkflow: WorkflowTemplate = {
  kind: "staffing",
  label: "Hiring / staffing response",
  objectiveTemplate: "Close staffing gap while protecting instructional continuity",
  defaultTasks: [
    {
      title: "Confirm vacancy and role profile",
      description: "Validate FTE need, credential requirements, and campus assignment",
      ownerRole: "hr_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["Role profile approved", "Budget line identified", "Campus confirmed"],
      milestone: "Role ready",
    },
    {
      title: "Post and source candidates",
      description: "Open requisition and activate sourcing channels",
      ownerRole: "hr_lead",
      estimatedDays: 10,
      dependsOn: [],
      checklist: ["Requisition posted", "Sourcing channels active"],
      milestone: "Pipeline open",
    },
    {
      title: "Interview and select",
      description: "Complete structured interviews and selection decision",
      ownerRole: "school_leader",
      estimatedDays: 14,
      dependsOn: [],
      checklist: ["Interview panel set", "Offer recommendation drafted"],
      milestone: "Selection complete",
    },
    {
      title: "Onboard and stabilize coverage",
      description: "Complete onboarding and interim coverage plan",
      ownerRole: "operations_lead",
      estimatedDays: 7,
      dependsOn: [],
      checklist: ["Background checks", "Coverage calendar", "Welcome packet"],
      milestone: "Coverage stable",
    },
  ],
  successCriteria: [
    "Authorized role filled or interim coverage in place",
    "Instructional continuity maintained",
    "Budget variance within approved band",
  ],
  rollbackDefaults: {
    conditions: ["Offer declined", "Budget freeze", "Credential mismatch discovered"],
    recoverySteps: [
      "Revert requisition to draft",
      "Restore interim coverage schedule",
      "Notify campus leadership and HR",
    ],
    notifications: ["school_leader", "hr_lead", "executive_director"],
    impactAssessment: "Vacancy persists; enrollment and workload risk remain elevated.",
  },
  assumptions: [
    "Hiring pipeline capacity is available",
    "Compensation band remains authorized",
  ],
};
