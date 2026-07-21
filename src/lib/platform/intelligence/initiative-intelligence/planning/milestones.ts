/**
 * Milestone & nested work-breakdown builders.
 */

import type {
  Milestone,
  WorkItem,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildDefaultMilestones(
  createId: (prefix: string) => string,
  title: string,
  targetCompletionDate?: string
): Milestone[] {
  const planTasks: WorkItem[] = [
    {
      id: createId("task-scope"),
      title: "Finalize scope",
      status: "pending",
      percentComplete: 0,
      dependsOn: [],
      children: [],
      ownerRole: "initiative_owner",
    },
    {
      id: createId("task-owners"),
      title: "Confirm role owners",
      status: "pending",
      percentComplete: 0,
      dependsOn: [],
      children: [],
      ownerRole: "executive_sponsor",
    },
  ];

  const executeChildren: WorkItem[] = [
    {
      id: createId("task-workstream"),
      title: "Primary workstream",
      status: "pending",
      percentComplete: 0,
      dependsOn: [],
      children: [
        {
          id: createId("task-nested"),
          title: "Nested deliverable",
          status: "pending",
          percentComplete: 0,
          dependsOn: [],
          children: [],
          deliverable: `${title} core deliverable`,
        },
      ],
    },
  ];

  return [
    {
      id: createId("ms-plan"),
      title: "Plan & authorize",
      summary: "Approve scope, owners, and budget",
      dueDate: undefined,
      status: "pending",
      percentComplete: 0,
      ownerRole: "approver",
      workItems: planTasks,
      dependsOn: [],
    },
    {
      id: createId("ms-execute"),
      title: "Execute",
      summary: `Deliver ${title}`,
      dueDate: targetCompletionDate,
      status: "pending",
      percentComplete: 0,
      ownerRole: "initiative_owner",
      workItems: executeChildren,
      dependsOn: [],
    },
    {
      id: createId("ms-measure"),
      title: "Measure & learn",
      summary: "Capture outcomes and lessons for Executive Memory",
      dueDate: targetCompletionDate,
      status: "pending",
      percentComplete: 0,
      ownerRole: "reviewer",
      workItems: [],
      dependsOn: [],
    },
  ];
}

export function flattenWorkItems(items: WorkItem[]): WorkItem[] {
  const out: WorkItem[] = [];
  const walk = (list: WorkItem[]) => {
    for (const item of list) {
      out.push(item);
      if (item.children.length) walk(item.children);
    }
  };
  walk(items);
  return out;
}
