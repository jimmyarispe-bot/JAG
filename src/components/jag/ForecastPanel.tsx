import type { OrganizationForecast } from "@/lib/platform/intelligence/organization/types";

interface ForecastPanelProps {
  forecasts: readonly OrganizationForecast[];
}

export function ForecastPanel({ forecasts }: ForecastPanelProps) {
  return (
    <section id="forecasts" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Forecasts</h2>
      {forecasts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No forecasts in this observation cycle.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {forecasts.map((forecast) => (
            <li key={forecast.forecastId} className="rounded-xl border border-slate-100 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium capitalize text-slate-900">
                  {forecast.domain.replaceAll("_", " ")}
                </p>
                <span className="text-xs uppercase text-slate-500">{forecast.direction}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{forecast.projectedValue}</p>
              <p className="text-xs text-slate-500">
                Current {forecast.currentValue} · {forecast.horizonDays}d horizon · confidence{" "}
                {Math.round(forecast.confidence.value * 100)}%
              </p>
              <p className="mt-2 text-sm text-slate-600">{forecast.narrative}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
