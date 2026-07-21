import { StatCard } from "@/components/dashboard/StatCard";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { formatCount, formatCurrency } from "@/lib/dashboard/metrics";
import type { FounderDashboardData } from "@/lib/dashboard/founder-dashboard";
import type { FounderDashboardCardKey } from "@/lib/dashboard/founder-dashboard-access";

interface FounderDashboardCardsProps {
  data: FounderDashboardData;
  financialIntelligenceLabel?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-900",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  medium: "border-slate-200 bg-slate-50 text-slate-800",
  low: "border-blue-100 bg-blue-50 text-blue-900",
};

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardEmptyCard({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {href && linkLabel && (
        <ActionChip href={href} size="sm" className="mt-3">
          {linkLabel.replace(/\s*→\s*$/, "")}
        </ActionChip>
      )}
    </section>
  );
}

function AttendanceStatCard({
  title,
  rate,
  detail,
  accent,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  rate: number | null;
  detail: string;
  accent: "sky" | "emerald";
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rate === null) {
    return (
      <DashboardEmptyCard title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <StatCard
      title={title}
      value={`${rate}%`}
      description={detail}
      accent={accent}
      icon={
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          <path
            d="M9 11l3 3L22 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      }
    />
  );
}

export function FounderDashboardCards({
  data,
  financialIntelligenceLabel = "Financial Intelligence",
}: FounderDashboardCardsProps) {
  const { visibleCards } = data;

  if (!visibleCards.length) {
    return (
      <DashboardEmptyCard
        title="Key metrics"
        description="Metrics appear here when you have access to student, admissions, finance, or workforce data."
      />
    );
  }

  const statKeys: FounderDashboardCardKey[] = [
    "activeEnrollment",
    "admissionsPipeline",
    "monthlyRevenue",
    "tuitionOutstanding",
    "staffCount",
    "teacherAttendance",
    "studentAttendance",
  ];

  const showStatGrid = statKeys.some((key) => visibleCards.includes(key));
  const showUpcoming = visibleCards.includes("upcomingClasses");
  const showAlerts = visibleCards.includes("executiveAlerts");
  const showFi = visibleCards.includes("financialIntelligence");

  return (
    <div className="space-y-6">
      {data.loadError && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500">
          {data.loadError}
        </p>
      )}
      {showStatGrid && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCards.includes("activeEnrollment") && data.activeEnrollment !== null && (
            <StatCard
              title="Active Enrollment"
              value={formatCount(data.activeEnrollment)}
              description="Students enrolled in course sections"
              accent="indigo"
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              }
            />
          )}

          {visibleCards.includes("admissionsPipeline") && data.admissionsPipeline !== null && (
            <StatCard
              title="Admissions Pipeline"
              value={formatCount(data.admissionsPipeline)}
              description="Leads in active admissions stages"
              accent="sky"
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
          )}

          {visibleCards.includes("monthlyRevenue") && data.monthlyRevenue !== null && (
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(data.monthlyRevenue)}
              description="Payments collected this month"
              accent="emerald"
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                  <path
                    d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
          )}

          {visibleCards.includes("tuitionOutstanding") && data.tuitionOutstanding !== null && (
            <StatCard
              title="Tuition Outstanding"
              value={formatCurrency(data.tuitionOutstanding)}
              description="Unpaid invoice balances"
              accent="amber"
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                  <rect
                    x="2"
                    y="5"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              }
            />
          )}

          {visibleCards.includes("staffCount") && data.staffCount !== null && (
            <StatCard
              title="Staff Count"
              value={formatCount(data.staffCount)}
              description="Active employees"
              accent="violet"
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                  <rect
                    x="2"
                    y="7"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              }
            />
          )}

          {visibleCards.includes("teacherAttendance") && data.teacherAttendance && (
            <AttendanceStatCard
              title="Teacher Attendance"
              rate={data.teacherAttendance.rate}
              detail={
                data.teacherAttendance.total
                  ? `${data.teacherAttendance.submitted} of ${data.teacherAttendance.total} sessions submitted today`
                  : "No data available."
              }
              accent="sky"
              emptyTitle="Teacher Attendance"
              emptyDescription="No data available."
            />
          )}

          {visibleCards.includes("studentAttendance") && data.studentAttendance && (
            <AttendanceStatCard
              title="Student Attendance"
              rate={data.studentAttendance.rate}
              detail={
                data.studentAttendance.total
                  ? `${data.studentAttendance.present} of ${data.studentAttendance.total} students present today`
                  : "No data available."
              }
              accent="emerald"
              emptyTitle="Student Attendance"
              emptyDescription="No data available."
            />
          )}
        </div>
      )}

      {(showUpcoming || showAlerts) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {showUpcoming && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Upcoming Classes</h2>
                  <p className="mt-1 text-sm text-slate-500">Next scheduled instructional sessions</p>
                </div>
                <ActionChip href="/dashboard/scheduling" size="sm">
                  Open scheduling
                </ActionChip>
              </div>
              {data.upcomingClasses.length ? (
                <ul className="mt-4 space-y-2">
                  {data.upcomingClasses.map((session) => (
                    <li
                      key={session.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{session.courseName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {session.sectionCode}
                            {session.deliveryMode ? ` · ${session.deliveryMode.replace(/_/g, " ")}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-600">
                          {formatSessionTime(session.scheduledStart)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
                  No data available.
                </p>
              )}
            </section>
          )}

          {showAlerts && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Executive Alerts</h2>
                  <p className="mt-1 text-sm text-slate-500">Active insights requiring attention</p>
                </div>
                <ActionChip href="/dashboard/executive" size="sm">
                  Open Executive Intelligence
                </ActionChip>
              </div>
              {data.executiveAlerts.length ? (
                <ul className="mt-4 space-y-2">
                  {data.executiveAlerts.map((alert) => (
                    <li
                      key={alert.id}
                      className={`rounded-xl border px-4 py-3 text-sm ${SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.medium}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          {alert.body && (
                            <p className="mt-1 text-xs opacity-80">{alert.body}</p>
                          )}
                        </div>
                        {alert.href && (
                          <ActionChip href={alert.href} size="xs" className="shrink-0">
                            Review
                          </ActionChip>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
                  No data available.
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {showFi && (
        <section className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Financial Intelligence Summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Profitability, collections, and risk from {financialIntelligenceLabel}
              </p>
            </div>
            <ActionChip href="/dashboard/finance/intelligence" size="sm">
              Open {financialIntelligenceLabel}
            </ActionChip>
          </div>
          {data.financialIntelligence ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Operating margin</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.financialIntelligence.operatingMargin != null
                    ? `${data.financialIntelligence.operatingMargin}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Collection rate</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.financialIntelligence.collectionRate != null
                    ? `${data.financialIntelligence.collectionRate}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Financial risks</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCount(data.financialIntelligence.financialRisks)}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">EBITDA</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.financialIntelligence.ebitda != null
                    ? formatCurrency(data.financialIntelligence.ebitda)
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cash position</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.financialIntelligence.cashPosition != null
                    ? formatCurrency(data.financialIntelligence.cashPosition)
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Forecast revenue</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.financialIntelligence.forecastRevenue != null
                    ? formatCurrency(data.financialIntelligence.forecastRevenue)
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-white/60 px-4 py-6 text-sm text-slate-500">
              Financial intelligence data is not available yet. Import financial records or configure a primary school to populate profitability and forecast metrics.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
