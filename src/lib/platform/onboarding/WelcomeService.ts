/**
 * Sprint 212 — Welcome copy + first executive brief payload.
 */

import { POWERED_BY_LINE, THE_JAG_MARK } from "@/lib/platform/branding";
import type { OnboardingSession } from "./types";

export type WelcomeContent = {
  readonly headline: string;
  readonly subhead: string;
  readonly whatHappens: readonly string[];
  readonly poweredBy: string;
};

export type WelcomeBriefPayload = {
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly nextSteps: readonly string[];
};

export const WelcomeService = {
  introduce(): WelcomeContent {
    return {
      headline: `Welcome to ${THE_JAG_MARK}`,
      subhead:
        "Create your branded Executive Intelligence Platform in under 30 minutes.",
      whatHappens: [
        "Define your organization identity and subdomain.",
        "Apply your brand — colors, fonts, and logos.",
        "Capture executive profiles and mission strategy.",
        "Enable intelligence capabilities and connect systems.",
        "Generate your workspace and Welcome Executive Brief.",
      ],
      poweredBy: POWERED_BY_LINE,
    };
  },

  buildWelcomeBrief(session: OnboardingSession): WelcomeBriefPayload {
    const org = session.organization.organizationName || "Your organization";
    const caps =
      session.enabledCapabilityIds.length > 0
        ? session.enabledCapabilityIds.join(", ")
        : "None selected";
    const systems = session.connectors
      .filter((c) => c.selected || c.connected)
      .map((c) => c.label);
    const goals = session.mission.goals.filter((g) => g.trim());

    return {
      title: `Welcome Executive Brief — ${org}`,
      summary: `${org} is now configured as an Executive Intelligence Platform. ${POWERED_BY_LINE}`,
      bullets: [
        `Organization: ${org} (${session.organization.subdomain || "pending"}.thejag.org)`,
        `Industry: ${session.organization.industry || "Not set"} · Timezone: ${session.organization.timezone || "Not set"}`,
        `Capabilities enabled: ${caps}`,
        `Connected / selected systems: ${systems.length ? systems.join(", ") : "None yet"}`,
        `Mission: ${session.mission.mission.trim() || "Not captured"}`,
        `Strategic goals: ${goals.length ? goals.join("; ") : "None captured"}`,
      ],
      nextSteps: [
        "Complete remaining system integrations.",
        "Invite executives to the Command Center.",
        "Refine branding in Settings → Branding.",
        "Review strategy in Strategic Intelligence.",
        "Create your first decision in Decision Intelligence.",
      ],
    };
  },
};
