/**
 * Sprint 212 — Executive onboarding façade (application layer).
 */

import { ensureCapabilitiesRegistered } from "@/lib/platform/capabilities";
import { CapabilityLoader } from "@/lib/platform/capabilities/CapabilityLoader";
import { ChecklistService } from "./ChecklistService";
import { createEmptySession } from "./defaults";
import { OnboardingStateMachine } from "./OnboardingStateMachine";
import {
  listOnboardingObservations,
  recordOnboardingObservation,
  summarizeDropOffPoints,
} from "./OnboardingObservability";
import { OrganizationProvisioningService } from "./OrganizationProvisioningService";
import { ProgressTracker } from "./ProgressTracker";
import {
  getOnboardingSession,
  getOnboardingSessionForOwner,
  resetOnboardingSessionsForTests,
  saveOnboardingSession,
} from "./session-store";
import { TenantProvisioner } from "./TenantProvisioner";
import type {
  OnboardingBrandDraft,
  OnboardingConnectorSelection,
  OnboardingExecutiveMember,
  OnboardingMissionDraft,
  OnboardingOrganizationDraft,
  OnboardingSession,
  OnboardingStepId,
  ProvisionWorkspaceResult,
} from "./types";
import { WelcomeService } from "./WelcomeService";
import { generateWelcomeExecutiveBrief } from "./welcome-brief";

function persist(session: OnboardingSession): OnboardingSession {
  const progress = ProgressTracker.compute(session);
  return saveOnboardingSession({
    ...session,
    readinessScore: progress.readinessScore,
    estimatedMinutesRemaining: progress.estimatedMinutesRemaining,
    updatedAt: new Date().toISOString(),
  });
}

function validateStep(
  session: OnboardingSession,
  step: OnboardingStepId
): string | null {
  switch (step) {
    case "welcome":
      return null;
    case "organization":
      return OrganizationProvisioningService.validateOrganizationDraft(session);
    case "brand":
      if (!session.brand.primaryColor || !session.brand.accentColor) {
        return "Primary and accent colors are required.";
      }
      return null;
    case "executive_profile":
      if (session.executives.length === 0) {
        return "Add at least one executive (founder or CEO).";
      }
      return null;
    case "mission_strategy":
      if (!session.mission.mission.trim()) return "Mission is required.";
      return null;
    case "capabilities":
      if (session.enabledCapabilityIds.length === 0) {
        return "Select at least one capability.";
      }
      return null;
    case "connect_systems":
      return null; // connectors optional but encouraged
    case "review":
      return OrganizationProvisioningService.validateOrganizationDraft(session);
    case "generate_workspace":
      return OrganizationProvisioningService.validateOrganizationDraft(session);
    default:
      return null;
  }
}

