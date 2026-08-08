/**
 * Sprint 212 — Canonical onboarding step catalog.
 */

import type { OnboardingStepId } from "./types";
import { ONBOARDING_STEP_IDS } from "./types";

export type OnboardingStepDefinition = {
  readonly id: OnboardingStepId;
  readonly index: number;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
};

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
  {
    id: "welcome",
    index: 1,
    title: "Welcome",
    description: "Introduce The JAG™ and what happens next.",
    estimatedMinutes: 2,
  },
  {
    id: "organization",
    index: 2,
    title: "Organization",
    description: "Name, subdomain, industry, timezone, and logo.",
    estimatedMinutes: 4,
  },
  {
    id: "brand",
    index: 3,
    title: "Brand",
    description: "Colors, fonts, theme, and live preview.",
    estimatedMinutes: 4,
  },
  {
    id: "executive_profile",
    index: 4,
    title: "Executive Profile",
    description: "Founder, CEO, and executive team.",
    estimatedMinutes: 4,
  },
  {
    id: "mission_strategy",
    index: 5,
    title: "Mission & Strategy",
    description: "Mission, vision, values, pillars, and goals.",
    estimatedMinutes: 5,
  },
  {
    id: "capabilities",
    index: 6,
    title: "Capabilities",
    description: "Enable intelligence capabilities for the workspace.",
    estimatedMinutes: 3,
  },
  {
    id: "connect_systems",
    index: 7,
    title: "Connect Systems",
    description: "Select connectors for evidence and operations.",
    estimatedMinutes: 5,
  },
  {
    id: "review",
    index: 8,
    title: "Review",
    description: "Validate configuration and readiness score.",
    estimatedMinutes: 2,
  },
  {
    id: "generate_workspace",
    index: 9,
    title: "Generate Workspace",
    description: "Create organization, brand, capabilities, and workspace.",
    estimatedMinutes: 1,
  },
] as const;

export const TOTAL_ONBOARDING_MINUTES = ONBOARDING_STEPS.reduce(
  (sum, s) => sum + s.estimatedMinutes,
  0
);

export function getStepDefinition(
  id: OnboardingStepId
): OnboardingStepDefinition {
  return ONBOARDING_STEPS.find((s) => s.id === id) ?? ONBOARDING_STEPS[0]!;
}

export function nextStepId(current: OnboardingStepId): OnboardingStepId | null {
  const idx = ONBOARDING_STEP_IDS.indexOf(current);
  if (idx < 0 || idx >= ONBOARDING_STEP_IDS.length - 1) return null;
  return ONBOARDING_STEP_IDS[idx + 1]!;
}

export function previousStepId(
  current: OnboardingStepId
): OnboardingStepId | null {
  const idx = ONBOARDING_STEP_IDS.indexOf(current);
  if (idx <= 0) return null;
  return ONBOARDING_STEP_IDS[idx - 1]!;
}

/** Default capability ids recommended for a new Executive Intelligence Platform. */
export const DEFAULT_ONBOARDING_CAPABILITY_IDS = [
  "jag.intelligence.predictive",
  "jag.intelligence.conversation",
  "jag.intelligence.memory",
  "jag.intelligence.strategy",
  "jag.intelligence.watchers",
  "jag.decisions.center",
  "jag.intelligence.briefings",
  "jag.intelligence.scenarios",
  "jag.intelligence.explainability",
  "jag.intelligence.listening",
] as const;
