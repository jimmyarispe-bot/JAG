import Link from "next/link";
import type { JagReadinessWorkspaceModel } from "@/lib/jag-command-center/production-readiness";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

function passFailBadge(ok: boolean) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${
        ok
          ? "border-[var(--jag-ready)] text-[var(--jag-ready)]"
          : "border-[var(--jag-border)] text-[var(--jag-muted)]"
      }`}
    >
      {ok ? "Pass" : "Fail"}
    </span>
  );
}

export function JagReadinessView({
  model,
}: {
  readonly model: JagReadinessWorkspaceModel;
}) {
  const { report, observations } = model;

  return (
    <div className="space-y-8">
      <JagSection
        title="Production readiness"
        description="GA validation of the executive workflow chain and Capability SDK health. Application-layer only — no new intelligence capabilities."
        actions={
          <Link
            href="/jag/observability"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Observability
          </Link>
        }
      >
        <p className="text-xs text-[var(--jag-muted)]">{report.advisoryNotice}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[var(--jag-muted)]">Overall</dt>
            <dd className="mt-1">
              <JagStatusBadge status={report.ok ? "ready" : "empty"} />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Passed</dt>
            <dd className="text-lg text-[var(--jag-text)]">{report.passCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Failed</dt>
            <dd className="text-lg text-[var(--jag-text)]">{report.failCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--jag-muted)]">Generated</dt>
            <dd className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
              {report.generatedAt}
            </dd>
          </div>
        </dl>
      </JagSection>

      <JagSection
        title="Executive workflow matrix"
        description="Evidence → Knowledge → Policies → Forecasts → Scenarios → Conversation → Decision → Execution → Outcome → Memory → Strategy → Watchers → Explainability"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            {report.workflow.passCount} pass · {report.workflow.failCount} fail
          </p>
          <JagStatusBadge
            status={report.workflow.failCount === 0 ? "ready" : "empty"}
          />
        </div>
        {report.workflow.links.length === 0 ? (
          <JagEmptyState
            title="No workflow links"
            description="The executive workflow matrix did not return any links."
          />
        ) : (
          <ol className="space-y-2">
            {report.workflow.links.map((link) => (
              <li
                key={link.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[var(--jag-text)]">
                    {link.from} → {link.to}
                  </p>
                  {passFailBadge(link.ok)}
                </div>
                <p className="mt-1">{link.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  {link.hrefs.join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </JagSection>

      <JagSection
        title="Capability health"
        description="Every registered capability: health, version, dependencies, providers, routes, permissions, observability."
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            {report.capabilities.passCount} pass ·{" "}
            {report.capabilities.failCount} fail
          </p>
          <JagStatusBadge
            status={report.capabilities.failCount === 0 ? "ready" : "empty"}
          />
        </div>
        {report.capabilities.reports.length === 0 ? (
          <JagEmptyState
            title="No capabilities registered"
            description="Bootstrap the Capability SDK to register Phase II intelligence modules."
          />
        ) : (
          <ul className="space-y-2">
            {report.capabilities.reports.map((cap) => (
              <li
                key={cap.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--jag-text)]">
                    {cap.name}
                  </p>
                  {passFailBadge(cap.ok)}
                </div>
                <p className="mt-1">{cap.detail}</p>
                <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  {cap.id} · v{cap.version} · {cap.healthStatus}
                  {cap.observability ? ` · ${cap.observability}` : ""}
                </p>
                {cap.providers.length > 0 ? (
                  <p className="mt-1 text-[10px] text-[var(--jag-muted-2)]">
                    Providers: {cap.providers.join(", ")}
                  </p>
                ) : null}
                {cap.dependencyIssues.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-[10px] text-[var(--jag-muted)]">
                    {cap.dependencyIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
                {cap.routes.length > 0 ? (
                  <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                    {cap.routes.map((r) => r.path).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </JagSection>

      <JagSection
        title="Recent readiness runs"
        description="Recorded workflow, capability, and full validation executions."
      >
        {observations.length === 0 ? (
          <JagEmptyState
            title="No readiness runs yet"
            description="Open this page to record a full validation run."
          />
        ) : (
          <ul className="space-y-2">
            {observations.map((obs) => (
              <li
                key={obs.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {obs.at}
                  </p>
                  <p className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                    {obs.durationMs}ms · {obs.kind.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-1 text-[var(--jag-text)]">{obs.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
