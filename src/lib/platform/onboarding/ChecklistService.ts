/**
 * Sprint 212 — First-inbox onboarding tasks.
 */

import type { OnboardingSession, OnboardingTask, OnboardingTaskId } from "./types";

const TASK_DEFS: readonly {
  id: OnboardingTaskId;
  title: string;
  description: string;
  href: string;
}[] = [
  {
    id: "complete_integrations",
    title: "Complete integrations",
    description: "Connect remaining systems so evidence can flow into The JAG™.",
    href: "/jag/connectors",
  },
  {
    id: "invite_executives",
    title: "Invite executives",
    description: "Invite your executive team to the Command Center.",
    href: "/jag/settings",
  },
  {
    id: "configure_branding",
    title: "Configure branding",
    description: "Refine logos, colors, and fonts for your tenant.",
    href: "/jag/settings/branding",
  },
  {
    id: "review_strategy",
    title: "Review strategy",
    description: "Confirm mission, pillars, and goals in Strategic Intelligence.",
    href: "/jag/strategy",
  },
  {
    id: "generate_first_decision",
    title: "Generate first decision",
    description: "Open Decision Intelligence and create your first decision.",
    href: "/jag/decisions",
  },
];

const tasksByOrg = new Map<string, OnboardingTask[]>();

export const ChecklistService = {
  seedForOrganization(session: OnboardingSession): readonly OnboardingTask[] {
    if (!session.organizationId) return [];
    const at = new Date().toISOString();
    const tasks: OnboardingTask[] = TASK_DEFS.map((def) => ({
      ...def,
      completed: false,
      createdAt: at,
    }));
    // Mark branding complete if logo/colors already applied.
    const brandingDone = Boolean(
      session.brand.primaryColor &&
        (session.brand.lightLogoUrl || session.organization.logoUrl)
    );
    const strategyDone = Boolean(session.mission.mission.trim());
    const integrationsDone = session.connectors.some((c) => c.connected);

    const seeded = tasks.map((t) => {
      if (t.id === "configure_branding" && brandingDone) {
        return { ...t, completed: true };
      }
      if (t.id === "review_strategy" && strategyDone) {
        return { ...t, completed: true };
      }
      if (t.id === "complete_integrations" && integrationsDone) {
        return { ...t, completed: true };
      }
      return t;
    });

    tasksByOrg.set(session.organizationId, seeded);
    return seeded;
  },

  listForOrganization(organizationId: string): readonly OnboardingTask[] {
    return tasksByOrg.get(organizationId) ?? [];
  },

  completeTask(
    organizationId: string,
    taskId: OnboardingTaskId
  ): readonly OnboardingTask[] {
    const current = tasksByOrg.get(organizationId) ?? [];
    const next = current.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    tasksByOrg.set(organizationId, next);
    return next;
  },

  resetForTests(): void {
    tasksByOrg.clear();
  },
};
