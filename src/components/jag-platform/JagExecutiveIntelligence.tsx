"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JagExecutiveCard } from "@/components/jag-platform/JagExecutiveCard";
import type {
  ExecutiveDashboard,
  ExecutiveInsight,
  InsightDomain,
  InsightSeverity,
  InsightStatus,
} from "@/lib/executive-intelligence";

type OrgOption = { readonly id: string; readonly name: string };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function alertClass(severity: string): string {
  if (severity === "critical") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

function insightSeverityClass(severity: InsightSeverity): string {
  if (severity === "Critical") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  if (severity === "Warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-sky-200 bg-sky-50 text-sky-900";
}

function InsightDetail({ insight }: { insight: ExecutiveInsight }) {
  return (
    <div className="mt-2 space-y-2 border-t border-black/5 pt-2 text-xs">
      <p>
        <span className="font-semibold">Rule:</span> {insight.ruleId}
      </p>
      <p>
        <span className="font-semibold">Suggested next step:</span>{" "}
        {insight.suggestedNextStep}
      </p>
      {insight.supportingEvidence.length > 0 ? (
        <div>
          <p className="font-semibold">Supporting evidence</p>
          <ul className="mt-0.5 list-inside list-disc">
            {insight.supportingEvidence.map((e) => (
              <li key={e.id}>
                <a className="underline underline-offset-2" href={e.href}>
                  {e.label}
                </a>{" "}
                <span className="opacity-70">({e.id.slice(0, 8)}…)</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {insight.relatedConnectorIds.length > 0 ? (
        <p>
          <span className="font-semibold">Related connectors:</span>{" "}
          {insight.relatedConnectorIds.join(", ")}
        </p>
      ) : null}
      {insight.relatedGraphNodeIds.length > 0 ? (
        <p>
          <span className="font-semibold">Related graph nodes:</span>{" "}
          {insight.relatedGraphNodeIds.length} node(s)
        </p>
      ) : null}
      <p className="opacity-70">
        {insight.status} · {new Date(insight.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

export function JagExecutiveIntelligence({
  organizations,
  organizationId,
  dashboard,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly dashboard: ExecutiveDashboard;
}) {
  const router = useRouter();
  const {
    brief,
    financial,
    organizational,
    operational,
    knowledge,
    health,
    alerts,
    insights,
    cards,
    timeline,
  } = dashboard;

  const [severityFilter, setSeverityFilter] = useState<InsightSeverity | "">(
    ""
  );
  const [domainFilter, setDomainFilter] = useState<InsightDomain | "">("");
  const [statusFilter, setStatusFilter] = useState<InsightStatus | "">("Active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInsights = useMemo(() => {
    const pool = [
      ...insights.active,
      ...insights.recentlyResolved.filter(
        (r) => !insights.active.some((a) => a.id === r.id)
      ),
    ];
    return pool.filter((i) => {
      if (severityFilter && i.severity !== severityFilter) return false;
      if (domainFilter && i.domain !== domainFilter) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      return true;
    });
  }, [insights, severityFilter, domainFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Executive Intelligence™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Deterministic executive briefing and evidence-backed insights from
            platform data. No AI analysis in this release.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) =>
              router.push(
                `/jag/executive?org=${encodeURIComponent(e.target.value)}`
              )
            }
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <Section title="Executive Brief">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Organization</dt>
            <dd className="font-medium text-slate-900">{brief.organizationName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Current Date</dt>
            <dd className="font-medium text-slate-900">{brief.currentDate}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Platform Version</dt>
            <dd className="font-medium text-slate-900">{brief.platformVersion}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Connected Systems</dt>
            <dd className="font-medium text-slate-900">{brief.connectedSystems}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total Evidence</dt>
            <dd className="font-medium text-slate-900">{brief.totalEvidence}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Evidence Awaiting Review</dt>
            <dd className="font-medium text-slate-900">
              {brief.evidenceAwaitingReview}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Processing Queue Status</dt>
            <dd className="font-medium text-slate-900">
              {brief.processingQueueStatus.label} · waiting{" "}
              {brief.processingQueueStatus.waiting} · running{" "}
              {brief.processingQueueStatus.running} · failed{" "}
              {brief.processingQueueStatus.failed}
            </dd>
          </div>
        </dl>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <JagExecutiveCard key={card.id} card={card} />
        ))}
      </div>

      <Section title="Decision Summary">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Open decisions</dt>
              <dd className="text-xl font-semibold">
                {dashboard.decisionSummary.open}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Overdue</dt>
              <dd className="text-xl font-semibold">
                {dashboard.decisionSummary.overdue}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Critical</dt>
              <dd className="text-xl font-semibold">
                {dashboard.decisionSummary.critical}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Recently resolved</dt>
              <dd className="text-xl font-semibold">
                {dashboard.decisionSummary.recentlyResolved}
              </dd>
            </div>
          </dl>
          <a
            href={`/jag/decisions?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Open Decision Center™
          </a>
        </div>
        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-500">By business unit</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(dashboard.decisionSummary.byBusinessUnit).map(
                ([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                )
              )}
              {Object.keys(dashboard.decisionSummary.byBusinessUnit).length ===
              0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">By department</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(dashboard.decisionSummary.byDepartment).map(
                ([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                )
              )}
              {Object.keys(dashboard.decisionSummary.byDepartment).length ===
              0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Strategy Summary">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Active goals</dt>
              <dd className="text-xl font-semibold">
                {dashboard.strategySummary.activeGoals}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Completed</dt>
              <dd className="text-xl font-semibold">
                {dashboard.strategySummary.completedGoals}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">At risk</dt>
              <dd className="text-xl font-semibold">
                {dashboard.strategySummary.goalsAtRisk}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Behind schedule</dt>
              <dd className="text-xl font-semibold">
                {dashboard.strategySummary.goalsBehindSchedule}
              </dd>
            </div>
          </dl>
          <a
            href={`/jag/goals?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Open Goals & Strategy™
          </a>
        </div>
        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-500">
              Progress by business unit
            </p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(
                dashboard.strategySummary.progressByBusinessUnit
              ).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}%</span>
                </li>
              ))}
              {Object.keys(dashboard.strategySummary.progressByBusinessUnit)
                .length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">
              Progress by department
            </p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(
                dashboard.strategySummary.progressByDepartment
              ).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}%</span>
                </li>
              ))}
              {Object.keys(dashboard.strategySummary.progressByDepartment)
                .length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Risk Summary">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Critical risks</dt>
              <dd className="text-xl font-semibold">
                {dashboard.riskSummary.criticalRisks}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">High risks</dt>
              <dd className="text-xl font-semibold">
                {dashboard.riskSummary.highRisks}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Overdue reviews</dt>
              <dd className="text-xl font-semibold">
                {dashboard.riskSummary.overdueReviews}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Open mitigations</dt>
              <dd className="text-xl font-semibold">
                {dashboard.riskSummary.openMitigations}
              </dd>
            </div>
          </dl>
          <a
            href={`/jag/risk?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Open Risk & Compliance™
          </a>
        </div>
        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-500">Compliance status</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {dashboard.riskSummary.complianceStatus}
              <span className="ml-1 font-normal text-slate-500">
                ({dashboard.riskSummary.compliantRequirements}/
                {dashboard.riskSummary.totalRequirements})
              </span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-500">By category</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(dashboard.riskSummary.byCategory).map(
                ([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                )
              )}
              {Object.keys(dashboard.riskSummary.byCategory).length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">By business unit</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(dashboard.riskSummary.byBusinessUnit).map(
                ([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                )
              )}
              {Object.keys(dashboard.riskSummary.byBusinessUnit).length ===
              0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Execution Summary">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <dt className="text-slate-500">Active projects</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.activeProjects}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Active work items</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.activeWorkItems}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Blocked</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.blockedWork}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Overdue</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.overdueWork}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Completed this week</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.completedThisWeek}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Avg progress</dt>
              <dd className="text-xl font-semibold">
                {dashboard.executionSummary.averageProgress}%
              </dd>
            </div>
          </dl>
          <a
            href={`/jag/work?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Open Work & Execution™
          </a>
        </div>
        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-500">By business unit</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(
                dashboard.executionSummary.workByBusinessUnit
              ).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}</span>
                </li>
              ))}
              {Object.keys(dashboard.executionSummary.workByBusinessUnit)
                .length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">By department</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(dashboard.executionSummary.workByDepartment).map(
                ([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                )
              )}
              {Object.keys(dashboard.executionSummary.workByDepartment)
                .length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Organizational Knowledge">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-slate-500">New memories</dt>
              <dd className="text-xl font-semibold">
                {dashboard.organizationalKnowledge.newMemories}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Recently updated</dt>
              <dd className="text-xl font-semibold">
                {dashboard.organizationalKnowledge.recentlyUpdated}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Pending validation</dt>
              <dd className="text-xl font-semibold">
                {dashboard.organizationalKnowledge.pendingValidation}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Published</dt>
              <dd className="text-xl font-semibold">
                {dashboard.organizationalKnowledge.published}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Archived</dt>
              <dd className="text-xl font-semibold">
                {dashboard.organizationalKnowledge.archived}
              </dd>
            </div>
          </dl>
          <a
            href={`/jag/memory?org=${encodeURIComponent(organizationId)}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Open Organizational Memory™
          </a>
        </div>
        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-500">Memory categories</p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(
                dashboard.organizationalKnowledge.byCategory
              ).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span>{v}</span>
                </li>
              ))}
              {Object.keys(dashboard.organizationalKnowledge.byCategory)
                .length === 0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-500">Most referenced</p>
            <ul className="mt-1 space-y-0.5">
              {dashboard.organizationalKnowledge.mostReferenced.map((m) => (
                <li key={m.id} className="flex justify-between gap-2">
                  <span className="truncate">{m.title}</span>
                  <span>{m.referenceCount}</span>
                </li>
              ))}
              {dashboard.organizationalKnowledge.mostReferenced.length ===
              0 ? (
                <li>—</li>
              ) : null}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Insights">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="rounded-full bg-sky-50 px-2 py-0.5 ring-1 ring-sky-200">
            Info {insights.countsBySeverity.Info}
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 ring-1 ring-amber-200">
            Warning {insights.countsBySeverity.Warning}
          </span>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 ring-1 ring-rose-200">
            Critical {insights.countsBySeverity.Critical}
          </span>
          <span className="text-slate-500">
            Active {insights.active.length} · Recently resolved{" "}
            {insights.recentlyResolved.length}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <label className="text-slate-600">
            Severity
            <select
              className="ml-1 rounded border border-slate-300 bg-white px-2 py-1"
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as InsightSeverity | "")
              }
            >
              <option value="">All</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          <label className="text-slate-600">
            Domain
            <select
              className="ml-1 rounded border border-slate-300 bg-white px-2 py-1"
              value={domainFilter}
              onChange={(e) =>
                setDomainFilter(e.target.value as InsightDomain | "")
              }
            >
              <option value="">All</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Knowledge">Knowledge</option>
              <option value="Organization">Organization</option>
            </select>
          </label>
          <label className="text-slate-600">
            Status
            <select
              className="ml-1 rounded border border-slate-300 bg-white px-2 py-1"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as InsightStatus | "")
              }
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Resolved">Resolved</option>
            </select>
          </label>
        </div>

        {filteredInsights.length === 0 ? (
          <p className="text-sm text-slate-500">
            No insights match the current filters.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredInsights.map((insight) => (
              <li
                key={insight.id}
                className={`rounded-lg border px-3 py-2 text-sm ${insightSeverityClass(insight.severity)}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedId((id) =>
                      id === insight.id ? null : insight.id
                    )
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{insight.title}</p>
                    <span className="text-xs opacity-80">
                      {insight.severity} · {insight.domain} · {insight.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs opacity-90">
                    {insight.description}
                  </p>
                </button>
                {expandedId === insight.id ? (
                  <InsightDetail insight={insight} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Insights are rule-based and reproducible. Suggested next steps are
          static guidance — not AI recommendations.
        </p>
      </Section>

      {alerts.length > 0 ? (
        <Section title="Executive Alerts">
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg border px-3 py-2 text-sm ${alertClass(alert.severity)}`}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="text-xs opacity-90">{alert.message}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Health Score">
          <p className="text-4xl font-semibold text-slate-900">{health.score}</p>
          <p className="mt-1 text-sm capitalize text-slate-600">{health.label}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            <li>Failed jobs: {health.inputs.failedJobs}</li>
            <li>
              Healthy connectors: {health.inputs.healthyConnectors}/
              {health.inputs.totalConnectors}
            </li>
            <li>Pending evidence: {health.inputs.pendingEvidence}</li>
            <li>Recent errors: {health.inputs.recentErrors}</li>
            <li>Processing queue: {health.inputs.processingQueue}</li>
          </ul>
        </Section>

        <Section title="Financial Intelligence">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Company</dt>
              <dd>{financial.companyName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Connector Status</dt>
              <dd>{financial.connectorStatus}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Latest Sync</dt>
              <dd>
                {financial.latestSyncAt
                  ? new Date(financial.latestSyncAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Financial Documents Imported</dt>
              <dd>{financial.financialDocumentsImported}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Pending Financial Evidence</dt>
              <dd>{financial.pendingFinancialEvidence}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Last Imported Reports</dt>
              <dd>
                {financial.lastImportedReports.length > 0
                  ? financial.lastImportedReports.join(", ")
                  : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Metadata only — no financial calculations or analysis.
          </p>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Organizational Intelligence">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Business Units
              </p>
              <p>{organizational.businessUnits.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Departments
              </p>
              <p>{organizational.departments.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Evidence by Domain
              </p>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(organizational.evidenceByDomain).map(
                  ([domain, count]) => (
                    <li key={domain} className="flex justify-between gap-2">
                      <span>{domain}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Recently Updated Documents
              </p>
              <ul className="mt-1 space-y-0.5">
                {organizational.recentlyUpdatedDocuments.map((d) => (
                  <li key={d.id} className="truncate">
                    {d.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Operational Intelligence">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Processing Jobs</dt>
              <dd>{operational.processingJobs}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Failed Jobs</dt>
              <dd>{operational.failedJobs}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Completed Jobs</dt>
              <dd>{operational.completedJobs}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Platform Health</dt>
              <dd className="capitalize">{operational.platformHealthLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sync Status</dt>
              <dd>{operational.syncStatus}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Connector Health</dt>
              <dd>
                H {operational.connectorHealth.healthy} · W{" "}
                {operational.connectorHealth.warning} · O{" "}
                {operational.connectorHealth.offline} · E{" "}
                {operational.connectorHealth.error}
              </dd>
            </div>
          </dl>
        </Section>
      </div>

      <Section title="Knowledge Intelligence">
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Total Graph Nodes</dt>
            <dd className="text-xl font-semibold">{knowledge.totalGraphNodes}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Relationships</dt>
            <dd className="text-xl font-semibold">{knowledge.relationships}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Recently Added Evidence</dt>
            <dd>
              <ul className="mt-1 space-y-0.5">
                {knowledge.recentlyAddedEvidence.map((n) => (
                  <li key={n.id} className="truncate">
                    {n.label}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Recently Updated Relationships</dt>
            <dd>
              <ul className="mt-1 space-y-0.5">
                {knowledge.recentlyUpdatedRelationships.map((e) => (
                  <li key={e.id}>{e.relationshipType}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Executive Timeline">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ol className="space-y-2">
            {timeline.slice(0, 40).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.source} · {item.detail}
                  </p>
                </div>
                <time className="text-xs text-slate-500">
                  {new Date(item.at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
