/**
 * Onboarding session concurrency helpers.
 *
 * Navigation state and field/data state are separate authorities:
 * - Field-save responses may update drafts but MUST NOT change currentStep.
 * - Explicit navigation (Continue / Back / goTo) owns currentStep.
 * - updatedAt alone must never decide the active step.
 */

import { mergeExecutiveLists } from "./executives";
import type { OnboardingSession, OnboardingStepId } from "./types";

export type OnboardingResponseKind = "field_save" | "navigation" | "restore";

export type OnboardingSessionUpdate = {
  readonly kind: OnboardingResponseKind;
  readonly session: OnboardingSession;
  /** For navigation: the step the user explicitly requested (when known). */
  readonly requestedStep?: OnboardingStepId;
};

/** Bump wall-clock updatedAt for optimistic client edits. */
export function bumpOnboardingSession(
  session: OnboardingSession
): OnboardingSession {
  return {
    ...session,
    updatedAt: new Date().toISOString(),
  };
}

function preferFilled(localValue: string, incomingValue: string): string {
  const incoming = incomingValue.trim();
  if (incoming) return incomingValue;
  return localValue;
}

/**
 * Merge field-save data into the client session without touching navigation.
 */
export function mergeFieldSaveIntoSession(
  local: OnboardingSession,
  incoming: OnboardingSession
): OnboardingSession {
  // Prefer same session id; if ids diverge, keep local navigation identity
  // but still absorb newer draft fields from the save when owner matches.
  if (
    local.ownerUserId !== incoming.ownerUserId ||
    local.status === "completed"
  ) {
    return local;
  }

  return {
    ...local,
    // Navigation authority stays with the client.
    currentStep: local.currentStep,
    completedSteps: local.completedSteps,
    status:
      local.status === "not_started" && incoming.status === "in_progress"
        ? "in_progress"
        : local.status === "paused"
          ? local.status
          : local.status,
    organization: {
      organizationName: preferFilled(
        local.organization.organizationName,
        incoming.organization.organizationName
      ),
      subdomain: preferFilled(
        local.organization.subdomain,
        incoming.organization.subdomain
      ),
      industry: preferFilled(
        local.organization.industry,
        incoming.organization.industry
      ),
      timezone: preferFilled(
        local.organization.timezone,
        incoming.organization.timezone
      ),
      logoUrl: preferFilled(
        local.organization.logoUrl,
        incoming.organization.logoUrl
      ),
      country: preferFilled(
        local.organization.country,
        incoming.organization.country
      ),
    },
    brand: incoming.brand,
    executives: mergeExecutiveLists(
      local.executives,
      incoming.executives,
      local.updatedAt,
      incoming.updatedAt
    ),
    mission: {
      mission: preferFilled(local.mission.mission, incoming.mission.mission),
      vision: preferFilled(local.mission.vision, incoming.mission.vision),
      coreValues: incoming.mission.coreValues.length
        ? incoming.mission.coreValues
        : local.mission.coreValues,
      strategicPillars: incoming.mission.strategicPillars.length
        ? incoming.mission.strategicPillars
        : local.mission.strategicPillars,
      goals: incoming.mission.goals.length
        ? incoming.mission.goals
        : local.mission.goals,
    },
    enabledCapabilityIds: incoming.enabledCapabilityIds.length
      ? incoming.enabledCapabilityIds
      : local.enabledCapabilityIds,
    connectors: incoming.connectors.length
      ? incoming.connectors
      : local.connectors,
    readinessScore: incoming.readinessScore,
    estimatedMinutesRemaining: incoming.estimatedMinutesRemaining,
    lastError: incoming.lastError,
    // Keep local id if we already navigated on this client; absorb org ids
    // only when local has none (never forge completion).
    organizationId: local.organizationId ?? incoming.organizationId,
    briefingId: local.briefingId ?? incoming.briefingId,
    updatedAt:
      Date.parse(incoming.updatedAt) >= Date.parse(local.updatedAt)
        ? incoming.updatedAt
        : local.updatedAt,
  };
}

/**
 * Apply an explicit navigation response. Requested step wins when provided.
 */
