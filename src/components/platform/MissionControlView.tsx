"use client";

import Link from "next/link";
import { useTransition } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlobalSearchPanel } from "@/components/platform/admin/GlobalSearchPanel";
import { formatCount, formatCurrency } from "@/lib/format";
import { resolveMissionControlItemAction } from "@/lib/platform/automation/server-actions";
import type { MissionControlCommandCenter } from "@/lib/platform/automation/mission-control-compose";

type MissionControlViewProps = MissionControlCommandCenter;

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  low: "bg-blue-50 text-blue-700 border-blue-100",
};

const FINANCIAL_STATUS: Record<string, string> = {
  healthy: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  critical: "text-red-700 bg-red-50",
};

function PriorityList({
  items,
  onResolve,
  isPending,
}: {
  items: MissionControlCommandCenter["priorities"]["critical"];
  onResolve?: (id: string) => void;
  isPending: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">None</p>;
  }
  return (
    <ul className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <li
          key={item.id}
          className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.medium}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.title}</p>
              {item.description && <p className="mt-0.5 text-xs opacity-80">{item.description}</p>}
              <p className="mt-1 text-xs opacity-60">
                {item.source.replace(/_/g, " ")}
                {item.module ? ` · ${item.module}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {item.href && (
                <Link href={item.href} className="text-xs font-medium underline">
                  Open
                </Link>
              )}
              {item.source === "mission_control" && onResolve && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onResolve(item.id)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MissionControlView(props: MissionControlViewProps) {
  const [isPending, startTransition] = useTransition();

  if (props.accessDenied) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Mission Control access required</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your role does not include the Mission Control permission. Contact an administrator if you need access.
        </p>
      </div>
    );
  }

  function handleResolve(id: string) {
    startTransition(async () => {
      await resolveMissionControlItemAction(id);
    });
  }

  const { health, metrics, priorities, activityStream, loopStages, networkMap, aiBrief } = props;

  return (
    <div className="space-y-8">
      {/* Mission Health */}
      <section className="rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Mission Control™</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Mission Health™</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Operational command center for {props.userRole?.replace(/_/g, " ") ?? "your organization"}.
              All critical platform activity surfaces here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Operational Health</p>
              <p className="text-2xl font-bold text-brand-700">{health.operationalHealthScore}</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">JAG OEI™</p>
              <p className="text-2xl font-bold text-indigo-700">{health.operationalExcellenceIndex}</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Loop Health</p>
              <p className="text-2xl font-bold text-emerald-700">{health.loopHealthPct}%</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {health.oeiDimensions.map((d) => (
            <div key={d.key} className="rounded-lg bg-white/70 px-3 py-2">
              <p className="text-xs text-slate-500">{d.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${d.score}%` }} />
                </div>
                <span className="text-xs font-medium">{d.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AttentionChip label="Active Alerts" value={health.activeAlerts} href="/dashboard/mission-control" />
          <AttentionChip label="Students" value={health.studentsRequiringAttention} href="/dashboard/students" />
          <AttentionChip label="Families" value={health.familiesRequiringAttention} href="/dashboard/families" />
          <AttentionChip label="Teacher Issues" value={health.teacherIssues} href="/dashboard/teacher" />
          <AttentionChip label="Scheduling" value={health.schedulingIssues} href="/dashboard/scheduling" />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className={`rounded-lg px-3 py-1 font-medium ${FINANCIAL_STATUS[health.financialStatus]}`}>
            Financial: {health.financialStatus}
          </span>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700">
            Admissions pipeline: {formatCount(health.admissionsPipeline)}
          </span>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700">
            Staffing issues: {formatCount(health.staffingIssues)}
          </span>
        </div>
      </section>

      {/* Mission Metrics */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission Metrics</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Enrollment" value={formatCount(metrics.enrollment)} description="Active students" accent="indigo" icon={<span>◎</span>} />
          <StatCard title="Admissions" value={formatCount(metrics.admissionsPipeline)} description="Pipeline leads" accent="violet" icon={<span>→</span>} />
          <StatCard title="Revenue" value={formatCurrency(metrics.revenue)} description="Collected YTD" accent="emerald" icon={<span>$</span>} />
          <StatCard title="Cash Flow" value={formatCurrency(metrics.cashFlow)} description="Payments YTD" accent="emerald" icon={<span>↗</span>} />
          <StatCard title="Attendance" value={metrics.attendanceRate != null ? `${metrics.attendanceRate}%` : "—"} description="Present rate" accent="sky" icon={<span>✓</span>} />
          <StatCard title="Success Score" value={metrics.avgSuccessScore != null ? String(metrics.avgSuccessScore) : "—"} description="Avg learner score" accent="amber" icon={<span>★</span>} />
          <StatCard title="Staffing" value={formatCount(metrics.staffingLevels)} description="Active staff" accent="indigo" icon={<span>👤</span>} />
          <StatCard title="Open Items" value={formatCount(props.summary.openItems)} description="Mission Control" accent="rose" icon={<span>!</span>} />
        </div>
      </section>

      {/* Mission Priorities */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission Priorities</h3>
        <p className="mt-1 text-sm text-slate-600">
          Auto-ranked from JAG Work™, Rules Engine™, Operational Loop™, and AI Recommendations™.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {(["critical", "high", "medium", "low"] as const).map((tier) => (
            <article key={tier} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold capitalize text-slate-900">
                {tier} ({priorities[tier].length})
              </h4>
              <div className="mt-3">
                <PriorityList
                  items={priorities[tier]}
                  isPending={isPending}
                  onResolve={handleResolve}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Live Activity Stream */}
        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Real-Time Operations</h3>
          <p className="mt-1 text-xs text-slate-500">
            Admissions · Enrollment · Scheduling · Instruction · Evidence · Progress · Parent Communication · Billing
          </p>
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {activityStream.length === 0 && (
              <li className="text-sm text-slate-500">No recent platform activity.</li>
            )}
            {activityStream.map((event) => (
              <li key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {event.module_key} · {event.event_type.replace(/\./g, " · ")} ·{" "}
                      {new Date(event.occurred_at).toLocaleString()}
                    </p>
                    {event.summary && <p className="mt-1 text-xs text-slate-600">{event.summary}</p>}
                  </div>
                  {event.href && (
                    <Link href={event.href} className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mission AI */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Mission AI</h3>
          <p className="mt-1 text-xs text-slate-500">Today&apos;s Executive Brief™</p>
          {aiBrief.executiveBrief ? (
            <p className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">{aiBrief.executiveBrief}</p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No brief generated yet for today.</p>
          )}

          <div className="mt-4 space-y-4">
            <BriefSection title="Highest Risks" items={aiBrief.highestRisks.map((r) => ({ title: r.title, body: r.body, href: r.href }))} />
            <BriefSection title="Opportunities" items={aiBrief.opportunities.map((o) => ({ title: o.title, body: o.body, href: o.href }))} />
            <BriefSection
              title="Recommended Actions"
              items={aiBrief.recommendedActions.map((a) => ({ title: a.title, body: a.action, href: a.href }))}
            />
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Projected Problems</p>
            {aiBrief.projectedProblems.map((block) => (
              <div key={block.horizon}>
                <p className="text-xs font-medium text-slate-700">{block.horizon}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                  {block.items.length ? block.items.map((item, i) => <li key={i}>{item}</li>) : <li>None identified</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mission Alerts */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Mission Alerts</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {props.feed.length === 0 && (
            <p className="text-sm text-slate-500">No open mission control items.</p>
          )}
          {props.feed.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 ${SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.normal}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {item.module} · {item.item_type.replace(/_/g, " ")} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  {item.body && <p className="mt-2 text-sm opacity-90">{item.body}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {item.href && (
                    <Link href={item.href} className="text-xs font-medium underline">
                      Open record
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleResolve(item.id)}
                    className="text-xs opacity-70 hover:opacity-100"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Map */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Mission Map™</h3>
        <p className="mt-1 text-sm text-slate-600">Operational Loop™ status across active students</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {loopStages.map((stage, idx) => (
            <div key={stage.stage} className="flex items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center min-w-[7rem]">
                <p className="text-xs text-slate-500">{stage.label}</p>
                <p className="text-lg font-semibold text-slate-900">{formatCount(stage.count)}</p>
              </div>
              {idx < loopStages.length - 1 && (
                <span className="text-slate-300">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">School</th>
                <th className="py-2 pr-4">Enrollment</th>
                <th className="py-2 pr-4">Pipeline</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2 pr-4">Staff</th>
                <th className="py-2">Success</th>
              </tr>
            </thead>
            <tbody>
              {networkMap.map((row) => (
                <tr key={row.dimensionValue} className="border-b border-slate-100">
                  <td className="py-2 pr-4">
                    {row.drillHref ? (
                      <Link href={row.drillHref} className="font-medium text-brand-600 hover:underline">
                        {row.dimensionValue}
                      </Link>
                    ) : (
                      row.dimensionValue
                    )}
                  </td>
                  <td className="py-2 pr-4">{formatCount(row.enrollment)}</td>
                  <td className="py-2 pr-4">{formatCount(row.pipelineLeads)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.revenue)}</td>
                  <td className="py-2 pr-4">{formatCount(row.activeStaff)}</td>
                  <td className="py-2">{row.avgSuccessScore ?? "—"}</td>
                </tr>
              ))}
              {!networkMap.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-500">
                    No network dimension data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard/executive?view=operational-loop" className="text-brand-600 hover:underline">
            Operational Loop dashboard →
          </Link>
          <Link href="/dashboard/executive" className="text-brand-600 hover:underline">
            Executive Intelligence →
          </Link>
        </div>
      </section>

      {/* Mission Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Mission Search™</h3>
        <p className="mt-1 text-sm text-slate-600">
          Universal search across students, families, employees, admissions, work, and records.
        </p>
        <div className="mt-4">
          <GlobalSearchPanel />
        </div>
      </section>

      {/* Queue status sidebar content */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Platform Queue Status</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {Object.entries(props.queueMetrics).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <dt className="capitalize text-slate-500">{status}</dt>
                <dd className="font-medium text-slate-900">{count}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Quick Navigation</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/dashboard/admissions" className="text-brand-600 hover:underline">Admissions</Link></li>
            <li><Link href="/dashboard/scheduling" className="text-brand-600 hover:underline">Scheduling</Link></li>
            <li><Link href="/dashboard/teacher" className="text-brand-600 hover:underline">Instruction</Link></li>
            <li><Link href="/dashboard/finance" className="text-brand-600 hover:underline">Billing & Finance</Link></li>
            <li><Link href="/dashboard/executive/briefings" className="text-brand-600 hover:underline">Executive Briefings</Link></li>
            <li><Link href="/dashboard/mission-control" className="text-brand-600 hover:underline">Refresh Mission Control</Link></li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function AttentionChip({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-brand-300"
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{formatCount(value)}</p>
    </Link>
  );
}

function BriefSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; body: string; href: string | null }>;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item.title} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
            <p className="font-medium text-slate-800">{item.title}</p>
            <p className="mt-0.5 text-slate-600 line-clamp-2">{item.body}</p>
            {item.href && (
              <Link href={item.href} className="mt-1 inline-block text-brand-600 hover:underline">
                View
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
