import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ItemList, PriorityPill } from "@/components/exec/WidgetPrimitives";
import type { ExecBriefViewModel } from "@/lib/exec/view-models";

export function BriefPage({ data }: { data: ExecBriefViewModel }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Executive Brief</h1>
          <p className="mt-1 text-sm text-slate-500">
            Morning briefing · {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      <WidgetFrame
        widgetId="brief.compose"
        title="Headline"
        domains={data.relatedDomains}
        dataMode={data.dataMode}
      >
        <p className="text-lg font-medium leading-snug text-slate-900">{data.headline}</p>
        <p className="mt-3 text-sm text-slate-600">{data.judgment.whatLeadershipShouldDo}</p>
      </WidgetFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame
          widgetId="brief.what"
          title="What happened"
          domains={["wisdom", "oios-core"]}
          dataMode={data.dataMode}
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {data.whatHappened.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="brief.why"
          title="Why it matters"
          domains={["wisdom"]}
          dataMode={data.dataMode}
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {data.whyItMatters.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </WidgetFrame>
      </div>

      <WidgetFrame
        widgetId="brief.actions"
        title="Recommended actions"
        domains={["wisdom", "organizational-improvement"]}
        dataMode={data.dataMode}
        href="/dashboard/executive/decisions"
      >
        <ul className="space-y-3">
          {data.recommendedActions.map((action, index) => (
            <li key={action.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{action.title}</p>
                  <PriorityPill priority={action.priority} />
                </div>
                {action.subtitle && <p className="mt-1 text-xs text-slate-500">{action.subtitle}</p>}
              </div>
            </li>
          ))}
        </ul>
      </WidgetFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame
          widgetId="brief.risks"
          title="Risks"
          domains={["wisdom"]}
          dataMode={data.dataMode}
          href="/exec/risks"
        >
          <ItemList items={data.risks} />
        </WidgetFrame>
        <WidgetFrame
          widgetId="brief.opportunities"
          title="Opportunities"
          domains={["opportunity", "funding", "revenue"]}
          dataMode={data.dataMode}
          href="/exec/opportunities"
        >
          <ItemList items={data.opportunities} />
        </WidgetFrame>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame
          widgetId="brief.confidence"
          title="Confidence"
          domains={["wisdom"]}
          dataMode={data.dataMode}
        >
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{data.confidence.value}</p>
          <p className="mt-1 text-sm capitalize text-slate-600">{data.confidence.level}</p>
          <ul className="mt-4 space-y-2">
            {data.confidence.factors.map((f) => (
              <li key={f.label} className="flex justify-between text-xs text-slate-600">
                <span>{f.label}</span>
                <span className="tabular-nums">{Math.round(f.contribution * 100) / 100}</span>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="brief.sources"
          title="Evidence & related domains"
          domains={data.relatedDomains}
          dataMode={data.dataMode}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Related intelligence
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {data.relatedDomains.map((d) => (
              <span key={d} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {d}
              </span>
            ))}
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Evidence</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {data.evidence.slice(0, 8).map((e) => (
              <li key={e} className="font-mono">
                {e}
              </li>
            ))}
          </ul>
        </WidgetFrame>
      </div>
    </div>
  );
}
