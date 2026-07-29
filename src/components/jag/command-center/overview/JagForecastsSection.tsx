import Link from "next/link";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";
import type { JagForecastsOverviewView } from "@/lib/jag-command-center";

export function JagForecastsSection({
  forecasts,
}: {
  readonly forecasts: JagForecastsOverviewView;
}) {
  return (
    <JagSection
      title="Forecasts"
      description="Advisory predictions of likely future conditions. Not facts — confidence, drivers, and assumptions always apply."
      actions={
        <Link
          href="/jag/scenarios"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Scenario Planner
        </Link>
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--jag-muted)]">{forecasts.advisoryNotice}</p>
        <JagStatusBadge status={forecasts.status === "ready" ? "ready" : "empty"} />
      </div>

      {forecasts.status === "empty" || forecasts.cards.length === 0 ? (
        <p className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 text-sm leading-relaxed text-[var(--jag-muted)]">
          {forecasts.explanation}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[var(--jag-muted)]">{forecasts.explanation}</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {forecasts.cards.map((card) => (
              <li
                key={card.id}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--jag-text)]">
                      {card.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[var(--jag-muted)]">
                      Horizon · {card.horizonLabel}
                    </p>
                  </div>
                  <span className="rounded border border-[var(--jag-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--jag-muted)]">
                    {card.riskLevel.replace(/_/g, " ")}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Trend</dt>
                    <dd className="mt-0.5 capitalize text-[var(--jag-text)]">
                      {card.trend}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Confidence</dt>
                    <dd className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
                      {card.insufficientData
                        ? "—"
                        : `${(card.confidence * 100).toFixed(0)}%`}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs leading-relaxed text-[var(--jag-muted)]">
                  {card.predictedSummary}
                </p>

                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
                    Drivers
                  </p>
                  {card.drivers.length === 0 ? (
                    <p className="mt-1 text-xs text-[var(--jag-muted)]">
                      Insufficient drivers — bind contributor outputs.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-0.5 text-xs text-[var(--jag-text)]">
                      {card.drivers.map((d) => (
                        <li key={d} className="flex gap-2">
                          <span className="text-[var(--jag-muted-2)]">–</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--jag-muted)]">
                    Actions
                  </p>
                  {card.actions.length === 0 ? (
                    <p className="mt-1 text-xs text-[var(--jag-muted)]">None listed.</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5 text-xs text-[var(--jag-text)]">
                      {card.actions.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span className="text-[var(--jag-muted-2)]">–</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </JagSection>
  );
}
