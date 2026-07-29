import Link from "next/link";
import type { JagScenarioPlannerModel } from "@/lib/jag-command-center";
import { JagEmptyState } from "../JagEmptyState";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";

export function JagScenarioPlannerView({
  model,
}: {
  readonly model: JagScenarioPlannerModel;
}) {
  return (
    <div className="space-y-8">
      <JagSection
        title="Scenario Planner"
        description="Model hypothetical changes before deciding. Projections are advisory — not certainty."
        actions={
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/jag"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Overview
            </Link>
            <Link
              href="/jag/decisions"
              className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Decision Center
            </Link>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">{model.advisoryNotice}</p>
          <JagStatusBadge
            status={model.results.length > 0 ? "ready" : "empty"}
          />
        </div>
        <p className="text-xs text-[var(--jag-muted)]">{model.explanation}</p>
        {model.organizationName ? (
          <p className="mt-2 text-sm text-[var(--jag-text)]">
            Organization · {model.organizationName}
          </p>
        ) : null}
      </JagSection>

      <JagSection
        title="Templates"
        description="Select scenarios to run. Multi-select enables side-by-side comparison including Current."
      >
        {!model.organizationId ? (
          <JagEmptyState
            title="No organization"
            description="Select or provision an organization to plan scenarios."
          />
        ) : (
          <form method="get" className="space-y-4">
            <input type="hidden" name="org" value={model.organizationId} />
            <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {model.templates.map((t) => (
                <label
                  key={t.kind}
                  className="flex cursor-pointer gap-2 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3 text-xs"
                >
                  <input
                    type="checkbox"
                    name="kind"
                    value={t.kind}
                    className="mt-0.5"
                    defaultChecked={model.results.some((r) => r.kind === t.kind)}
                  />
                  <span>
                    <span className="block font-medium text-[var(--jag-text)]">
                      {t.title}
                    </span>
                    <span className="mt-1 block text-[var(--jag-muted)]">
                      {t.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-xs text-[var(--jag-muted)]">
              <input type="checkbox" name="compare" value="1" defaultChecked />
              Compare selected scenarios side-by-side
            </label>
            <button
              type="submit"
              className="rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] px-3 py-1.5 text-xs text-[var(--jag-text)] hover:border-[var(--jag-text)]"
            >
              Run scenarios
            </button>
          </form>
        )}
      </JagSection>

      {model.comparison ? (
        <JagSection
          title="Comparison"
          description="Current vs selected scenarios — advisory impacts only."
        >
          <p className="mb-3 text-xs leading-relaxed text-[var(--jag-muted)]">
            {model.comparison.narrative}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--jag-border)] text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                  <th className="py-2 pr-3 font-medium">Scenario</th>
                  <th className="py-2 pr-3 font-medium">Δ Score</th>
                  <th className="py-2 pr-3 font-medium">Stance</th>
                  <th className="py-2 pr-3 font-medium">Confidence</th>
                  <th className="py-2 pr-3 font-medium">Risks</th>
                  <th className="py-2 font-medium">Opportunities</th>
                </tr>
              </thead>
              <tbody>
                {model.comparison.rows.map((row) => (
                  <tr
                    key={row.scenarioId}
                    className="border-b border-[var(--jag-border)] text-[var(--jag-muted)]"
                  >
                    <td className="py-2 pr-3 text-[var(--jag-text)]">
                      {row.title}
                      {row.scenarioId === model.comparison?.mostFavorableId
                        ? " · favorable"
                        : ""}
                      {row.scenarioId === model.comparison?.highestRiskId
                        ? " · highest risk"
                        : ""}
                      {row.scenarioId === model.comparison?.highestConfidenceId
                        ? " · highest confidence"
                        : ""}
                    </td>
                    <td className="py-2 pr-3 font-[family-name:var(--font-jag-mono)]">
                      {row.scoreDelta >= 0 ? "+" : ""}
                      {(row.scoreDelta * 100).toFixed(1)}
                    </td>
                    <td className="py-2 pr-3 capitalize">
                      {row.stance.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 pr-3 font-[family-name:var(--font-jag-mono)]">
                      {row.scenarioId === "current"
                        ? "—"
                        : `${(row.confidence * 100).toFixed(0)}%`}
                    </td>
                    <td className="py-2 pr-3 font-[family-name:var(--font-jag-mono)]">
                      {row.riskCount}
                    </td>
                    <td className="py-2 font-[family-name:var(--font-jag-mono)]">
                      {row.opportunityCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </JagSection>
      ) : null}

      {model.results.length > 0 ? (
        <JagSection
          title="Scenario results"
          description="Inputs, assumptions, projected impacts, confidence, drivers, and trade-offs."
        >
          <ul className="space-y-4">
            {model.results.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--jag-text)]">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--jag-muted)]">
                      {r.advisoryNotice}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-jag-mono)] text-[11px] text-[var(--jag-muted)]">
                    {(r.confidence * 100).toFixed(0)}% · {r.confidenceBand}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Current</dt>
                    <dd className="mt-0.5 text-[var(--jag-text)]">
                      {r.currentState.summary}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Scenario</dt>
                    <dd className="mt-0.5 text-[var(--jag-text)]">
                      {r.scenarioState.summary}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Difference</dt>
                    <dd className="mt-0.5 text-[var(--jag-text)]">
                      {r.projectedDifference.summary}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs leading-relaxed text-[var(--jag-muted)]">
                  {r.narrative}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ListBlock title="Drivers" items={r.primaryDrivers.map((d) => d.label)} />
                  <ListBlock title="Trade-offs" items={r.tradeOffs.map((t) => `${t.gain} / vs / ${t.cost}`)} />
                  <ListBlock title="Risks" items={r.risks} />
                  <ListBlock title="Opportunities" items={r.opportunities} />
                  <ListBlock
                    title="Assumptions"
                    items={r.assumptions.slice(0, 3).map((a) => a.statement)}
                  />
                  <ListBlock
                    title="Recommended decisions"
                    items={r.recommendedDecisions.map((d) => d.title)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </JagSection>
      ) : null}
    </div>
  );
}

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-[var(--jag-muted)]">None listed.</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-xs text-[var(--jag-text)]">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[var(--jag-muted-2)]">–</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
