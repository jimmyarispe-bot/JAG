"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type MutableRefObject,
} from "react";
import {
  completeOnboardingStepAction,
  generateOnboardingWorkspaceAction,
  goBackOnboardingStepAction,
  goToOnboardingStepAction,
  pauseOnboardingAction,
  resumeOnboardingAction,
  saveOnboardingBrandAction,
  saveOnboardingCapabilitiesAction,
  saveOnboardingConnectorsAction,
  saveOnboardingExecutivesAction,
  saveOnboardingMissionAction,
  saveOnboardingOrganizationAction,
  type JagOnboardingWorkspace,
} from "@/lib/jag-command-center/onboarding";
import {
  BrandService,
  POWERED_BY_LINE,
  themeToStyle,
} from "@/lib/platform/branding";
import type {
  OnboardingConnectorSelection,
  OnboardingExecutiveMember,
  OnboardingSession,
  OnboardingStepId,
} from "@/lib/platform/onboarding";
import {
  createExecutiveMember,
  ensureExecutiveIds,
} from "@/lib/platform/onboarding/executives";
import {
  applyOnboardingSessionUpdate,
  bumpOnboardingSession,
  readOnboardingSessionFromStorage,
  writeOnboardingSessionToStorage,
  type OnboardingSessionUpdate,
} from "@/lib/platform/onboarding/session-merge";
import {
  diagBeginAction,
  diagEndAction,
  isStepRegression,
  onboardingDiag,
} from "@/lib/platform/onboarding/onboarding-diag";
import { JagSection } from "../JagSection";

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-[13px] text-[var(--jag-text)]";

let mountSeq = 0;

