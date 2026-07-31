import type {
  DomainForecast,
  ForecastingResult,
} from "@/lib/platform/intelligence/forecasting";

type ForecastsPanelProps = {
  forecasts: ForecastingResult | null;
};

const DISPLAY_DOMAINS = [
  "enrollment",
  "finance",
  "staffing",
  "capacity",
] as const;

function formatValue(forecast: DomainForecast): string {
  if (forecast.status === "insufficient_data" || forecast.projectedValue == null) {
    return "—";
  }
  if (forecast.unit.includes("USD") || forecast.unit === "USD") {
    return forecast.projectedValue.toLocaleString();
  }
  if (forecast.unit.includes("%")) {
    return `${forecast.projectedValue}%`;
  }
  return forecast.projectedValue.toLocaleString();
}

function ForecastCard({ forecast }: { forecast: DomainForecast }) {
  if (forecast.status === "insufficient_data") {
    return (
      <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {forecast.label}
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Insufficient historical data
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {forecast.insufficientReason}
        </p>
      </li>
    );
  }

  const explanation = forecast.explanation;

  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {forecast.label}
        </p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
          {forecast.trend}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {formatValue(forecast)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {forecast.horizonLabel} · {forecast.unit}
      </p>

      {explanation ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
            Explanation & assumptions
          </summary>
          <div className="mt-2 space-y-2 text-xs text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Calculation: </span>
              {explanation.calculationSummary}
            </p>
            <div>
              <p className="font-semibold text-slate-700">Assumptions</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {explanation.assumptions.map((a) => (
                  <li key={a.key}>
                    {a.label}: {a.value}
                    {a.unit} ({a.source})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Supporting data</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {explanation.supportingData.map((d) => (
                  <li key={d.key}>
                    {d.label}: {d.value ?? "—"} ({d.source})
                  </li>
                ))}
              </ul>
            </div>
            {explanation.confidenceNotes.length > 0 ? (
              <div>
                <p className="font-semibold text-slate-700">Confidence notes</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {explanation.confidenceNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </li>
  );
}

/** Deterministic forecast summaries for Founder Workspace (Sprint 070). */
export function ForecastsPanel({ forecasts }: ForecastsPanelProps) {
  if (!forecasts) {
    return (
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="forecasts-heading"
      >
        <h2
          id="forecasts-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Forecasts
        </h2>
        <p className="mt-2 text-sm text-slate-500">No forecast data available.</p>
      </section>
    );
  }

  const byDomain = Object.fromEntries(
    forecasts.forecasts.map((f) => [f.domain, f])
  ) as Partial<Record<(typeof DISPLAY_DOMAINS)[number], DomainForecast>>;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="forecasts-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="forecasts-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Forecasts
        </h2>
        <p className="text-xs text-slate-500">
          Scenario: {forecasts.activeScenario.replace(/_/g, " ")} ·{" "}
          {forecasts.horizonDays}-day · deterministic
        </p>
      </div>
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {DISPLAY_DOMAINS.map((domain) => {
          const forecast = byDomain[domain];
          if (!forecast) return null;
          return <ForecastCard key={domain} forecast={forecast} />;
        })}
      </ul>
    </section>
  );
}
