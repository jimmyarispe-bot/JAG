import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  ComplianceAdminForms,
  ComplianceCategoryForm,
  ComplianceDocumentForm,
  ObligationForm,
  ObligationTable,
} from "@/components/compliance/ComplianceObligationIslands";
import { ActionChip } from "@/components/ui/cta";
import { formatCount } from "@/lib/format";
import type {
  ComplianceDashboardStats,
  ComplianceDomainScore,
  ComplianceObligation,
} from "@/lib/compliance/types";

interface ComplianceTabsProps {
  view: string;
  stats: ComplianceDashboardStats;
  obligations: ComplianceObligation[];
  categories: Record<string, unknown>[];
  domainScores: ComplianceDomainScore[];
  documents: Record<string, unknown>[];
  reminderSchedules: Record<string, unknown>[];
  escalationRules: Record<string, unknown>[];
  schools: { id: string; name: string }[];
  calendarItems: Pick<ComplianceObligation, "id" | "title" | "due_date" | "status" | "risk_level">[];
  canAdmin: boolean;
  schoolId: string;
}

/**
 * P007 — Server Component compliance views; forms/complete stay client islands.
 */
export function ComplianceTabs({
  view,
  stats,
  obligations,
  categories,
  domainScores,
  documents,
  reminderSchedules,
  escalationRules,
  schools,
  calendarItems,
  canAdmin,
  schoolId,
}: ComplianceTabsProps) {
  if (view === "dashboard") {
    return (
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Upcoming (30d)" value={formatCount(stats.upcoming)} accent="sky" icon={<span className="font-bold">U</span>} description="Due soon" />
          <StatCard title="Overdue" value={formatCount(stats.overdue)} accent="rose" icon={<span className="font-bold">!</span>} description="Requires action" />
          <StatCard title="Completed" value={formatCount(stats.completed)} accent="emerald" icon={<span className="font-bold">✓</span>} description="On record" />
          <StatCard title="Compliance %" value={`${stats.compliancePct}%`} accent="indigo" icon={<span className="font-bold">%</span>} description="Completion rate" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Executive scores by domain</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {domainScores
                .filter((s) => s.total_obligations > 0)
                .map((s) => (
                  <li key={s.domain} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="capitalize">{s.domain.replace(/_/g, " ")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreColor(s.status_indicator)}`}>
                      {s.score_pct}%
                    </span>
                  </li>
                ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">By category</h2>
            <ul className="mt-4 space-y-1 text-sm">
              {Object.entries(stats.byCategory)
                .slice(0, 10)
                .map(([cat, count]) => (
                  <li key={cat} className="flex justify-between">
                    <span>{cat}</span>
                    <span>{count}</span>
                  </li>
                ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Risk heat map (critical items: {stats.criticalCount})</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {domainScores.map((s) => (
              <div key={s.domain} className={`rounded-xl p-3 text-center text-sm ${heatColor(s.status_indicator)}`}>
                <p className="font-medium capitalize">{s.domain.replace(/_/g, " ")}</p>
                <p className="text-xs">{s.overdue_obligations} overdue</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === "upcoming" || view === "overdue" || view === "obligations") {
    const today = new Date().toISOString().split("T")[0];
    const list =
      view === "overdue"
        ? obligations.filter(
            (o) => o.status === "overdue" || (o.status === "pending" && o.due_date < today)
          )
        : view === "upcoming"
          ? obligations.filter((o) => o.due_date >= today)
          : obligations;

    return (
      <div className="space-y-6">
        {view === "obligations" && <ObligationForm schools={schools} categories={categories} />}
        <ObligationTable obligations={list} />
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Compliance calendar</h2>
          <ActionChip href={`/api/compliance/calendar.ics?schoolId=${schoolId}`} size="sm">
            Export ICS
          </ActionChip>
        </div>
        <ul className="space-y-2 text-sm">
          {calendarItems.map((o) => (
            <li key={o.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>{o.title}</span>
              <span className="text-slate-500">
                {o.due_date} · {o.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (view === "categories") {
    return (
      <div className="space-y-6">
        {canAdmin && <ComplianceCategoryForm />}
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {categories.map((c) => (
            <li key={c.id as string} className="rounded-lg border border-slate-100 px-3 py-2">
              <p className="font-medium">{c.name as string}</p>
              <p className="text-xs capitalize text-slate-500">{c.domain as string}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (view === "documents") {
    return (
      <div className="space-y-6">
        <ComplianceDocumentForm obligations={obligations} />
        <ul className="space-y-2 text-sm">
          {documents.map((d) => (
            <li key={d.id as string} className="rounded-lg bg-slate-50 px-3 py-2">
              {d.file_name as string} · v{d.version_number as number}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (view === "automation") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">Automation integration</h2>
        <p className="text-sm text-slate-600">
          Compliance obligations sync from HR certifications, executive requirements, IEP reviews, and other
          modules via the universal deadline engine. Reminders and escalations run through{" "}
          <Link href="/dashboard/mission-control" className="text-brand-600">
            Mission Control
          </Link>{" "}
          and the platform queue processor.
        </p>
        <ul className="text-sm space-y-1 text-slate-600">
          <li>• Module sync runs on each queue processing cycle</li>
          <li>• Reminders: 180→1 days + due today + daily when overdue</li>
          <li>• Escalation: 7→45 days to leadership roles</li>
          <li>• Completion auto-generates next recurrence</li>
        </ul>
      </section>
    );
  }

  if (view === "reports") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">Compliance reports</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/compliance/reports?type=summary&schoolId=${schoolId}`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
          >
            Summary CSV
          </a>
          <a
            href={`/api/compliance/reports?type=overdue&schoolId=${schoolId}`}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
          >
            Overdue CSV
          </a>
        </div>
        <p className="text-xs text-slate-500">
          PDF export architecture ready via Report Studio. CSV available now.
        </p>
      </section>
    );
  }

  if (view === "administration" && canAdmin) {
    return (
      <ComplianceAdminForms
        reminderSchedules={reminderSchedules}
        escalationRules={escalationRules}
      />
    );
  }

  return <p className="text-slate-500">Select a tab above.</p>;
}

function scoreColor(status: string) {
  if (status === "green") return "bg-emerald-100 text-emerald-800";
  if (status === "yellow") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function heatColor(status: string) {
  if (status === "green") return "bg-emerald-50 text-emerald-800";
  if (status === "yellow") return "bg-amber-50 text-amber-800";
  return "bg-rose-50 text-rose-800";
}
