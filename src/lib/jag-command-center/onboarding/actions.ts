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
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export type OnboardingActionResult =
  | { readonly ok: true; readonly session: OnboardingSession }
  | { readonly ok: false; readonly error: string; readonly session?: OnboardingSession };

async function requireOwnerSession() {
  const platform = await getJagPlatformSession();
  if (!platform) {
    return {
      ok: false as const,
      error: `Sign in required (${JAG_PLATFORM_LOGIN_PATH}).`,
    };
  }
  const session = ExecutiveOnboardingService.getOrCreateSession({
    ownerUserId: platform.userId,
    ownerEmail: platform.email,
    displayName: platform.displayName,
  });
  return { ok: true as const, platform, session };
}

function revalidateOnboarding() {
  revalidatePath("/jag/onboarding");
  revalidatePath("/jag");
  revalidatePath("/jag/briefings");
  revalidatePath("/jag/settings/branding");
}

export async function saveOnboardingOrganizationAction(
  draft: Partial<OnboardingOrganizationDraft>
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateOrganization(
    auth.session.id,
    draft
  );
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function saveOnboardingBrandAction(
  draft: Partial<OnboardingBrandDraft>
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateBrand(auth.session.id, draft);
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function saveOnboardingExecutivesAction(
  executives: readonly OnboardingExecutiveMember[]
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateExecutives(
    auth.session.id,
    executives
  );
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function saveOnboardingMissionAction(
  draft: Partial<OnboardingMissionDraft>
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateMission(
    auth.session.id,
    draft
  );
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function saveOnboardingCapabilitiesAction(
  enabledCapabilityIds: readonly string[]
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateCapabilities(
    auth.session.id,
    enabledCapabilityIds
  );
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function saveOnboardingConnectorsAction(
  connectors: readonly OnboardingConnectorSelection[]
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const session = ExecutiveOnboardingService.updateConnectors(
    auth.session.id,
    connectors
  );
  if (!session) return { ok: false, error: "Session not found." };
  revalidateOnboarding();
  return { ok: true, session };
}

export async function completeOnboardingStepAction(): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.completeCurrentStep(auth.session.id);
  if (!result.ok || !result.session) {
    return {
      ok: false,
      error: result.error ?? "Could not complete step.",
      session: result.session ?? undefined,
    };
  }
  revalidateOnboarding();
  return { ok: true, session: result.session };
}

export async function goToOnboardingStepAction(
  step: OnboardingStepId
): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.goToStep(auth.session.id, step);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot navigate.", session: result.session ?? undefined };
  }
  revalidateOnboarding();
  return { ok: true, session: result.session };
}

export async function goBackOnboardingStepAction(): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.goBack(auth.session.id);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot go back." };
  }
  revalidateOnboarding();
  return { ok: true, session: result.session };
}

export async function pauseOnboardingAction(): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.pause(auth.session.id);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot pause." };
  }
  revalidateOnboarding();
  return { ok: true, session: result.session };
}

export async function resumeOnboardingAction(): Promise<OnboardingActionResult> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;
  const result = ExecutiveOnboardingService.resume(auth.session.id);
  if (!result.ok || !result.session) {
    return { ok: false, error: result.error ?? "Cannot resume." };
  }
  revalidateOnboarding();
  return { ok: true, session: result.session };
}

export async function generateOnboardingWorkspaceAction(): Promise<
  | {
      readonly ok: true;
      readonly session: OnboardingSession;
      readonly organizationId: string;
      readonly briefingId: string;
    }
  | { readonly ok: false; readonly error: string; readonly session?: OnboardingSession }
> {
  const auth = await requireOwnerSession();
  if (!auth.ok) return auth;

  // Ensure review step is complete before generate.
  if (
    !auth.session.completedSteps.includes("review") &&
    auth.session.currentStep !== "generate_workspace" &&
    auth.session.currentStep !== "review"
  ) {
    return {
      ok: false,
      error: "Complete the review step before generating the workspace.",
      session: auth.session,
    };
  }

  // If still on review, complete it first.
  let session = auth.session;
  if (session.currentStep === "review") {
    const completed = ExecutiveOnboardingService.completeCurrentStep(session.id);
    if (!completed.ok || !completed.session) {
      return {
        ok: false,
        error: completed.error ?? "Review validation failed.",
        session: completed.session ?? undefined,
      };
    }
    session = completed.session;
  }

  const result = ExecutiveOnboardingService.generateWorkspace(
    session.id,
    auth.platform.displayName || auth.platform.email
  );

  if (!result.ok) {
    return { ok: false, error: result.error, session: result.session };
  }

  revalidateOnboarding();
  revalidatePath(`/jag/briefings/${result.briefingId}`);
  return {
    ok: true,
    session: result.session,
    organizationId: result.organizationId,
    briefingId: result.briefingId,
  };
}
