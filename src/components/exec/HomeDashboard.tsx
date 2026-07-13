import Link from "next/link";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ItemList, ScoreHero } from "@/components/exec/WidgetPrimitives";
import type { ExecHomeViewModel } from "@/lib/exec/view-models";

export function HomeDashboard({ data }: { data: ExecHomeViewModel }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Home</h1>
          <p className="mt-1 text-sm text-slate-500">
            60-second picture · generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/exec/brief"
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Open Brief
          </Link>
          <Link
            href="/exec/actions"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Review Approvals
          </Link>
        </div>
      </div>

      {/* Row A */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetFrame {...data.health}>
          <ScoreHero score={data.health.score} band={data.health.band} label="Overall" />
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {data.health.dimensions.map((d) => (
              <li key={d.key} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">{d.label}</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{d.score}</p>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame {...data.brief} className="lg:col-span-1">
          <p className="text-base font-medium leading-snug text-slate-900">{data.brief.headline}</p>
          <p className="mt-2 text-sm text-slate-600">{data.brief.summary}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Outlook · {data.brief.outlook}
          </p>
        </WidgetFrame>

        <WidgetFrame {...data.alerts}>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">
            {data.alerts.criticalCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">Critical / high severity</p>
          <div className="mt-4">
            <ItemList items={data.alerts.items} empty="No critical alerts in baseline" />
          </div>
        </WidgetFrame>
      </div>

      {/* Row B */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetFrame {...data.topRecommendation}>
          {data.topRecommendation.item ? (
            <ItemList items={[data.topRecommendation.item]} />
          ) : (
            <p className="text-sm text-slate-500">No recommendation available</p>
          )}
        </WidgetFrame>
        <WidgetFrame {...data.opportunities}>
          <ItemList items={data.opportunities.items} />
        </WidgetFrame>
        <WidgetFrame {...data.risks}>
          <ItemList items={data.risks.items} />
        </WidgetFrame>
      </div>

      {/* Row C */}
      <div className="grid gap-4 md:grid-cols-3">
        {[data.finance, data.workforce, data.customer].map((spark) => (
          <WidgetFrame key={spark.widgetId} {...spark}>
            <ScoreHero score={spark.score} label={spark.label} />
            <p className="mt-2 text-xs text-slate-500">{spark.detail}</p>
          </WidgetFrame>
        ))}
      </div>

      {/* Row D */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame {...data.actions}>
          <ItemList items={data.actions.items} empty="No pending decisions" />
        </WidgetFrame>
        <WidgetFrame {...data.predictive}>
          <ScoreHero
            score={data.predictive.score}
            band={data.predictive.outlook}
            label="Forecast posture"
          />
          <p className="mt-3 text-sm text-slate-600">{data.predictive.headline}</p>
        </WidgetFrame>
      </div>

      {/* Row E */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame {...data.timeline}>
          <ItemList items={data.timeline.items} />
        </WidgetFrame>
        <WidgetFrame {...data.graph}>
          <p className="text-sm font-medium text-slate-900">{data.graph.status}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {data.graph.moduleCount}
          </p>
          <p className="text-xs text-slate-500">Registered intelligence modules</p>
        </WidgetFrame>
      </div>
    </div>
  );
}
