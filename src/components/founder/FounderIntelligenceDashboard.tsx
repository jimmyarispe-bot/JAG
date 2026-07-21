import Link from "next/link";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import type { FounderDashboardBundle } from "@/lib/founder-intelligence/types";
import {
  founderDecisionAction,
  refreshFounderIntelligenceAction,
  saveFounderMemoryAction,
} from "@/lib/founder-intelligence/server-actions";
import { ProductionRealtimeBadge } from "@/components/production/ProductionRealtimeBadge";

interface Props {
  bundle: FounderDashboardBundle;
  canDecide: boolean;
  organizationId?: string | null;
  schoolId?: string | null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === "critical"
      ? "bg-red-600"
      : severity === "high"
        ? "bg-orange-500"
        : severity === "medium"
          ? "bg-amber-400"
          : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function FounderIntelligenceDashboard({
  bundle,
  canDecide,
  organizationId,
  schoolId,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Founder Intelligence · analyzed {new Date(bundle.generatedAt).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Consumes Executive Intelligence events — analyzes, does not republish operational
            activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProductionRealtimeBadge topic="founder_dashboard" label="Insights" />
          <ProductionRealtimeBadge topic="insight_updates" label="JAG" />
          {canDecide ? (
            <form action={refreshFounderIntelligenceAction}>
              <input type="hidden" name="organization_id" value={organizationId ?? ""} />
              <input type="hidden" name="school_id" value={schoolId ?? ""} />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Refresh brief
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {bundle.kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
          >
            <p className="text-xs font-medium uppercase text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCount(kpi.value)}
              {kpi.unit === "score" ? "" : kpi.unit ? ` ${kpi.unit}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">Trend {kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Executive Brief">
          <ul className="space-y-3">
            {bundle.executiveBrief.slice(0, 10).map((item) => (
              <li key={item.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-start gap-2">
                  <SeverityDot severity={item.severity} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.summary}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Why: {item.explainability.why} · Confidence{" "}
                      {Math.round(item.explainability.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Today's Priorities">
          {bundle.priorities.length === 0 ? (
            <p className="text-sm text-slate-500">No high-priority items right now.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-800">
              {bundle.priorities.map((p) => (
                <li key={p.id}>
                  <span className="font-medium">{p.title}</span>
                  <span className="block text-xs text-slate-500">{p.summary}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>

      <Section title="Organization Health">
        <div className="mb-4 rounded-lg bg-slate-900 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-wide text-slate-300">Overall</p>
          <p className="text-3xl font-semibold">{bundle.overallHealth.score}</p>
          <p className="text-xs text-slate-300">
            {bundle.overallHealth.trend} · confidence{" "}
            {Math.round(bundle.overallHealth.confidence * 100)}%
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.organizationHealth.map((h) => (
            <div key={h.domain} className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">
                {h.domain.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{h.score}</p>
              <p className="text-[11px] text-slate-500">
                {h.trend} · {Math.round(h.confidence * 100)}% conf.
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{h.factors[0]}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Risks">
          <ul className="space-y-3">
            {bundle.risks.length === 0 ? (
              <li className="text-sm text-slate-500">No elevated risks detected.</li>
            ) : (
              bundle.risks.map((r) => (
                <li key={r.id} className="rounded-lg bg-red-50/60 p-3">
                  <div className="flex items-center gap-2">
                    <SeverityDot severity={r.severity} />
                    <p className="text-sm font-medium text-slate-900">{r.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{r.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    P{Math.round(r.probability)}% · Impact {Math.round(r.impact)} ·{" "}
                    {r.recommendedAction}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Why: {r.explainability.why}</p>
                </li>
              ))
            )}
          </ul>
        </Section>

        <Section title="Opportunities">
          <ul className="space-y-3">
            {bundle.opportunities.length === 0 ? (
              <li className="text-sm text-slate-500">No opportunities surfaced.</li>
            ) : (
              bundle.opportunities.map((o) => (
                <li key={o.id} className="rounded-lg bg-emerald-50/50 p-3">
                  <p className="text-sm font-medium text-slate-900">{o.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{o.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Est. ${Math.round(o.estimatedValue).toLocaleString()} · Conf.{" "}
                    {Math.round(o.confidence * 100)}%
                  </p>
                </li>
              ))
            )}
          </ul>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Predictions">
          <ul className="space-y-3">
            {bundle.predictions.map((p) => (
              <li key={p.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="text-sm font-medium text-slate-900">{p.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {p.low.toLocaleString()} – {p.high.toLocaleString()} {p.unit} (mid{" "}
                  {p.mid.toLocaleString()})
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {p.factors.slice(0, 2).join(" · ")} · Conf.{" "}
                  {Math.round(p.confidence * 100)}%
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="AI Recommendations">
          <ul className="space-y-3">
            {bundle.recommendations.slice(0, 8).map((rec) => (
              <li key={rec.id} className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium text-slate-900">{rec.title}</p>
                <p className="mt-1 text-xs text-slate-600">{rec.summary}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Priority {rec.priority} · {rec.impact} · Conf.{" "}
                  {Math.round(rec.confidence * 100)}%
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Why: {rec.explainability.why}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Cross-Domain Insights">
        <ul className="space-y-3">
          {bundle.correlations.map((c) => (
            <li key={c.id}>
              <p className="text-sm font-medium text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-600">{c.summary}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Domains: {c.domains.join(" · ")} · Conf. {Math.round(c.confidence * 100)}%
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Decisions">
        {bundle.decisions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No decisions yet. Refresh the brief to seed recommendations into the Decision Center.
          </p>
        ) : (
          <ul className="space-y-4">
            {bundle.decisions.map((d) => (
              <li key={d.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{d.title}</p>
                    <p className="text-xs text-slate-600">{d.description}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                      {d.status} · priority {d.priority}
                    </p>
                  </div>
                  {canDecide && d.status === "pending" ? (
                    <div className="flex flex-wrap gap-1">
                      {(["approve", "dismiss", "delegate", "schedule", "track"] as const).map(
                        (action) => (
                          <form key={action} action={founderDecisionAction}>
                            <input type="hidden" name="decision_id" value={d.id} />
                            <input type="hidden" name="action" value={action} />
                            {action === "delegate" ? (
                              <input type="hidden" name="delegated_to" value="School Leader" />
                            ) : null}
                            {action === "schedule" ? (
                              <input
                                type="hidden"
                                name="scheduled_for"
                                value={new Date(Date.now() + 86400000).toISOString()}
                              />
                            ) : null}
                            <button
                              type="submit"
                              className="rounded border border-slate-200 px-2 py-1 text-[11px] capitalize text-slate-700 hover:bg-slate-50"
                            >
                              {action}
                            </button>
                          </form>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Founder Memory">
          <ul className="mb-4 space-y-2">
            {bundle.memory.length === 0 ? (
              <li className="text-sm text-slate-500">No pinned priorities or initiatives yet.</li>
            ) : (
              bundle.memory.map((m) => (
                <li key={m.id} className="text-sm text-slate-800">
                  <span className="text-[11px] uppercase text-slate-400">
                    {m.memoryType.replace(/_/g, " ")}
                  </span>
                  <p className="font-medium">{m.title}</p>
                  {m.body ? <p className="text-xs text-slate-500">{m.body}</p> : null}
                </li>
              ))
            )}
          </ul>
          {canDecide ? (
            <form action={saveFounderMemoryAction} className="space-y-2 border-t border-slate-100 pt-3">
              <input type="hidden" name="organization_id" value={organizationId ?? ""} />
              <input type="hidden" name="school_id" value={schoolId ?? ""} />
              <input type="hidden" name="memory_type" value="pinned_priority" />
              <input type="hidden" name="pinned" value="true" />
              <input
                name="title"
                required
                placeholder="Pin a priority…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Pin priority
              </button>
            </form>
          ) : null}
        </Section>

        <Section title="Timeline">
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {bundle.timeline.slice(0, 30).map((t) => (
              <li key={`${t.source}-${t.id}`} className="flex gap-3 text-xs">
                <span className="w-28 shrink-0 text-slate-400">
                  {new Date(t.occurredAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div>
                  <span className="font-medium text-slate-700">{t.category}</span>
                  <p className="text-slate-800">{t.title}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/executive"
              className="text-xs text-slate-600 underline hover:text-slate-900"
            >
              Executive Intelligence
            </Link>
            <Link
              href="/exec"
              className="text-xs text-slate-600 underline hover:text-slate-900"
            >
              JAG Command Center
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
