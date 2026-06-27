import { registerProfileContribution } from "@/lib/platform/profile/workspace/contributions";

/** Student module contribution metadata — rendering handled in StudentProfileWorkspace composer. */
export function registerStudentProfileContributions(): void {
  registerProfileContribution({
    id: "student.header.actions",
    slot: "header.actions",
    profileKind: "student",
    moduleKey: "ssis",
    label: "Header Actions",
    sortOrder: 10,
  });
  registerProfileContribution({
    id: "student.header.alerts",
    slot: "header.alerts",
    profileKind: "student",
    moduleKey: "ssis",
    label: "Header Alerts",
    sortOrder: 20,
  });
  registerProfileContribution({
    id: "student.context.quick_actions",
    slot: "context.quick_actions",
    profileKind: "student",
    moduleKey: "ssis",
    label: "Quick Actions",
    sortOrder: 10,
  });
  registerProfileContribution({
    id: "student.context.ai_recommendations",
    slot: "context.ai_recommendations",
    profileKind: "student",
    moduleKey: "decision_intelligence",
    label: "AI Recommendations",
    sortOrder: 20,
  });
  registerProfileContribution({
    id: "student.context.notifications",
    slot: "context.notifications",
    profileKind: "student",
    moduleKey: "platform",
    label: "Notifications",
    sortOrder: 30,
  });
}

registerStudentProfileContributions();
