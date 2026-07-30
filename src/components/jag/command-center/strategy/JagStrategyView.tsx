import Link from "next/link";
import type { JagStrategyWorkspaceModel } from "@/lib/jag-command-center/strategy";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

export function JagStrategyView({
  model,
}: {
  readonly model: JagStrategyWorkspaceModel;
}) {
  const bundle = model.bundle;

  return (
    <div className="space-y-8">
      <JagSection
        title="Strategic Intelligence"
        description="Mission alignment — connect decisions, forecasts, and outcomes to strategy."
        actions={
          <div className="flex gap-3 text-xs">
            <Link
              href="/jag/chat"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Ask Conversation
            </Link>
            <Link
              href="/jag/memory"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Memory
            </Link>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
          <JagStatusBadge status={bundle ? "ready" : "empty"} />
        </div>
        <p className="text-xs text-[var(--jag-muted)]">{model.explanation}</p>
        {model.organizations.length > 1 ? (
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2 text-xs">
            <label className="space-y-1">
              <span className="text-[var(--jag-muted)]">Organization</span>
              <select
                name="org"
                defaultValue={model.organizationId ?? ""}
                className="ml-2 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-[var(--jag-text)]"
              >
                {model.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-[var(--jag-border)] px-2 py-1.5 text-[var(--jag-text)]"
            >
              Load
            </button>
          </form>
        ) : model.organizationName ? (
          <p className="mt-2 text-sm text-[var(--jag-text)]">
            Organization · {model.organizationName}
          </p>
        ) : null}
      </JagSection>

      {!bundle ? (
        <JagEmptyState
          title="No organization selected"
          description="Bind an organization to load mission, pillars, and goal health."
        />
      ) : (
        <>
          <JagSection
            title="Mission"
            description="Why we exist — vision, values, planning horizon, review cadence."
          >
            <div className="space-y-3 text-sm">
              <p className="text-[var(--jag-text)]">
                <span className="text-[var(--jag-muted)]">Mission · </span>
                {bundle.mission?.mission}
              </p>
              <p className="text-[var(--jag-text)]">
                <span className="text-[var(--jag-muted)]">Vision · </span>
                {bundle.mission?.vision}
              </p>
              <p className="text-xs text-[var(--jag-muted)]">
                Horizon {bundle.mission?.planningHorizon} · Review{" "}
                {bundle.mission?.reviewCadence} · Next{" "}
                {bundle.mission?.nextReviewAt.slice(0, 10)}
              </p>
              <ul className="flex flex-wrap gap-2 text-xs text-[var(--jag-muted)]">
                {bundle.mission?.coreValues.map((v) => (
                  <li
                    key={v}
                    className="rounded border border-[var(--jag-border)] px-2 py-1"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </JagSection>

          <JagSection
            title="Alignment Score"
            description="Composite of goal health and mission fit."
          >
            <p className="text-3xl font-semibold text-[var(--jag-text)]">
              {(bundle.alignmentScore * 100).toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-[var(--jag-muted)]">
              Forecasted mission trend: {bundle.forecast.missionProgressTrend}
            </p>
          </JagSection>

          <JagSection title="Strategic Pillars" description="Configurable pillars.">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.scorecard.pillarSummaries.map((p) => (
                <li
                  key={p.pillarId}
                  className="rounded border border-[var(--jag-border)] p-3 text-sm"
                >
                  <p className="font-medium text-[var(--jag-text)]">{p.label}</p>
                  <p className="mt-1 text-xs text-[var(--jag-muted)]">
                    {p.goalCount} goal(s) · avg progress{" "}
                    {(p.avgProgress * 100).toFixed(0)}%
                  </p>
                </li>
              ))}
            </ul>
          </JagSection>

          <JagSection title="Goal Health" description="Progress, health, and owners.">
            <ul className="space-y-3">
              {bundle.goals.map((g) => {
                const ev = bundle.evaluations.find((e) => e.goalId === g.id);
                return (
                  <li
                    key={g.id}
                    className="rounded border border-[var(--jag-border)] p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-[var(--jag-text)]">{g.title}</p>
                      <span className="text-xs uppercase tracking-wide text-[var(--jag-muted)]">
                        {ev?.health ?? g.health}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--jag-muted)]">
                      {g.owner} · {g.priority} · {(g.progress * 100).toFixed(0)}% ·
                      target {g.targetDate.slice(0, 10)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--jag-muted)]">
                      {ev?.summary ?? g.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </JagSection>

          <JagSection
            title="Initiative Status"
            description="Initiatives connect goals to decisions and outcomes."
          >
            <ul className="space-y-2 text-sm">
              {bundle.initiatives.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--jag-border)] px-3 py-2"
                >
                  <div>
                    <p className="text-[var(--jag-text)]">{i.title}</p>
                    <p className="text-xs text-[var(--jag-muted)]">
                      {i.owner} · impact {i.impactScore.toFixed(2)} ·{" "}
                      {(i.progress * 100).toFixed(0)}%
                    </p>
                  </div>
                  <span className="text-xs text-[var(--jag-muted)]">{i.status}</span>
                </li>
              ))}
            </ul>
          </JagSection>

          <JagSection
            title="Blocked Goals & Upcoming Reviews"
            description="Where strategy is stuck and when to reconvene."
          >
            {bundle.scorecard.blockedGoals.length === 0 ? (
              <p className="text-xs text-[var(--jag-muted)]">No blocked goals.</p>
            ) : (
              <ul className="mb-3 list-disc pl-5 text-sm text-[var(--jag-text)]">
                {bundle.scorecard.blockedGoals.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <ul className="text-xs text-[var(--jag-muted)]">
              {bundle.scorecard.upcomingReviews.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </JagSection>

          <JagSection
            title="Forecasted Goal Progress"
            description="Advisory achievement probability — not certainty."
          >
            <ul className="space-y-2 text-sm">
              {bundle.forecast.goalForecasts.map((f) => (
                <li
                  key={f.goalId}
                  className="rounded border border-[var(--jag-border)] px-3 py-2"
                >
                  <p className="text-[var(--jag-text)]">{f.title}</p>
                  <p className="text-xs text-[var(--jag-muted)]">
                    {(f.achievementProbability * 100).toFixed(0)}% probability ·{" "}
                    {f.risk} risk · projected{" "}
                    {(f.projectedProgress * 100).toFixed(0)}%
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--jag-muted)]">
              {bundle.forecast.advisoryNotice}
            </p>
          </JagSection>

          <JagSection
            title="Historical Strategy Context"
            description="Prior initiatives, lessons, and similar strategic efforts from organizational memory."
          >
            {model.historical.lessons.length === 0 &&
            model.historical.similar.length === 0 ? (
              <p className="text-xs text-[var(--jag-muted)]">
                No strategic memories yet. Record outcomes and lessons in Memory.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {model.historical.lessons.map((l) => (
                  <li key={l} className="text-[var(--jag-muted)]">
                    Lesson · {l}
                  </li>
                ))}
                {model.historical.similar.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className="text-[var(--jag-text)] hover:underline"
                    >
                      {s.title}
                    </Link>
                    <span className="text-xs text-[var(--jag-muted)]">
                      {" "}
                      · {s.outcome} · {(s.confidence * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </JagSection>
        </>
      )}
    </div>
  );
}
