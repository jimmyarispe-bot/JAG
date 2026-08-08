"use server";

import { revalidatePath } from "next/cache";
import {
  ExecutiveOnboardingService,
  type OnboardingBrandDraft,
  type OnboardingConnectorSelection,
  type OnboardingExecutiveMember,
  type OnboardingMissionDraft,
  type OnboardingOrganizationDraft,
  type OnboardingSession,
  type OnboardingStepId,
} from "@/lib/platform/onboarding";
import type { OnboardingResponseKind } from "@/lib/platform/onboarding/session-merge";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import {
  getJagPlatformSession,
  rebindJagPlatformSessionOrganization,
} from "@/lib/jag-platform/server-session";
import { onboardingDiag } from "@/lib/platform/onboarding/onboarding-diag";

export type OnboardingActionResult =
  | {
      readonly ok: true;
      readonly session: OnboardingSession;
      readonly kind: OnboardingResponseKind;
      readonly requestedStep?: OnboardingStepId;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly session?: OnboardingSession;
      readonly kind?: OnboardingResponseKind;
      readonly requestedStep?: OnboardingStepId;
    };

function progressScore(session: OnboardingSession): number {
  return (
    session.completedSteps.length * 10 +
    (session.organization.organizationName.trim() ? 1 : 0) +
    (session.status === "not_started" ? 0 : 2)
  );
}

async function requireOwnerSession(clientSnapshot?: OnboardingSession) {
  const platform = await getJagPlatformSession();
  if (!platform) {
    return {
      ok: false as const,
      error: `Sign in required (${JAG_PLATFORM_LOGIN_PATH}).`,
    };
  }

  let session = ExecutiveOnboardingService.getSessionForOwner(platform.userId);

  const snapshotUsable =
    Boolean(clientSnapshot) &&
    clientSnapshot!.ownerUserId === platform.userId;

  // Cold worker / empty Welcome in memory: prefer validated client snapshot.
  if (snapshotUsable) {
    const snap = clientSnapshot!;
    const memoryIsEmptyWelcome =
      !session ||
      (session.completedSteps.length === 0 &&
        session.currentStep === "welcome" &&
        !session.organization.organizationName.trim() &&
        progressScore(snap) > progressScore(session));

    if (!session || memoryIsEmptyWelcome) {
      const restored = ExecutiveOnboardingService.restoreFromClientSnapshot(
        { ownerUserId: platform.userId, ownerEmail: platform.email },
        snap
      );
      if (restored) {
        session = restored;
        onboardingDiag({
          source: "server.restore.memoryMiss",
          action: "requireOwnerSession",
          beforeStep: snap.currentStep,
          afterStep: session.currentStep,
          sessionStep: session.currentStep,
          sessionId: session.id,
          organizationId: session.organizationId,
          sessionUpdatedAt: session.updatedAt,
          detail: "Restored client snapshot; skipped Welcome create",
        });
      }
    } else if (
      session &&
      snap.id === session.id &&
      Date.parse(snap.updatedAt) > Date.parse(session.updatedAt)
    ) {
      const restored = ExecutiveOnboardingService.restoreFromClientSnapshot(
        { ownerUserId: platform.userId, ownerEmail: platform.email },
        snap
      );
      if (restored) {
        session = restored;
        onboardingDiag({
          source: "server.restore.clientAhead",
          action: "requireOwnerSession",
          sessionStep: session.currentStep,
          sessionId: session.id,
          organizationId: session.organizationId,
          sessionUpdatedAt: session.updatedAt,
          detail: "Restored newer client snapshot over stale memory",
        });
      }
    }
  }

  if (!session) {
    // Only create Welcome when there is truly no client progress to restore.
    session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: platform.userId,
      ownerEmail: platform.email,
      displayName: platform.displayName,
    });
    onboardingDiag({
      source: "server.getOrCreate",
      action: "requireOwnerSession",
      sessionStep: session.currentStep,
      sessionId: session.id,
      organizationId: session.organizationId,
      sessionUpdatedAt: session.updatedAt,
      detail: snapshotUsable
        ? "Create after failed restore"
        : "Created new empty session (Welcome)",
    });
  }

  return { ok: true as const, platform, session };
}

function fieldResult(
  session: OnboardingSession
): Extract<OnboardingActionResult, { ok: true }> {
  return { ok: true, session, kind: "field_save" };
}

function navResult(
  session: OnboardingSession,
  requestedStep?: OnboardingStepId
): Extract<OnboardingActionResult, { ok: true }> {
  return {
    ok: true,
    session,
    kind: "navigation",
    requestedStep: requestedStep ?? session.currentStep,
  };
}

