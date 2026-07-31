/** Example work item type keys — industry blueprints decide which exist. */
export const WORK_ITEM_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "task", label: "Task" }),
  Object.freeze({ id: "activity", label: "Activity" }),
  Object.freeze({ id: "objective", label: "Objective" }),
  Object.freeze({ id: "initiative", label: "Initiative" }),
  Object.freeze({ id: "action_item", label: "Action Item" }),
  Object.freeze({ id: "checklist", label: "Checklist" }),
  Object.freeze({ id: "milestone", label: "Milestone" }),
] as const);