export const ExecutiveOnboardingService = {
  getOrCreateSession(input: {
    ownerUserId: string;
    ownerEmail: string;
    displayName?: string;
  }): OnboardingSession {
    const existing = getOnboardingSessionForOwner(input.ownerUserId);
    if (existing) return existing;
    const created = createEmptySession(input);
    const saved = persist(created);
    recordOnboardingObservation({
      kind: "step_entered",
      sessionId: saved.id,
      stepId: "welcome",
      detail: "Onboarding session created",
    });
    return saved;
  },

  getSession(sessionId: string): OnboardingSession | null {
    return getOnboardingSession(sessionId);
  },

  getSessionForOwner(ownerUserId: string): OnboardingSession | null {
    return getOnboardingSessionForOwner(ownerUserId);
  },

  updateOrganization(
    sessionId: string,
    draft: Partial<OnboardingOrganizationDraft>
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    let subdomain = draft.subdomain ?? session.organization.subdomain;
    if (draft.organizationName && !draft.subdomain && !session.organization.subdomain) {
      subdomain = draft.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
    }
    return persist({
      ...session,
      organization: {
        ...session.organization,
        ...draft,
        subdomain: (subdomain || "").toLowerCase(),
      },
      status: session.status === "not_started" ? "in_progress" : session.status,
    });
  },

  updateBrand(
    sessionId: string,
    draft: Partial<OnboardingBrandDraft>
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    return persist({
      ...session,
      brand: { ...session.brand, ...draft },
    });
  },

  updateExecutives(
    sessionId: string,
    executives: readonly OnboardingExecutiveMember[]
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    return persist({ ...session, executives: [...executives] });
  },

  updateMission(
    sessionId: string,
    draft: Partial<OnboardingMissionDraft>
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    return persist({
      ...session,
      mission: {
        ...session.mission,
        ...draft,
        coreValues: draft.coreValues
          ? [...draft.coreValues]
          : session.mission.coreValues,
        strategicPillars: draft.strategicPillars
          ? [...draft.strategicPillars]
          : session.mission.strategicPillars,
        goals: draft.goals ? [...draft.goals] : session.mission.goals,
      },
    });
  },

  updateCapabilities(
    sessionId: string,
    enabledCapabilityIds: readonly string[]
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    return persist({
      ...session,
      enabledCapabilityIds: [...enabledCapabilityIds],
    });
  },

  updateConnectors(
    sessionId: string,
    connectors: readonly OnboardingConnectorSelection[]
  ): OnboardingSession | null {
    const session = getOnboardingSession(sessionId);
    if (!session) return null;
    const prev = new Map(session.connectors.map((c) => [c.connectorId, c]));
    for (const c of connectors) {
      const before = prev.get(c.connectorId);
      if (c.connected && !before?.connected) {
        recordOnboardingObservation({
          kind: "connector_success",
          sessionId,
          stepId: "connect_systems",
          detail: `Connected ${c.label}`,
          metadata: { connectorId: c.connectorId },
        });
      }
    }
    return persist({ ...session, connectors: [...connectors] });
  },

  completeCurrentStep(sessionId: string): {
    ok: boolean;
    error?: string;
    session: OnboardingSession | null;
  } {
    const session = getOnboardingSession(sessionId);
    if (!session) return { ok: false, error: "Session not found.", session: null };

    const error = validateStep(session, session.currentStep);
    if (error) {
      recordOnboardingObservation({
        kind: "validation_failure",
        sessionId,
        stepId: session.currentStep,
        detail: error,
      });
      return {
        ok: false,
        error,
        session: persist({ ...session, lastError: error }),
      };
    }

    const transition = OnboardingStateMachine.completeStep(
      session,
      session.currentStep
    );
    if (!transition.ok) {
      return { ok: false, error: transition.error, session };
    }

    recordOnboardingObservation({
      kind: "step_completed",
      sessionId,
      stepId: session.currentStep,
      detail: `Completed ${session.currentStep}`,
    });

    if (transition.session.currentStep !== session.currentStep) {
      recordOnboardingObservation({
        kind: "step_entered",
        sessionId,
        stepId: transition.session.currentStep,
        detail: `Entered ${transition.session.currentStep}`,
      });
    }

    return { ok: true, session: persist(transition.session) };
  },

  goToStep(sessionId: string, step: OnboardingStepId): {
    ok: boolean;
    error?: string;
    session: OnboardingSession | null;
  } {
    const session = getOnboardingSession(sessionId);
    if (!session) return { ok: false, error: "Session not found.", session: null };
    const transition = OnboardingStateMachine.enterStep(session, step);
    if (!transition.ok) {
      return { ok: false, error: transition.error, session };
    }
    recordOnboardingObservation({
      kind: "step_entered",
      sessionId,
      stepId: step,
      detail: `Navigated to ${step}`,
    });
    return { ok: true, session: persist(transition.session) };
  },

  goBack(sessionId: string) {
    const session = getOnboardingSession(sessionId);
    if (!session) return { ok: false as const, error: "Session not found.", session: null };
    const transition = OnboardingStateMachine.goBack(session);
    if (!transition.ok) {
      return { ok: false as const, error: transition.error, session };
    }
    return { ok: true as const, session: persist(transition.session) };
  },

  pause(sessionId: string) {
    const session = getOnboardingSession(sessionId);
    if (!session) return { ok: false as const, error: "Session not found.", session: null };
    const transition = OnboardingStateMachine.pause(session);
    if (!transition.ok) {
      return { ok: false as const, error: transition.error, session };
    }
    recordOnboardingObservation({
      kind: "paused",
      sessionId,
      stepId: session.currentStep,
      detail: "Onboarding paused — progress persisted",
    });
    return { ok: true as const, session: persist(transition.session) };
  },

  resume(sessionId: string) {
    const session = getOnboardingSession(sessionId);
    if (!session) return { ok: false as const, error: "Session not found.", session: null };
    const transition = OnboardingStateMachine.resume(session);
    if (!transition.ok) {
      return { ok: false as const, error: transition.error, session };
    }
    recordOnboardingObservation({
      kind: "resumed",
      sessionId,
      stepId: transition.session.currentStep,
      detail: "Onboarding resumed",
    });
    return { ok: true as const, session: persist(transition.session) };
  },

  generateWorkspace(
    sessionId: string,
    generatedBy: string
  ): ProvisionWorkspaceResult {
    const session = getOnboardingSession(sessionId);
    if (!session) {
      return {
        ok: false,
        error: "Session not found.",
        session: createEmptySession({
          ownerUserId: "unknown",
          ownerEmail: "unknown",
        }),
      };
    }

    const started = Date.now();
    recordOnboardingObservation({
      kind: "provisioning",
      sessionId,
      stepId: "generate_workspace",
      detail: "Workspace generation started",
    });

    const orgResult =
      OrganizationProvisioningService.provisionFromSession(session);
    if (!orgResult.ok) {
      const failed = OnboardingStateMachine.markFailed(session, orgResult.error);
      return { ok: false, error: orgResult.error, session: persist(failed) };
    }

    const organizationId = orgResult.organization.organizationId;
    TenantProvisioner.provisionTenant(session, organizationId);

    // Mark selected connectors as connected for onboarding (stub handshake).
    const connectors = session.connectors.map((c) =>
      c.selected ? { ...c, connected: true } : c
    );
    for (const c of connectors.filter((x) => x.selected)) {
      recordOnboardingObservation({
        kind: "connector_success",
        sessionId,
        stepId: "connect_systems",
        detail: `Connector ready: ${c.label}`,
        metadata: { connectorId: c.connectorId },
      });
    }

    const briefingId = generateWelcomeExecutiveBrief(
      { ...session, connectors, organizationId },
      organizationId,
      orgResult.organization.organizationName,
      generatedBy
    );

    let next: OnboardingSession = {
      ...session,
      connectors,
      organizationId,
      briefingId,
      status: "in_progress",
    };

    // Complete generate_workspace + mark finished.
    const completedStep = OnboardingStateMachine.completeStep(
      next,
      "generate_workspace"
    );
    if (completedStep.ok) next = completedStep.session;
    next = OnboardingStateMachine.markCompleted(next);
    next = persist(next);

    ChecklistService.seedForOrganization(next);

    const elapsedSec = Math.round((Date.now() - started) / 1000);
    recordOnboardingObservation({
      kind: "workspace_generated",
      sessionId,
      detail: `Workspace generated in ${elapsedSec}s`,
      metadata: {
        organizationId,
        briefingId,
        elapsedSec: String(elapsedSec),
      },
    });
    recordOnboardingObservation({
      kind: "completed",
      sessionId,
      detail: `Onboarding completed for ${orgResult.organization.organizationName}`,
      metadata: { organizationId, briefingId },
    });

    return {
      ok: true,
      organizationId,
      briefingId,
      session: next,
    };
  },

  listDiscoverableCapabilities(): readonly {
    id: string;
    label: string;
    description: string;
  }[] {
    ensureCapabilitiesRegistered();
    return CapabilityLoader.listCapabilities().map((c) => ({
      id: c.manifest.id,
      label: c.manifest.name,
      description: c.manifest.description,
    }));
  },

  welcome() {
    return WelcomeService.introduce();
  },

  progress(session: OnboardingSession) {
    return ProgressTracker.compute(session);
  },

  observations(sessionId?: string, limit = 30) {
    return listOnboardingObservations(limit, sessionId);
  },

  dropOffPoints() {
    return summarizeDropOffPoints();
  },

  inboxTasks(organizationId: string | null) {
    if (!organizationId) return [];
    return ChecklistService.listForOrganization(organizationId);
  },

  resetForTests(): void {
    resetOnboardingSessionsForTests();
    ChecklistService.resetForTests();
  },
};
