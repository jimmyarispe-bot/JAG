import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { GlobalSearchPanel } from "@/components/platform/admin/GlobalSearchPanel";
import { MissionControlResolveIsland } from "@/components/platform/MissionControlResolveIsland";
import { ActionChip, ActionChipGroup } from "@/components/experience-system/feedback/ActionChip";
import { formatCount, formatCurrency } from "@/lib/format";
import type { MissionControlCommandCenter } from "@/lib/platform/automation/mission-control-compose";

type MissionControlViewProps = MissionControlCommandCenter;

const FINANCIAL_STATUS: Record<string, string> = {
  healthy: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  critical: "text-red-700 bg-red-50",
};

/**
 * P007 — Server Component mission control dashboard.
 * Resolve actions + search remain client islands.
 */
export function MissionControlView(props: MissionControlViewProps) {
  if (props.accessDenied) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Mission Control access required</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your role does not include the Mission Control permission. Contact an administrator if you need
          access.
        </p>
      </div>
    );
  }

  const { health, metrics, priorities, activityStream, loopStages, networkMap, aiBrief } = props;

  return (
    <div className="space-y-8">
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

      <MissionControlResolveIsland priorities={priorities} feed={props.feed} />

      <div className="grid gap-6 xl:grid-cols-3">
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
                    <ActionChip href={event.href} size="xs" className="shrink-0">
                      View
                    </ActionChip>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

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
              {idx < loopStages.length - 1 && <span className="text-slate-300">→</span>}
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
                      <ActionChip href={row.drillHref} size="xs" variant="ghost">
                        {row.dimensionValue}
                      </ActionChip>
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

        <ActionChipGroup className="mt-4">
          <ActionChip href="/dashboard/executive?view=operational-loop" size="sm">
            Operational Loop dashboard
          </ActionChip>
          <ActionChip href="/dashboard/executive" size="sm">
            Executive Intelligence
          </ActionChip>
        </ActionChipGroup>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Mission Search™</h3>
        <p className="mt-1 text-sm text-slate-600">
          Universal search across students, families, employees, admissions, work, and records.
        </p>
        <div className="mt-4">
          <GlobalSearchPanel />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Platform Queue Status</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {Object.entries(props.queueMetrics).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <dt className="capitalize text-slate-500">{status}</dt>
                <dd className="font-medium text-slate-900">{formatCount(count)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Quick Navigation</h3>
          <ActionChipGroup className="mt-3">
            <ActionChip href="/dashboard/admissions" size="sm">
              Admissions
            </ActionChip>
            <ActionChip href="/dashboard/scheduling" size="sm">
              Scheduling
            </ActionChip>
            <ActionChip href="/dashboard/teacher" size="sm">
              Instruction
            </ActionChip>
            <ActionChip href="/dashboard/finance" size="sm">
              Billing & Finance
            </ActionChip>
            <ActionChip href="/dashboard/executive/briefings" size="sm">
              Executive Briefings
            </ActionChip>
            <ActionChip href="/dashboard/mission-control" size="sm">
              Refresh Mission Control
            </ActionChip>
          </ActionChipGroup>
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
              <ActionChip href={item.href} size="xs" className="mt-1">
                View
              </ActionChip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
