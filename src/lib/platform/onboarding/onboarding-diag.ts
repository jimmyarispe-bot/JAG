/**
 * TEMPORARY Phase 60A diagnostics — remove after jump root cause is fixed.
 * Client + server safe (no window assumptions on import).
 */

import { ONBOARDING_STEP_IDS, type OnboardingSession } from "./types";

export type OnboardingDiagEvent = {
  readonly t: string;
  readonly source: string;
  readonly action?: string;
  readonly beforeStep?: string;
  readonly requestedStep?: string;
  readonly afterStep?: string;
  readonly sessionStep?: string;
  readonly organizationId?: string | null;
  readonly sessionId?: string;
  readonly sessionUpdatedAt?: string;
  readonly applied?: boolean;
  readonly reason?: string;
  readonly pathname?: string;
  readonly search?: string;
  readonly mountId?: string;
  readonly inFlight?: number;
  readonly validationError?: string | null;
  readonly detail?: string;
  readonly concurrent?: readonly string[];
};

const G = globalThis as typeof globalThis & {
  __ONBOARDING_DIAG__?: OnboardingDiagEvent[];
  __ONBOARDING_INFLIGHT__?: Map<string, string>;
};

function store(): OnboardingDiagEvent[] {
  if (!G.__ONBOARDING_DIAG__) G.__ONBOARDING_DIAG__ = [];
  return G.__ONBOARDING_DIAG__;
}

function inflight(): Map<string, string> {
  if (!G.__ONBOARDING_INFLIGHT__) G.__ONBOARDING_INFLIGHT__ = new Map();
  return G.__ONBOARDING_INFLIGHT__;
}

export function onboardingDiag(
  event: Omit<OnboardingDiagEvent, "t"> & { readonly t?: string }
): void {
  const row: OnboardingDiagEvent = {
    t: event.t ?? new Date().toISOString(),
    ...event,
  };
  store().push(row);
  // Cap memory
  if (store().length > 400) store().splice(0, store().length - 400);

  const line = `[ONBOARDING_DIAG] ${JSON.stringify(row)}`;
  console.info(line);

  if (typeof window !== "undefined") {
    try {
      const key = "jag.onboarding.diag.v1";
      const prev = window.sessionStorage.getItem(key);
      const arr = prev ? (JSON.parse(prev) as OnboardingDiagEvent[]) : [];
      arr.push(row);
      while (arr.length > 200) arr.shift();
      window.sessionStorage.setItem(key, JSON.stringify(arr));
      (
        window as unknown as { __ONBOARDING_DIAG__?: OnboardingDiagEvent[] }
      ).__ONBOARDING_DIAG__ = arr;
    } catch {
      // ignore
    }
  }
}

export function diagBeginAction(action: string, session: OnboardingSession): string {
  const id = `${action}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
  inflight().set(id, action);
  onboardingDiag({
    source: "action.start",
    action,
    beforeStep: session.currentStep,
    sessionStep: session.currentStep,
    sessionId: session.id,
    organizationId: session.organizationId,
    sessionUpdatedAt: session.updatedAt,
    inFlight: inflight().size,
    concurrent: [...inflight().values()],
    detail: id,
  });
  return id;
}

export function diagEndAction(
  id: string,
  action: string,
  before: OnboardingSession,
  result: {
    ok: boolean;
    session?: OnboardingSession;
    error?: string;
  }
): void {
  inflight().delete(id);
  onboardingDiag({
    source: "action.end",
    action,
    beforeStep: before.currentStep,
    afterStep: result.session?.currentStep,
    sessionStep: result.session?.currentStep,
    sessionId: result.session?.id ?? before.id,
    organizationId: result.session?.organizationId ?? before.organizationId,
    sessionUpdatedAt: result.session?.updatedAt,
    applied: Boolean(result.session),
    validationError: result.ok ? null : (result.error ?? "error"),
    inFlight: inflight().size,
    concurrent: [...inflight().values()],
    detail: id,
  });
}

export function stepIndex(step: string): number {
  return ONBOARDING_STEP_IDS.indexOf(step as (typeof ONBOARDING_STEP_IDS)[number]);
}

/** Detect unexpected backward step change. */
export function isStepRegression(from: string, to: string): boolean {
  const a = stepIndex(from);
  const b = stepIndex(to);
  if (a < 0 || b < 0) return false;
  return b < a;
}
