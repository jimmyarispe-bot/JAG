"use client";

import { useMemo, useState } from "react";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ItemList, PriorityPill } from "@/components/exec/WidgetPrimitives";
import type { ExecWisdomViewModel } from "@/lib/exec/view-models";

const LENS_ORDER = [
  ["strategicValue", "Strategic value"],
  ["longTermImpact", "Long-term impact"],
  ["confidenceLevel", "Confidence level"],
  ["evidenceQuality", "Evidence quality"],
  ["tradeOffBalance", "Trade-off balance"],
  ["organizationalAlignment", "Organizational alignment"],
  ["ethicalIntegrity", "Ethical integrity"],
  ["wisdomScore", "Wisdom score"],
] as const;

export function WisdomPage({ data }: { data: ExecWisdomViewModel }) {
  const [selectedId, setSelectedId] = useState(data.recommendations[0]?.id ?? "");
  const selected = useMemo(
    () => data.recommendations.find((r) => r.id === selectedId) ?? data.recommendations[0] ?? null,
    [data.recommendations, selectedId]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Wisdom Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recommendations with trade-offs, ethics, and long-term impact
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <WidgetFrame
          widgetId="wisdom.recommendations"
          title="Recommendations"
          domains={["wisdom"]}
          dataMode={data.dataMode}
          className="lg:col-span-4"
        >
          <ul className="space-y-2">
            {data.recommendations.map((rec) => {
              const active = selected?.id === rec.id;
              return (
                <li key={rec.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(rec.id)}
                    className={
                      active
                        ? "w-full rounded-xl bg-brand-50 px-3 py-2.5 text-left ring-1 ring-brand-200"
                        : "w-full rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{rec.title}</p>
                      <PriorityPill priority={rec.priority} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Confidence {rec.confidence}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </WidgetFrame>

        <div className="space-y-4 lg:col-span-5">
          <WidgetFrame
            widgetId="wisdom.judgment"
            title="Executive Judgment Framework"
            domains={["wisdom", "ethical"]}
            dataMode={data.dataMode}
          >
            {selected ? (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Action: </span>
                  {selected.action}
                </p>
                <p>
                  <span className="font-medium text-slate-900">What leadership should do: </span>
                  {data.judgment.whatLeadershipShouldDo}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Why: </span>
                  {data.judgment.why}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Why now: </span>
                  {data.judgment.whyNow}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Alternatives: </span>
                  {data.judgment.whyNotAlternatives}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Expected outcome: </span>
                  {data.judgment.expectedOutcome}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a recommendation</p>
            )}
          </WidgetFrame>

          <WidgetFrame
            widgetId="wisdom.tradeoffs"
            title="Trade-offs"
            domains={["wisdom"]}
            dataMode={data.dataMode}
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              {data.tradeOffs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </WidgetFrame>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <WidgetFrame
            widgetId="wisdom.evidence"
            title="Judgment lenses"
            domains={["wisdom", "knowledge", "document"]}
            dataMode={data.dataMode}
          >
            {selected ? (
              <ul className="space-y-3">
                {LENS_ORDER.map(([key, label]) => (
                  <li key={key}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-700">{selected.lenses[key]}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Select a recommendation</p>
            )}
          </WidgetFrame>

          <WidgetFrame
            widgetId="wisdom.confidence"
            title="Confidence"
            domains={["wisdom"]}
            dataMode={data.dataMode}
          >
            <p className="text-3xl font-semibold tabular-nums text-slate-900">{data.confidence.value}</p>
            <p className="text-sm capitalize text-slate-600">{data.confidence.level}</p>
          </WidgetFrame>

          <WidgetFrame
            widgetId="wisdom.ethical"
            title="Ethical considerations"
            domains={["ethical"]}
            dataMode={data.dataMode}
          >
            <ul className="list-disc space-y-2 pl-5 text-xs text-slate-700">
              {data.ethical.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </WidgetFrame>

          <WidgetFrame
            widgetId="wisdom.longterm"
            title="Long-term impact"
            domains={["wisdom", "impact", "resilience"]}
            dataMode={data.dataMode}
          >
            <ul className="list-disc space-y-2 pl-5 text-xs text-slate-700">
              {data.longTerm.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </WidgetFrame>

          {selected && (
            <WidgetFrame
              widgetId="wisdom.evidence.refs"
              title="Evidence refs"
              domains={["wisdom"]}
              dataMode={data.dataMode}
            >
              <ItemList
                items={selected.evidenceRefs.map((ref) => ({
                  id: ref,
                  title: ref,
                }))}
                empty="No evidence refs"
              />
            </WidgetFrame>
          )}
        </div>
      </div>
    </div>
  );
}
