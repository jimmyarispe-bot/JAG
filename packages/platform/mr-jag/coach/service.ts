/**
 * MrJagCoachService — event-driven, role-aware proactive guidance.
 */

import { normalizePersona } from "../personas";
import { listRegisteredWalkthroughs } from "../tutorials/registry";
import type { CoachTip, CoachTrigger, MrJagPersona } from "../types";

const TRIGGER_CATALOG: readonly {
  trigger: CoachTrigger;
  personas: readonly MrJagPersona[];
  title: string;
  body: string;
  pageId?: string;
  priority: number;
}[] = [
  {
    trigger: "first_login",
    personas: [
      "Founder",
      "Executive",
      "School Leader",
      "Teacher",
      "Admissions",
      "Finance",
      "HR",
      "Parent",
      "Student",
    ],
    title: "Welcome — start your onboarding path",
    body: "Mr. JAG can walk you through your first tasks. Open Academy to continue learning.",
    priority: 100,
  },
  {
    trigger: "first_student",
    personas: ["Teacher", "Admissions", "School Leader"],
    title: "Your first student is ready",
    body: "Review the student profile, then try attendance or the enrollment walkthrough.",
    pageId: "aos.attendance",
    priority: 90,
  },
  {
    trigger: "first_invoice",
    personas: ["Finance", "School Leader", "Parent"],
    title: "First invoice created",
    body: "Confirm the family account, due date, and notification channel before sending.",
    pageId: "academyos.finance.2",
    priority: 90,
  },
  {
    trigger: "first_payroll",
    personas: ["HR", "Finance", "School Leader"],
    title: "First payroll preparation",
    body: "Validate timesheets and certifications before exporting payroll.",
    pageId: "academyos.hr.2",
    priority: 85,
  },
  {
    trigger: "first_intervention",
    personas: ["Teacher", "School Leader"],
    title: "First intervention assigned",
    body: "Document goals and notify the family through Communications.",
    priority: 80,
  },
  {
    trigger: "first_attendance",
    personas: ["Teacher"],
    title: "Great — first attendance saved",
    body: "Launch the attendance walkthrough anytime you need a refresher.",
    pageId: "aos.attendance",
    priority: 70,
  },
  {
    trigger: "first_invite",
    personas: ["HR", "School Leader", "Founder"],
    title: "Invitation sent",
    body: "Track activation status and remind the user to complete MFA if required.",
    priority: 75,
  },
];

export class MrJagCoachService {
  tipsForEvent(input: {
    trigger: CoachTrigger;
    persona?: string | null;
  }): readonly CoachTip[] {
    const persona = normalizePersona(input.persona);
    const walks = listRegisteredWalkthroughs({ persona });
    const tips = TRIGGER_CATALOG.filter(
      (t) =>
        t.trigger === input.trigger &&
        t.personas.includes(persona)
    ).map((t, idx) => {
      const walk =
        (t.pageId &&
          walks.find((w) => w.pageId === t.pageId)) ||
        walks[0];
      return {
        id: `coach:${t.trigger}:${persona}:${idx}`,
        trigger: t.trigger,
        persona,
        title: t.title,
        body: t.body,
        pageId: t.pageId,
        walkthroughId: walk?.id,
        priority: t.priority,
      } satisfies CoachTip;
    });
    tips.sort((a, b) => b.priority - a.priority);
    return Object.freeze(tips);
  }

  observe(input: {
    events: readonly CoachTrigger[];
    persona?: string | null;
  }): readonly CoachTip[] {
    const all = input.events.flatMap((trigger) =>
      this.tipsForEvent({ trigger, persona: input.persona })
    );
    const seen = new Set<string>();
    const deduped: CoachTip[] = [];
    for (const tip of all.sort((a, b) => b.priority - a.priority)) {
      if (seen.has(tip.id)) continue;
      seen.add(tip.id);
      deduped.push(tip);
    }
    return Object.freeze(deduped.slice(0, 8));
  }
}

export function createMrJagCoachService(): MrJagCoachService {
  return new MrJagCoachService();
}