export async function saveOnboardingOrganizationAction(
  draft: Partial<OnboardingOrganizationDraft>,
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateOrganization(
    auth.session.id,
    draft
  );
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function saveOnboardingBrandAction(
  draft: Partial<OnboardingBrandDraft>,
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateBrand(auth.session.id, draft);
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function saveOnboardingExecutivesAction(
  executives: readonly OnboardingExecutiveMember[],
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateExecutives(
    auth.session.id,
    executives
  );
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function saveOnboardingMissionAction(
  draft: Partial<OnboardingMissionDraft>,
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateMission(
    auth.session.id,
    draft
  );
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function saveOnboardingCapabilitiesAction(
  enabledCapabilityIds: readonly string[],
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateCapabilities(
    auth.session.id,
    enabledCapabilityIds
  );
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function saveOnboardingConnectorsAction(
  connectors: readonly OnboardingConnectorSelection[],
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateConnectors(
    auth.session.id,
    connectors
  );
  if (!session) return { ok: false, error: "Session not found." };
  return fieldResult(session);
}

export async function completeOnboardingStepAction(
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.completeCurrentStep(auth.session.id);
  if (!result.ok || !result.session) {
    return {
      ok: false,
      error: result.error ?? "Could not complete step.",
      session: result.session ?? undefined,
      kind: "navigation",
    };
  }
  // No revalidatePath — remount races with in-flight field saves.
  return navResult(result.session, result.session.currentStep);
}

export async function goToOnboardingStepAction(
  step: OnboardingStepId,
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.goToStep(auth.session.id, step);
  if (!result.ok || !result.session) {
    return {
      ok: false,
      error: result.error ?? "Cannot navigate.",
      session: result.session ?? undefined,
      kind: "navigation",
      requestedStep: step,
    };
  }
  return navResult(result.session, step);
}

export async function goBackOnboardingStepAction(
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.goBack(auth.session.id);
  if (!result.ok || !result.session) {
    return {
      ok: false,
      error: result.error ?? "Cannot go back.",
      kind: "navigation",
    };
  }
  return navResult(result.session, result.session.currentStep);
}

export async function pauseOnboardingAction(
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.pause(auth.session.id);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot pause.", kind: "navigation" };
  }
  return navResult(result.session, result.session.currentStep);
}

export async function resumeOnboardingAction(
  clientSnapshot?: OnboardingSession
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.resume(auth.session.id);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot resume.", kind: "navigation" };
  }
  return navResult(result.session, result.session.currentStep);
}

export async function generateOnboardingWorkspaceAction(
  clientSnapshot?: OnboardingSession
): Promise<
  | {
      readonly ok: true;
      readonly session: OnboardingSession;
      readonly organizationId: string;
      readonly briefingId: string;
      readonly workspaceHref: string;
      readonly kind: "navigation";
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly session?: OnboardingSession;
      readonly kind?: OnboardingResponseKind;
    }
> {
  const auth = await requireOwnerSession(clientSnapshot);
  if (!auth.ok) return auth;

  if (
    !auth.session.completedSteps.includes("review") &&
    auth.session.currentStep !== "generate_workspace" &&
    auth.session.currentStep !== "review"
  ) {
    return {
      ok: false,
      error: "Complete the review step before generating the workspace.",
      session: auth.session,
      kind: "navigation",
    };
  }

  let session = auth.session;
  if (session.currentStep === "review") {
    const completed = ExecutiveOnboardingService.completeCurrentStep(session.id);
    if (!completed.ok || !completed.session) {
      return {
        ok: false,
        error: completed.error ?? "Review validation failed.",
        session: completed.session ?? undefined,
        kind: "navigation",
      };
    }
    session = completed.session;
  }

  const result = ExecutiveOnboardingService.generateWorkspace(
    session.id,
    auth.platform.displayName || auth.platform.email
  );

  if (!result.ok) {
    return { ok: false, error: result.error, session: result.session, kind: "navigation" };
  }

  // Bind the authenticated JAG cookie to the newly provisioned organization
  // so /jag is organization-scoped (not platform/global fallback).
  const bound = await rebindJagPlatformSessionOrganization(result.organizationId);
  if (!bound.ok) {
    onboardingDiag({
      source: "action.generateWorkspace.rebindFailed",
      detail: bound.error,
      organizationId: result.organizationId,
      sessionId: result.session.id,
    });
  } else {
    onboardingDiag({
      source: "action.generateWorkspace.rebindOk",
      detail: `Session bound to ${result.organizationId}`,
      organizationId: result.organizationId,
      sessionId: result.session.id,
    });
  }

  const workspaceHref = `/jag?org=${encodeURIComponent(result.organizationId)}`;

  // Workspace generation is the only onboarding path that needs cache refresh.
  revalidatePath("/jag/onboarding");
  revalidatePath("/jag");
  revalidatePath("/jag/briefings");
  revalidatePath("/jag/settings/branding");
  revalidatePath(`/jag/briefings/${result.briefingId}`);
  return {
    ok: true,
    session: result.session,
    organizationId: result.organizationId,
    briefingId: result.briefingId,
    workspaceHref,
    kind: "navigation",
  };
}