export function JagOnboardingView({
  model,
}: {
  readonly model: JagOnboardingWorkspace;
}) {
  const mountIdRef = useRef(`m${++mountSeq}`);
  const [session, setSession] = useState<OnboardingSession>(() => {
    onboardingDiag({
      source: "client.useState.init",
      mountId: mountIdRef.current,
      beforeStep: undefined,
      afterStep: model.session.currentStep,
      sessionStep: model.session.currentStep,
      sessionId: model.session.id,
      organizationId: model.session.organizationId,
      sessionUpdatedAt: model.session.updatedAt,
      pathname:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      search: typeof window !== "undefined" ? window.location.search : undefined,
      detail: "Initial client state from model.session (server loader)",
    });
    return model.session;
  });
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const deferred = useDeferredValue(session);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const prevStepRef = useRef(session.currentStep);
  const navInFlightRef = useRef(false);

  useEffect(() => {
    const mountId = mountIdRef.current;
    onboardingDiag({
      source: "client.mount",
      mountId,
      sessionStep: model.session.currentStep,
      afterStep: sessionRef.current.currentStep,
      sessionId: model.session.id,
      organizationId: model.session.organizationId,
      sessionUpdatedAt: model.session.updatedAt,
      pathname: window.location.pathname,
      search: window.location.search,
      detail: `Mounted JagOnboardingView; model.step=${model.session.currentStep}`,
    });
    return () => {
      onboardingDiag({
        source: "client.unmount",
        mountId,
        sessionStep: sessionRef.current.currentStep,
        sessionId: sessionRef.current.id,
        organizationId: sessionRef.current.organizationId,
        sessionUpdatedAt: sessionRef.current.updatedAt,
        pathname: window.location.pathname,
        search: window.location.search,
        detail: "Unmounted JagOnboardingView (remount/navigation)",
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount lifecycle only
  }, []);

  // Detect any rendered step change (expected or unexpected).
  useEffect(() => {
    const prev = prevStepRef.current;
    const next = session.currentStep;
    if (prev !== next) {
      const unexpected = isStepRegression(prev, next);
      onboardingDiag({
        source: unexpected
          ? "client.step.UNEXPECTED_REGRESSION"
          : "client.step.change",
        mountId: mountIdRef.current,
        beforeStep: prev,
        afterStep: next,
        sessionStep: next,
        sessionId: session.id,
        organizationId: session.organizationId,
        sessionUpdatedAt: session.updatedAt,
        pathname: window.location.pathname,
        search: window.location.search,
        detail: unexpected
          ? `FIRST-CLASS JUMP SIGNAL: ${prev} → ${next}`
          : `Step ${prev} → ${next}`,
      });
      prevStepRef.current = next;
    }
  }, [session]);

  // If server props change without remount (soft refresh), log them.
  useEffect(() => {
    onboardingDiag({
      source: "client.model.session.prop",
      mountId: mountIdRef.current,
      sessionStep: model.session.currentStep,
      afterStep: sessionRef.current.currentStep,
      sessionId: model.session.id,
      organizationId: model.session.organizationId,
      sessionUpdatedAt: model.session.updatedAt,
      detail: `Server model.session observed; client still at ${sessionRef.current.currentStep}`,
    });
  }, [model.session]);

  const hydratedRef = useRef(false);
  // Restore draft after refresh / soft remount (intentional, consistent).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = readOnboardingSessionFromStorage(
      window.sessionStorage,
      model.session.ownerUserId
    );
    onboardingDiag({
      source: "client.sessionStorage.read",
      mountId: mountIdRef.current,
      beforeStep: sessionRef.current.currentStep,
      afterStep: stored?.currentStep,
      sessionStep: stored?.currentStep,
      sessionId: stored?.id,
      organizationId: stored?.organizationId ?? null,
      sessionUpdatedAt: stored?.updatedAt,
      applied: Boolean(stored),
      detail: stored
        ? `Hydrate candidate step=${stored.currentStep}`
        : "No sessionStorage draft",
    });
    if (!stored) return;
    setSession((local) => {
      const merged = applyOnboardingSessionUpdate(local, {
        kind: "restore",
        session: stored,
      });
      onboardingDiag({
        source: "client.sessionStorage.apply",
        mountId: mountIdRef.current,
        beforeStep: local.currentStep,
        afterStep: merged.currentStep,
        sessionStep: merged.currentStep,
        sessionId: merged.id,
        organizationId: merged.organizationId,
        sessionUpdatedAt: merged.updatedAt,
        applied: merged !== local,
        reason: "restore",
        detail: isStepRegression(local.currentStep, merged.currentStep)
          ? `STORAGE CAUSED REGRESSION ${local.currentStep}→${merged.currentStep}`
          : undefined,
      });
      sessionRef.current = merged;
      return merged;
    });
  }, [model.session.ownerUserId]);

  useEffect(() => {
    writeOnboardingSessionToStorage(window.sessionStorage, session);
    onboardingDiag({
      source: "client.sessionStorage.write",
      mountId: mountIdRef.current,
      sessionStep: session.currentStep,
      sessionId: session.id,
      organizationId: session.organizationId,
      sessionUpdatedAt: session.updatedAt,
    });
  }, [session]);

  const applyLocal = (next: OnboardingSession) => {
    const bumped = bumpOnboardingSession(next);
    onboardingDiag({
      source: "client.applyLocal",
      mountId: mountIdRef.current,
      beforeStep: sessionRef.current.currentStep,
      afterStep: bumped.currentStep,
      sessionStep: bumped.currentStep,
      sessionId: bumped.id,
      organizationId: bumped.organizationId,
      sessionUpdatedAt: bumped.updatedAt,
      applied: true,
    });
    sessionRef.current = bumped;
    setSession(bumped);
  };

  const applyServerUpdate = (
    update: OnboardingSessionUpdate,
    action?: string
  ) => {
    setSession((local) => {
      const merged = applyOnboardingSessionUpdate(local, update);
      const regression = isStepRegression(local.currentStep, merged.currentStep);
      const unexpected =
        regression && update.kind === "field_save"
          ? true
          : regression &&
            update.kind === "navigation" &&
            update.requestedStep !== merged.currentStep &&
            update.requestedStep !== undefined &&
            merged.currentStep !== update.requestedStep
            ? true
            : regression && update.kind === "restore";
      onboardingDiag({
        source: unexpected
          ? "client.applyServer.UNEXPECTED_REGRESSION"
          : "client.applyServer",
        action,
        mountId: mountIdRef.current,
        beforeStep: local.currentStep,
        afterStep: merged.currentStep,
        requestedStep: update.requestedStep ?? update.session.currentStep,
        sessionStep: merged.currentStep,
        sessionId: merged.id,
        organizationId: merged.organizationId,
        sessionUpdatedAt: merged.updatedAt,
        applied: merged !== local,
        reason: `${update.kind}${regression ? ":step_changed" : ""}`,
        detail: [
          `kind=${update.kind}`,
          `incoming.step=${update.session.currentStep}`,
          `requested=${update.requestedStep ?? ""}`,
          `incoming.updatedAt=${update.session.updatedAt}`,
          `local.updatedAt=${local.updatedAt}`,
        ].join(" | "),
      });
      sessionRef.current = merged;
      return merged;
    });
  };

  const previewTheme = useMemo(
    () =>
      BrandService.previewTheme({
        organization_id: "onboarding-preview",
        display_name:
          deferred.organization.organizationName || "Your organization",
        organization_name:
          deferred.organization.organizationName || "Your organization",
        primary_color: deferred.brand.primaryColor,
        secondary_color: deferred.brand.secondaryColor,
        accent_color: deferred.brand.accentColor,
        heading_font: deferred.brand.headingFont,
        body_font: deferred.brand.bodyFont,
        light_logo_url:
          deferred.brand.lightLogoUrl || deferred.organization.logoUrl,
        dark_logo_url: deferred.brand.darkLogoUrl,
        powered_by_enabled: true,
      }),
    [deferred]
  );

  const progress = useMemo(() => {
    const completed = new Set(session.completedSteps);
    if (session.status === "completed") {
      model.steps.forEach((s) => completed.add(s.id));
    }
    return {
      percent: Math.round((completed.size / model.steps.length) * 100),
      readiness: session.readinessScore,
      eta: session.estimatedMinutesRemaining,
    };
  }, [session, model.steps]);

  const run = (
    actionName: string,
    fn: (snapshot: OnboardingSession) => Promise<{
      ok: boolean;
      error?: string;
      session?: OnboardingSession;
      kind?: OnboardingSessionUpdate["kind"];
      requestedStep?: OnboardingStepId;
    }>,
    options?: { readonly navigation?: boolean }
  ) => {
    if (options?.navigation && navInFlightRef.current) {
      onboardingDiag({
        source: "client.run.duplicateNavBlocked",
        action: actionName,
        mountId: mountIdRef.current,
        beforeStep: sessionRef.current.currentStep,
        sessionStep: sessionRef.current.currentStep,
        detail: "Ignored duplicate navigation while another nav is pending",
      });
      return;
    }
    setMessage("");
    if (options?.navigation) navInFlightRef.current = true;
    startTransition(async () => {
      const before = sessionRef.current;
      const diagId = diagBeginAction(actionName, before);
      onboardingDiag({
        source: "client.run",
        action: actionName,
        mountId: mountIdRef.current,
        beforeStep: before.currentStep,
        sessionStep: before.currentStep,
        sessionId: before.id,
        organizationId: before.organizationId,
        sessionUpdatedAt: before.updatedAt,
        pathname: window.location.pathname,
        search: window.location.search,
      });
      try {
        const result = await fn(before);
        diagEndAction(diagId, actionName, before, result);
        if (result.session) {
          const kind =
            result.kind ??
            (options?.navigation ? "navigation" : "field_save");
          applyServerUpdate(
            {
              kind,
              session: result.session,
              requestedStep: result.requestedStep,
            },
            actionName
          );
        }
        setMessage(
          result.ok ? "Saved." : (result.error ?? "Something went wrong.")
        );
      } finally {
        if (options?.navigation) navInFlightRef.current = false;
      }
    });
  };

  const completed = session.status === "completed";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold tracking-tight text-[var(--jag-text)]">
          Executive Onboarding
        </h1>
        <p className="max-w-2xl text-sm text-[var(--jag-muted)]">
          Guided setup for your Executive Intelligence Platform. {POWERED_BY_LINE}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--jag-muted)]">
          <span>Progress {progress.percent}%</span>
          <span>Readiness {progress.readiness}/100</span>
          <span>~{progress.eta} min remaining</span>
          <span className="capitalize">
            Status: {session.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded bg-[var(--jag-panel)]">
          <div
            className="h-full rounded bg-[var(--brand-accent,#0D9488)] transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Onboarding steps" className="space-y-1">
          {model.steps.map((step) => {
            const done = session.completedSteps.includes(step.id) || completed;
            const active = session.currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                disabled={pending || navInFlightRef.current}
                onClick={() =>
                  run(
                    `goTo:${step.id}`,
                    async (snapshot) =>
                      goToOnboardingStepAction(
                        step.id as OnboardingStepId,
                        snapshot
                      ),
                    { navigation: true }
                  )
                }
                className={`block w-full rounded px-3 py-2 text-left text-xs ${
                  active
                    ? "bg-[var(--jag-panel-2)] font-medium text-[var(--jag-text)]"
                    : done
                      ? "text-[var(--jag-text)]"
                      : "text-[var(--jag-muted)]"
                }`}
              >
                <span className="mr-2 font-mono text-[10px] text-[var(--jag-muted)]">
                  {step.index}
                </span>
                {step.title}
                {done ? " ✓" : ""}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {session.status === "paused" ? (
            <div className="rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3 text-sm text-[var(--jag-text)]">
              Onboarding paused — progress is saved.{" "}
              <button
                type="button"
                className="underline"
                disabled={pending}
                onClick={() =>
                  run(
                    "resume",
                    async (snapshot) => resumeOnboardingAction(snapshot),
                    { navigation: true }
                  )
                }
              >
                Resume
              </button>
            </div>
          ) : null}

          {completed ? (
            <CompletedPanel session={session} tasks={model.tasks} />
          ) : (
            <StepBody
              session={session}
              model={model}
              previewTheme={previewTheme}
              pending={pending}
              onSession={applyLocal}
              applyFieldSave={(s, action) =>
                applyServerUpdate({ kind: "field_save", session: s }, action)
              }
              sessionRef={sessionRef}
              setMessage={setMessage}
              startTransition={startTransition}
            />
          )}

          {!completed ? (
            <div className="flex flex-wrap gap-2 border-t border-[var(--jag-border)] pt-4">
              <button
                type="button"
                disabled={pending || navInFlightRef.current}
                onClick={() =>
                  run(
                    "goBack",
                    async (snapshot) => goBackOnboardingStepAction(snapshot),
                    { navigation: true }
                  )
                }
                className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    "pause",
                    async (snapshot) => pauseOnboardingAction(snapshot),
                    { navigation: true }
                  )
                }
                className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-60"
              >
                Pause
              </button>
              {session.currentStep === "generate_workspace" ||
              session.currentStep === "review" ? (
                <button
                  type="button"
                  disabled={pending || navInFlightRef.current}
                  onClick={() =>
                    run(
                      "generateWorkspace",
                      async (snapshot) => {
                        if (snapshot.currentStep === "review") {
                          const step =
                            await completeOnboardingStepAction(snapshot);
                          if (!step.ok) return step;
                          if (step.session) {
                            applyServerUpdate(
                              {
                                kind: "navigation",
                                session: step.session,
                                requestedStep: step.requestedStep,
                              },
                              "completeStep:preGenerate"
                            );
                          }
                          return generateOnboardingWorkspaceAction(
                            step.session ?? snapshot
                          );
                        }
                        return generateOnboardingWorkspaceAction(snapshot);
                      },
                      { navigation: true }
                    )
                  }
                  className="rounded bg-[var(--brand-accent,#0D9488)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Generating…" : "Generate workspace"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending || navInFlightRef.current}
                  onClick={() =>
                    run(
                      "completeStep",
                      async (snapshot) =>
                        completeOnboardingStepAction(snapshot),
                      { navigation: true }
                    )
                  }
                  className="rounded bg-[var(--brand-accent,#0D9488)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Continue"}
                </button>
              )}
            </div>
          ) : null}

          {message ? (
            <p className="text-xs text-[var(--jag-muted)]" role="status">
              {message}
            </p>
          ) : null}

          {model.observations.length > 0 ? (
            <JagSection
              title="Onboarding activity"
              description="Provisioning and step telemetry."
            >
              <ul className="max-h-36 space-y-1 overflow-y-auto text-[11px] text-[var(--jag-muted)]">
                {model.observations.slice(0, 10).map((o) => (
                  <li key={o.id}>
                    <span className="text-[var(--jag-text)]">{o.kind}</span>
                    {" · "}
                    {o.detail}
                  </li>
                ))}
              </ul>
            </JagSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CompletedPanel({
  session,
  tasks,
}: {
  readonly session: OnboardingSession;
  readonly tasks: JagOnboardingWorkspace["tasks"];
}) {
  return (
    <div className="space-y-4 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] p-5">
      <h2 className="text-lg font-medium text-[var(--jag-text)]">
        Your Executive Intelligence Platform is ready
      </h2>
      <p className="text-sm text-[var(--jag-muted)]">
        {session.organization.organizationName} ·{" "}
        {session.organization.subdomain}.thejag.org · {POWERED_BY_LINE}
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        {session.briefingId ? (
          <Link
            href={`/jag/briefings/${session.briefingId}`}
            className="rounded border border-[var(--jag-border)] px-3 py-2 text-[var(--jag-text)]"
          >
            Open Welcome Executive Brief
          </Link>
        ) : null}
        <Link
          href={
            session.organizationId
              ? `/jag?org=${encodeURIComponent(session.organizationId)}`
              : "/jag"
          }
          className="rounded bg-[var(--brand-accent,#0D9488)] px-3 py-2 text-white"
        >
          Go to workspace
        </Link>
        <Link
          href="/jag/settings/branding"
          className="rounded border border-[var(--jag-border)] px-3 py-2 text-[var(--jag-text)]"
        >
          Branding
        </Link>
      </div>
      {tasks.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--jag-muted)]">
            First inbox
          </p>
          <ul className="mt-2 space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className={`text-sm ${
                    t.completed
                      ? "text-[var(--jag-muted)] line-through"
                      : "text-[var(--jag-text)]"
                  }`}
                >
                  {t.title}
                </Link>
                <p className="text-[11px] text-[var(--jag-muted)]">
                  {t.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StepBody({
  session,
  model,
  previewTheme,
  pending,
  onSession,
  applyFieldSave,
  sessionRef,
  setMessage,
  startTransition,
}: {
  readonly session: OnboardingSession;
  readonly model: JagOnboardingWorkspace;
  readonly previewTheme: ReturnType<typeof BrandService.previewTheme>;
  readonly pending: boolean;
  readonly onSession: (s: OnboardingSession) => void;
  readonly applyFieldSave: (s: OnboardingSession, action?: string) => void;
  readonly sessionRef: MutableRefObject<OnboardingSession>;
  readonly setMessage: (m: string) => void;
  readonly startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const step = session.currentStep;

  if (step === "welcome") {
    return (
      <JagSection
        title={model.welcome.headline}
        description={model.welcome.subhead}
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--jag-muted)]">
          {model.welcome.whatHappens.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[var(--jag-muted)]">
          {model.welcome.poweredBy}
        </p>
      </JagSection>
    );
  }

  if (step === "organization") {
    const o = session.organization;
    const persistOrg = (patch: Partial<typeof o>) => {
      startTransition(async () => {
        const before = sessionRef.current;
        const diagId = diagBeginAction("saveOrganization", before);
        const r = await saveOnboardingOrganizationAction(patch, before);
        diagEndAction(diagId, "saveOrganization", before, r);
        if (r.session) applyFieldSave(r.session, "saveOrganization");
        if (!r.ok) setMessage(r.error);
      });
    };
    return (
      <JagSection
        title="Organization"
        description="Create your tenant identity on *.thejag.org"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Organization name">
            <input
              className={fieldClass}
              value={o.organizationName}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  organization: {
                    ...sessionRef.current.organization,
                    organizationName: e.target.value,
                  },
                })
              }
              onBlur={(e) =>
                persistOrg({ organizationName: e.target.value })
              }
            />
          </Field>
          <Field label="Subdomain">
            <div className="flex items-center gap-2">
              <input
                className={fieldClass}
                value={o.subdomain}
                onChange={(e) =>
                  onSession({
                    ...sessionRef.current,
                    organization: {
                      ...sessionRef.current.organization,
                      subdomain: e.target.value.toLowerCase(),
                    },
                  })
                }
                onBlur={(e) =>
                  persistOrg({ subdomain: e.target.value.toLowerCase() })
                }
              />
              <span className="shrink-0 text-xs text-[var(--jag-muted)]">
                .thejag.org
              </span>
            </div>
          </Field>
          <Field label="Industry">
            <select
              className={fieldClass}
              value={o.industry}
              onChange={(e) => {
                const industry = e.target.value;
                onSession({
                  ...sessionRef.current,
                  organization: {
                    ...sessionRef.current.organization,
                    industry,
                  },
                });
                persistOrg({ industry });
              }}
            >
              {model.industries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <input
              className={fieldClass}
              value={o.timezone}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  organization: {
                    ...sessionRef.current.organization,
                    timezone: e.target.value,
                  },
                })
              }
              onBlur={(e) => persistOrg({ timezone: e.target.value })}
            />
          </Field>
          <Field label="Logo URL">
            <input
              className={fieldClass}
              value={o.logoUrl}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  organization: {
                    ...sessionRef.current.organization,
                    logoUrl: e.target.value,
                  },
                })
              }
              onBlur={(e) => persistOrg({ logoUrl: e.target.value })}
            />
          </Field>
        </div>
      </JagSection>
    );
  }

  if (step === "brand") {
    const b = session.brand;
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <JagSection
          title="Brand"
          description="Customer brand is primary. The JAG™ is secondary."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["primaryColor", "Primary"],
                ["secondaryColor", "Secondary"],
                ["accentColor", "Accent"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="color"
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-[var(--jag-border)] bg-transparent"
                  value={b[key]}
                  onChange={(e) => {
                    const next = {
                      ...sessionRef.current.brand,
                      [key]: e.target.value,
                    };
                    onSession({ ...sessionRef.current, brand: next });
                    startTransition(async () => {
                      const r = await saveOnboardingBrandAction(
                        { [key]: e.target.value },
                        sessionRef.current
                      );
                      if (r.session) applyFieldSave(r.session);
                    });
                  }}
                />
              </Field>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Heading font">
              <input
                className={fieldClass}
                value={b.headingFont}
                onChange={(e) =>
                  onSession({
                    ...sessionRef.current,
                    brand: {
                      ...sessionRef.current.brand,
                      headingFont: e.target.value,
                    },
                  })
                }
                onBlur={(e) =>
                  startTransition(async () => {
                    const r = await saveOnboardingBrandAction(
                      { headingFont: e.target.value },
                      sessionRef.current
                    );
                    if (r.session) applyFieldSave(r.session);
                  })
                }
              />
            </Field>
            <Field label="Body font">
              <input
                className={fieldClass}
                value={b.bodyFont}
                onChange={(e) =>
                  onSession({
                    ...sessionRef.current,
                    brand: {
                      ...sessionRef.current.brand,
                      bodyFont: e.target.value,
                    },
                  })
                }
                onBlur={(e) =>
                  startTransition(async () => {
                    const r = await saveOnboardingBrandAction(
                      { bodyFont: e.target.value },
                      sessionRef.current
                    );
                    if (r.session) applyFieldSave(r.session);
                  })
                }
              />
            </Field>
          </div>
        </JagSection>
        <aside
          className="rounded border border-[var(--jag-border)] p-4"
          style={themeToStyle(previewTheme)}
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--jag-muted)]">
            Live preview
          </p>
          <p
            className="mt-2 text-lg font-semibold text-[var(--jag-text)]"
            style={{ fontFamily: "var(--brand-heading-font)" }}
          >
            {session.organization.organizationName || "Your organization"}
          </p>
          <p className="mt-1 text-xs text-[var(--jag-muted)]">
            Executive Intelligence Platform
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded px-3 py-2 text-xs text-white"
            style={{ background: "var(--brand-accent)" }}
          >
            Continue
          </button>
          <p className="mt-3 text-[11px] text-[var(--jag-muted)]">
            {POWERED_BY_LINE}
          </p>
        </aside>
      </div>
    );
  }

  if (step === "executive_profile") {
    return (
      <JagSection
        title="Executive profile"
        description="Founder, CEO, and executive team (org chart optional)."
      >
        <ExecutiveEditor
          executives={session.executives}
          onLocalChange={(executives) => {
            onSession({ ...sessionRef.current, executives });
          }}
          onPersist={(executives) => {
            startTransition(async () => {
              const r = await saveOnboardingExecutivesAction(
                executives,
                sessionRef.current
              );
              if (r.session) applyFieldSave(r.session);
            });
          }}
        />
      </JagSection>
    );
  }

  if (step === "mission_strategy") {
    const m = session.mission;
    return (
      <JagSection
        title="Mission & strategy"
        description="Capture direction for intelligence alignment."
      >
        <div className="space-y-3">
          <Field label="Mission">
            <textarea
              className={fieldClass}
              rows={2}
              value={m.mission}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  mission: {
                    ...sessionRef.current.mission,
                    mission: e.target.value,
                  },
                })
              }
              onBlur={(e) =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction(
                    { mission: e.target.value },
                    sessionRef.current
                  );
                  if (r.session) applyFieldSave(r.session);
                })
              }
            />
          </Field>
          <Field label="Vision">
            <textarea
              className={fieldClass}
              rows={2}
              value={m.vision}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  mission: {
                    ...sessionRef.current.mission,
                    vision: e.target.value,
                  },
                })
              }
              onBlur={(e) =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction(
                    { vision: e.target.value },
                    sessionRef.current
                  );
                  if (r.session) applyFieldSave(r.session);
                })
              }
            />
          </Field>
          <Field label="Core values (comma-separated)">
            <input
              className={fieldClass}
              value={m.coreValues.join(", ")}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  mission: {
                    ...sessionRef.current.mission,
                    coreValues: splitList(e.target.value),
                  },
                })
              }
              onBlur={(e) =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction(
                    { coreValues: splitList(e.target.value) },
                    sessionRef.current
                  );
                  if (r.session) applyFieldSave(r.session);
                })
              }
            />
          </Field>
          <Field label="Strategic pillars (comma-separated)">
            <input
              className={fieldClass}
              value={m.strategicPillars.join(", ")}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  mission: {
                    ...sessionRef.current.mission,
                    strategicPillars: splitList(e.target.value),
                  },
                })
              }
              onBlur={(e) =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction(
                    { strategicPillars: splitList(e.target.value) },
                    sessionRef.current
                  );
                  if (r.session) applyFieldSave(r.session);
                })
              }
            />
          </Field>
          <Field label="Goals (comma-separated)">
            <input
              className={fieldClass}
              value={m.goals.join(", ")}
              onChange={(e) =>
                onSession({
                  ...sessionRef.current,
                  mission: {
                    ...sessionRef.current.mission,
                    goals: splitList(e.target.value),
                  },
                })
              }
              onBlur={(e) =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction(
                    { goals: splitList(e.target.value) },
                    sessionRef.current
                  );
                  if (r.session) applyFieldSave(r.session);
                })
              }
            />
          </Field>
        </div>
      </JagSection>
    );
  }

  if (step === "capabilities") {
    const enabled = new Set(session.enabledCapabilityIds);
    return (
      <JagSection
        title="Capabilities"
        description="Choose intelligence capabilities discovered through the Capability SDK."
      >
        <ul className="space-y-2">
          {model.capabilities.map((cap) => (
            <li key={cap.id}>
              <label className="flex items-start gap-2 text-sm text-[var(--jag-text)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={enabled.has(cap.id)}
                  onChange={(e) => {
                    const current = sessionRef.current;
                    const next = e.target.checked
                      ? [...current.enabledCapabilityIds, cap.id]
                      : current.enabledCapabilityIds.filter(
                          (id) => id !== cap.id
                        );
                    onSession({ ...current, enabledCapabilityIds: next });
                    startTransition(async () => {
                      const r = await saveOnboardingCapabilitiesAction(
                        next,
                        sessionRef.current
                      );
                      if (r.session) applyFieldSave(r.session);
                    });
                  }}
                />
                <span>
                  <span className="font-medium">{cap.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--jag-muted)]">
                    {cap.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </JagSection>
    );
  }

  if (step === "connect_systems") {
    return (
      <JagSection
        title="Connect systems"
        description="Select connectors to enable evidence and operations."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {session.connectors.map((c) => (
            <li key={c.connectorId}>
              <label className="flex items-start gap-2 rounded border border-[var(--jag-border)] p-3 text-sm text-[var(--jag-text)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={c.selected}
                  onChange={(e) => {
                    const current = sessionRef.current;
                    const connectors: OnboardingConnectorSelection[] =
                      current.connectors.map((row) =>
                        row.connectorId === c.connectorId
                          ? { ...row, selected: e.target.checked }
                          : row
                      );
                    onSession({ ...current, connectors });
                    startTransition(async () => {
                      const r = await saveOnboardingConnectorsAction(
                        connectors,
                        sessionRef.current
                      );
                      if (r.session) applyFieldSave(r.session);
                    });
                  }}
                />
                <span>
                  <span className="font-medium">{c.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--jag-muted)]">
                    {c.category}
                    {c.connected ? " · connected" : ""}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </JagSection>
    );
  }

  if (step === "review" || step === "generate_workspace") {
    return (
      <JagSection
        title="Review"
        description="Validate configuration before generating your workspace."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <ReviewItem
            label="Organization"
            value={session.organization.organizationName}
          />
          <ReviewItem
            label="Subdomain"
            value={`${session.organization.subdomain || "—"}.thejag.org`}
          />
          <ReviewItem label="Industry" value={session.organization.industry} />
          <ReviewItem label="Timezone" value={session.organization.timezone} />
          <ReviewItem
            label="Executives"
            value={String(session.executives.length)}
          />
          <ReviewItem
            label="Capabilities"
            value={String(session.enabledCapabilityIds.length)}
          />
          <ReviewItem
            label="Systems selected"
            value={String(session.connectors.filter((c) => c.selected).length)}
          />
          <ReviewItem
            label="Readiness score"
            value={`${session.readinessScore}/100`}
          />
          <ReviewItem label="Mission" value={session.mission.mission || "—"} />
        </dl>
        <p className="mt-4 text-xs text-[var(--jag-muted)]">
          Generating the workspace creates the organization, applies brand,
          enables capabilities, seeds navigation, and produces your Welcome
          Executive Brief.
        </p>
      </JagSection>
    );
  }

  return null;
}

/**
 * Local-first executive team editor.
 * Typing owns the active row; persistence is blur/debounce only and must not
 * remount rows or replace in-progress input from a stale server response.
 */
function ExecutiveEditor({
  executives,
  onLocalChange,
  onPersist,
}: {
  readonly executives: readonly OnboardingExecutiveMember[];
  readonly onLocalChange: (next: OnboardingExecutiveMember[]) => void;
  readonly onPersist: (next: OnboardingExecutiveMember[]) => void;
}) {
  const [rows, setRows] = useState(() => ensureExecutiveIds(executives));
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const propIds = executives.map((e) => e.id).join("|");

  // Absorb external structure only when not mid-edit (e.g. restore after refresh).
  useEffect(() => {
    if (dirtyRef.current) return;
    const next = ensureExecutiveIds(executives);
    setRows(next);
    rowsRef.current = next;
  }, [propIds, executives]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const schedulePersist = (next: OnboardingExecutiveMember[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dirtyRef.current = false;
      onboardingDiag({
        source: "client.executive.persist.debounce",
        detail: `Persisting ${next.length} executive row(s)`,
        sessionStep: "executive_profile",
      });
      onPersist(next);
    }, 400);
  };

  const commitLocal = (next: OnboardingExecutiveMember[]) => {
    dirtyRef.current = true;
    const stable = ensureExecutiveIds(next);
    setRows(stable);
    rowsRef.current = stable;
    onLocalChange(stable);
    schedulePersist(stable);
  };

  const persistNow = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    dirtyRef.current = false;
    onboardingDiag({
      source: "client.executive.persist.blur",
      detail: `Blur-persist ${rowsRef.current.length} executive row(s)`,
      sessionStep: "executive_profile",
    });
    onPersist(rowsRef.current);
  };

  return (
    <div className="space-y-3">
      {rows.map((ex, idx) => (
        <div
          key={ex.id}
          className="grid gap-2 rounded border border-[var(--jag-border)] p-3 sm:grid-cols-4"
        >
          <input
            className={fieldClass}
            placeholder="Name"
            value={ex.name}
            onChange={(e) => {
              const next = rows.map((row, i) =>
                i === idx ? { ...row, name: e.target.value } : row
              );
              commitLocal(next);
            }}
            onBlur={persistNow}
          />
          <select
            className={fieldClass}
            value={ex.role}
            onChange={(e) => {
              const role = e.target.value as OnboardingExecutiveMember["role"];
              const next = rows.map((row, i) =>
                i === idx ? { ...row, role } : row
              );
              commitLocal(next);
            }}
            onBlur={persistNow}
          >
            <option value="founder">Founder</option>
            <option value="ceo">CEO</option>
            <option value="executive">Executive</option>
            <option value="other">Other</option>
          </select>
          <input
            className={fieldClass}
            placeholder="Email"
            value={ex.email}
            onChange={(e) => {
              const next = rows.map((row, i) =>
                i === idx ? { ...row, email: e.target.value } : row
              );
              commitLocal(next);
            }}
            onBlur={persistNow}
          />
          <input
            className={fieldClass}
            placeholder="Title"
            value={ex.title ?? ""}
            onChange={(e) => {
              const next = rows.map((row, i) =>
                i === idx ? { ...row, title: e.target.value } : row
              );
              commitLocal(next);
            }}
            onBlur={persistNow}
          />
        </div>
      ))}
      <button
        type="button"
        className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-xs text-[var(--jag-text)]"
        onClick={() => {
          const draft = createExecutiveMember({
            name: "",
            role: "executive",
            email: "",
            title: "",
          });
          onboardingDiag({
            source: "client.executive.add",
            detail: `Added draft row id=${draft.id}`,
            sessionStep: "executive_profile",
          });
          commitLocal([...rowsRef.current, draft]);
        }}
      >
        Add executive
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="text-[var(--jag-muted)]">{label}</span>
      {children}
    </label>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--jag-text)]">{value}</dd>
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
