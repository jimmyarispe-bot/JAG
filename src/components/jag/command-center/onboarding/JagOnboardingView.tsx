"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
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
import { JagSection } from "../JagSection";

const fieldClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-[13px] text-[var(--jag-text)]";

export function JagOnboardingView({
  model,
}: {
  readonly model: JagOnboardingWorkspace;
}) {
  const [session, setSession] = useState<OnboardingSession>(model.session);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const deferred = useDeferredValue(session);

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
    fn: () => Promise<{
      ok: boolean;
      error?: string;
      session?: OnboardingSession;
    }>
  ) => {
    setMessage("");
    startTransition(async () => {
      const result = await fn();
      if (result.session) setSession(result.session);
      setMessage(result.ok ? "Saved." : (result.error ?? "Something went wrong."));
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
                disabled={pending}
                onClick={() =>
                  run(async () =>
                    goToOnboardingStepAction(step.id as OnboardingStepId)
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
                onClick={() => run(async () => resumeOnboardingAction())}
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
              onSession={setSession}
              setMessage={setMessage}
              startTransition={startTransition}
            />
          )}

          {!completed ? (
            <div className="flex flex-wrap gap-2 border-t border-[var(--jag-border)] pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(async () => goBackOnboardingStepAction())}
                className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(async () => pauseOnboardingAction())}
                className="rounded border border-[var(--jag-border)] px-3 py-2 text-xs text-[var(--jag-text)] disabled:opacity-60"
              >
                Pause
              </button>
              {session.currentStep === "generate_workspace" ||
              session.currentStep === "review" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      if (session.currentStep === "review") {
                        const step = await completeOnboardingStepAction();
                        if (!step.ok) return step;
                      }
                      return generateOnboardingWorkspaceAction();
                    })
                  }
                  className="rounded bg-[var(--brand-accent,#0D9488)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Generating…" : "Generate workspace"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => completeOnboardingStepAction())
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
          href="/jag"
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
  setMessage,
  startTransition,
}: {
  readonly session: OnboardingSession;
  readonly model: JagOnboardingWorkspace;
  readonly previewTheme: ReturnType<typeof BrandService.previewTheme>;
  readonly pending: boolean;
  readonly onSession: (s: OnboardingSession) => void;
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
        const r = await saveOnboardingOrganizationAction({ ...o, ...patch });
        if (r.session) onSession(r.session);
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
                  ...session,
                  organization: { ...o, organizationName: e.target.value },
                })
              }
              onBlur={() => persistOrg({ organizationName: o.organizationName })}
            />
          </Field>
          <Field label="Subdomain">
            <div className="flex items-center gap-2">
              <input
                className={fieldClass}
                value={o.subdomain}
                onChange={(e) =>
                  onSession({
                    ...session,
                    organization: {
                      ...o,
                      subdomain: e.target.value.toLowerCase(),
                    },
                  })
                }
                onBlur={() => persistOrg({ subdomain: o.subdomain })}
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
                  ...session,
                  organization: { ...o, industry },
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
                  ...session,
                  organization: { ...o, timezone: e.target.value },
                })
              }
              onBlur={() => persistOrg({ timezone: o.timezone })}
            />
          </Field>
          <Field label="Logo URL">
            <input
              className={fieldClass}
              value={o.logoUrl}
              onChange={(e) =>
                onSession({
                  ...session,
                  organization: { ...o, logoUrl: e.target.value },
                })
              }
              onBlur={() => persistOrg({ logoUrl: o.logoUrl })}
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
                    const next = { ...b, [key]: e.target.value };
                    onSession({ ...session, brand: next });
                    startTransition(async () => {
                      const r = await saveOnboardingBrandAction(next);
                      if (r.session) onSession(r.session);
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
                    ...session,
                    brand: { ...b, headingFont: e.target.value },
                  })
                }
                onBlur={() =>
                  startTransition(async () => {
                    const r = await saveOnboardingBrandAction({
                      headingFont: b.headingFont,
                    });
                    if (r.session) onSession(r.session);
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
                    ...session,
                    brand: { ...b, bodyFont: e.target.value },
                  })
                }
                onBlur={() =>
                  startTransition(async () => {
                    const r = await saveOnboardingBrandAction({
                      bodyFont: b.bodyFont,
                    });
                    if (r.session) onSession(r.session);
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
          pending={pending}
          onChange={(executives) => {
            onSession({ ...session, executives });
            startTransition(async () => {
              const r = await saveOnboardingExecutivesAction(executives);
              if (r.session) onSession(r.session);
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
                  ...session,
                  mission: { ...m, mission: e.target.value },
                })
              }
              onBlur={() =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction({
                    mission: m.mission,
                  });
                  if (r.session) onSession(r.session);
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
                  ...session,
                  mission: { ...m, vision: e.target.value },
                })
              }
              onBlur={() =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction({
                    vision: m.vision,
                  });
                  if (r.session) onSession(r.session);
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
                  ...session,
                  mission: { ...m, coreValues: splitList(e.target.value) },
                })
              }
              onBlur={() =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction({
                    coreValues: m.coreValues,
                  });
                  if (r.session) onSession(r.session);
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
                  ...session,
                  mission: {
                    ...m,
                    strategicPillars: splitList(e.target.value),
                  },
                })
              }
              onBlur={() =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction({
                    strategicPillars: m.strategicPillars,
                  });
                  if (r.session) onSession(r.session);
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
                  ...session,
                  mission: { ...m, goals: splitList(e.target.value) },
                })
              }
              onBlur={() =>
                startTransition(async () => {
                  const r = await saveOnboardingMissionAction({
                    goals: m.goals,
                  });
                  if (r.session) onSession(r.session);
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
                    const next = e.target.checked
                      ? [...session.enabledCapabilityIds, cap.id]
                      : session.enabledCapabilityIds.filter(
                          (id) => id !== cap.id
                        );
                    onSession({ ...session, enabledCapabilityIds: next });
                    startTransition(async () => {
                      const r = await saveOnboardingCapabilitiesAction(next);
                      if (r.session) onSession(r.session);
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
                    const connectors: OnboardingConnectorSelection[] =
                      session.connectors.map((row) =>
                        row.connectorId === c.connectorId
                          ? { ...row, selected: e.target.checked }
                          : row
                      );
                    onSession({ ...session, connectors });
                    startTransition(async () => {
                      const r = await saveOnboardingConnectorsAction(connectors);
                      if (r.session) onSession(r.session);
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

function ExecutiveEditor({
  executives,
  pending,
  onChange,
}: {
  readonly executives: readonly OnboardingExecutiveMember[];
  readonly pending: boolean;
  readonly onChange: (next: OnboardingExecutiveMember[]) => void;
}) {
  return (
    <div className="space-y-3">
      {executives.map((ex, idx) => (
        <div
          key={`${ex.email}-${idx}`}
          className="grid gap-2 rounded border border-[var(--jag-border)] p-3 sm:grid-cols-4"
        >
          <input
            className={fieldClass}
            placeholder="Name"
            value={ex.name}
            disabled={pending}
            onChange={(e) => {
              const next = executives.map((row, i) =>
                i === idx ? { ...row, name: e.target.value } : row
              );
              onChange(next);
            }}
          />
          <select
            className={fieldClass}
            value={ex.role}
            disabled={pending}
            onChange={(e) => {
              const role = e.target.value as OnboardingExecutiveMember["role"];
              const next = executives.map((row, i) =>
                i === idx ? { ...row, role } : row
              );
              onChange(next);
            }}
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
            disabled={pending}
            onChange={(e) => {
              const next = executives.map((row, i) =>
                i === idx ? { ...row, email: e.target.value } : row
              );
              onChange(next);
            }}
          />
          <input
            className={fieldClass}
            placeholder="Title"
            value={ex.title ?? ""}
            disabled={pending}
            onChange={(e) => {
              const next = executives.map((row, i) =>
                i === idx ? { ...row, title: e.target.value } : row
              );
              onChange(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        disabled={pending}
        className="rounded border border-[var(--jag-border)] px-3 py-1.5 text-xs text-[var(--jag-text)]"
        onClick={() =>
          onChange([
            ...executives,
            { name: "", role: "executive", email: "", title: "" },
          ])
        }
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