export function mergeNavigationIntoSession(
  local: OnboardingSession,
  incoming: OnboardingSession,
  requestedStep?: OnboardingStepId
): OnboardingSession {
  if (local.status === "completed" && incoming.status === "completed") {
    return incoming;
  }

  const step = requestedStep ?? incoming.currentStep;

  // Prefer incoming drafts when same id or richer progress; never lose local
  // field edits that are newer if incoming looks like an empty Welcome.
  const incomingIsEmptyWelcome =
    incoming.currentStep === "welcome" &&
    incoming.completedSteps.length === 0 &&
    !incoming.organization.organizationName.trim();

  if (incomingIsEmptyWelcome && local.completedSteps.length > 0) {
    return {
      ...local,
      currentStep: step,
      completedSteps:
        incoming.completedSteps.length >= local.completedSteps.length
          ? incoming.completedSteps
          : local.completedSteps,
      status: local.status === "not_started" ? "in_progress" : local.status,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...incoming,
    currentStep: step,
    // Preserve any newer local draft fields if navigation payload is behind
    // on the same id (e.g. continue raced with typing).
    organization:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.organization
        : incoming.organization,
    brand:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.brand
        : incoming.brand,
    executives:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.executives
        : incoming.executives,
    mission:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.mission
        : incoming.mission,
    enabledCapabilityIds:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.enabledCapabilityIds
        : incoming.enabledCapabilityIds,
    connectors:
      local.id === incoming.id &&
      Date.parse(local.updatedAt) > Date.parse(incoming.updatedAt)
        ? local.connectors
        : incoming.connectors,
    organizationId: incoming.organizationId ?? local.organizationId,
    briefingId: incoming.briefingId ?? local.briefingId,
  };
}

/**
 * Restore from storage / cold worker. Never regress past an explicit local
 * navigation that is ahead of the restore candidate.
 */
export function mergeRestoreIntoSession(
  local: OnboardingSession,
  incoming: OnboardingSession
): OnboardingSession {
  if (local.ownerUserId !== incoming.ownerUserId) return local;
  if (local.status === "completed") return local;

  const localProgress = local.completedSteps.length;
  const incomingProgress = incoming.completedSteps.length;

  // Prefer the richer draft identity.
  const base =
    incomingProgress > localProgress ||
    (incomingProgress === localProgress &&
      Date.parse(incoming.updatedAt) >= Date.parse(local.updatedAt))
      ? incoming
      : local;

  // Navigation: keep the more advanced step the user is already on locally
  // unless restore is clearly ahead in completed steps AND step index.
  const localStep = local.currentStep;
  const restoreStep = base.currentStep;
  const keepLocalStep =
    localProgress >= incomingProgress &&
    local.completedSteps.length > 0 &&
    localStep !== restoreStep;

  return {
    ...base,
    currentStep: keepLocalStep ? localStep : restoreStep,
    completedSteps:
      local.completedSteps.length >= base.completedSteps.length
        ? local.completedSteps
        : base.completedSteps,
    organization:
      local.organization.organizationName.trim() &&
      !base.organization.organizationName.trim()
        ? local.organization
        : base.organization,
    brand: base.brand,
    executives: base.executives.length ? base.executives : local.executives,
    mission: base.mission.mission.trim()
      ? base.mission
      : local.mission,
    enabledCapabilityIds: base.enabledCapabilityIds.length
      ? base.enabledCapabilityIds
      : local.enabledCapabilityIds,
    connectors: base.connectors.length ? base.connectors : local.connectors,
    organizationId: local.organizationId ?? base.organizationId,
    briefingId: local.briefingId ?? base.briefingId,
    status: local.status === "paused" ? "paused" : base.status,
  };
}

/**
 * Kind-aware merge. Field saves never change currentStep.
 */
export function applyOnboardingSessionUpdate(
  local: OnboardingSession,
  update: OnboardingSessionUpdate
): OnboardingSession {
  switch (update.kind) {
    case "field_save":
      return mergeFieldSaveIntoSession(local, update.session);
    case "navigation":
      return mergeNavigationIntoSession(
        local,
        update.session,
        update.requestedStep
      );
    case "restore":
      return mergeRestoreIntoSession(local, update.session);
    default:
      return local;
  }
}

/** @deprecated Use applyOnboardingSessionUpdate with an explicit kind. */
export function shouldAcceptOnboardingSession(
  local: OnboardingSession,
  incoming: OnboardingSession
): boolean {
  // Legacy helper kept for diagnostics; no longer used for step authority.
  return applyOnboardingSessionUpdate(local, {
    kind: "restore",
    session: incoming,
  }) !== local;
}

/** @deprecated Use applyOnboardingSessionUpdate with an explicit kind. */
export function mergeOnboardingSessionUpdate(
  local: OnboardingSession,
  incoming: OnboardingSession
): OnboardingSession {
  // Safe default: treat unknown full-session payloads as field saves so they
  // cannot regress navigation (Preview-era setSession bug class).
  return mergeFieldSaveIntoSession(local, incoming);
}

export const ONBOARDING_SESSION_STORAGE_KEY = "jag.onboarding.session.v1";

export function readOnboardingSessionFromStorage(
  storage: Pick<Storage, "getItem"> | null | undefined,
  ownerUserId: string
): OnboardingSession | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingSession;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.ownerUserId !== ownerUserId) return null;
    if (typeof parsed.id !== "string" || typeof parsed.currentStep !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeOnboardingSessionToStorage(
  storage: Pick<Storage, "setItem"> | null | undefined,
  session: OnboardingSession
): void {
  if (!storage) return;
  try {
    storage.setItem(ONBOARDING_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota / private mode — non-fatal; in-memory + server snapshot still apply.
  }
}
