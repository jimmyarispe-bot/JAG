/**
 * Sprint 212 — Default drafts for a new onboarding session.
 */

import { CONNECTOR_CATALOG } from "@/lib/connectors/catalog";
import { DEFAULT_ONBOARDING_CAPABILITY_IDS } from "./steps";
import type {
  OnboardingBrandDraft,
  OnboardingConnectorSelection,
  OnboardingMissionDraft,
  OnboardingOrganizationDraft,
  OnboardingSession,
} from "./types";

export function defaultOrganizationDraft(): OnboardingOrganizationDraft {
  return {
    organizationName: "",
    subdomain: "",
    industry: "education",
    timezone: "America/New_York",
    logoUrl: "",
    country: "US",
  };
}

export function defaultBrandDraft(): OnboardingBrandDraft {
  return {
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#0D9488",
    headingFont: "Source Serif 4",
    bodyFont: "IBM Plex Sans",
    lightLogoUrl: "",
    darkLogoUrl: "",
  };
}

export function defaultMissionDraft(): OnboardingMissionDraft {
  return {
    mission: "",
    vision: "",
    coreValues: [],
    strategicPillars: [],
    goals: [],
  };
}

/** Highlight productivity / CRM / finance / HR / SIS style connectors. */
export function defaultConnectorSelections(): OnboardingConnectorSelection[] {
  const preferred = new Set([
    "google-workspace",
    "microsoft-365",
    "quickbooks-online",
    "hubspot",
    "salesforce",
    "bamboohr",
    "powerschool",
    "canvas-lms",
  ]);

  const fromCatalog = CONNECTOR_CATALOG.filter(
    (c) =>
      preferred.has(c.id) ||
      c.category === "Productivity" ||
      c.category === "Finance" ||
      c.category === "CRM" ||
      c.category === "HR" ||
      c.category === "Education"
  ).slice(0, 16);

  // Always include calendar/email conceptual rows even if catalog labels differ.
  const extras: OnboardingConnectorSelection[] = [
    {
      connectorId: "calendar",
      label: "Calendar",
      category: "Productivity",
      selected: false,
      connected: false,
    },
    {
      connectorId: "email",
      label: "Email",
      category: "Productivity",
      selected: false,
      connected: false,
    },
    {
      connectorId: "sis",
      label: "SIS",
      category: "Education",
      selected: false,
      connected: false,
    },
  ];

  const mapped: OnboardingConnectorSelection[] = fromCatalog.map((c) => ({
    connectorId: c.id,
    label: c.displayName,
    category: c.category,
    selected: c.id === "google-workspace" || c.id === "quickbooks-online",
    connected: false,
  }));

  const ids = new Set(mapped.map((m) => m.connectorId));
  for (const e of extras) {
    if (!ids.has(e.connectorId)) mapped.push(e);
  }
  return mapped;
}

export function createEmptySession(input: {
  ownerUserId: string;
  ownerEmail: string;
  displayName?: string;
}): OnboardingSession {
  const at = new Date().toISOString();
  const id = `onboarding.${input.ownerUserId}.${Date.now().toString(36)}`;
  return {
    id,
    ownerUserId: input.ownerUserId,
    ownerEmail: input.ownerEmail,
    status: "not_started",
    currentStep: "welcome",
    completedSteps: [],
    organization: defaultOrganizationDraft(),
    brand: defaultBrandDraft(),
    executives: input.displayName
      ? [
          {
            id: `exec.founder.${input.ownerUserId}`,
            name: input.displayName,
            role: "founder",
            email: input.ownerEmail,
            title: "Founder",
          },
        ]
      : [],
    mission: defaultMissionDraft(),
    enabledCapabilityIds: [...DEFAULT_ONBOARDING_CAPABILITY_IDS],
    connectors: defaultConnectorSelections(),
    organizationId: null,
    briefingId: null,
    readinessScore: 10,
    estimatedMinutesRemaining: 30,
    startedAt: at,
    updatedAt: at,
    completedAt: null,
    lastError: null,
  };
}
