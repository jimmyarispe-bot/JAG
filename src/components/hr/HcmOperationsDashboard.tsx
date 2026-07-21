import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { HcmOperationsSummary } from "@/lib/hr-platform/types";

interface HcmOperationsDashboardProps {
  summary: HcmOperationsSummary;
  canEdit: boolean;
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function HcmOperationsDashboard({
  summary,
  canEdit,
}: HcmOperationsDashboardProps) {
  const alerts: string[] = [];
  if (summary.certificationsExpiring > 0) {
    alerts.push(`${summary.certificationsExpiring} certification(s) expiring within 90 days`);
  }
  if (summary.timeOffPending > 0) {
    alerts.push(`${summary.timeOffPending} time-off request(s) pending approval`);
  }
  if (summary.performanceReviewsOpen > 0) {
    alerts.push(`${summary.performanceReviewsOpen} open performance review(s)`);
  }
  if (summary.openPositions > 0) {
    alerts.push(`${summary.openPositions} open position(s) in recruiting`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Workforce Summary"
          value={formatCount(summary.workforceTotal)}
          hint={`${formatCount(summary.activeEmployees)} active`}
        />
        <Card
          title="Open Positions"
          value={formatCount(summary.openPositions)}
          hint="Recruiting pipeline"
        />
        <Card
          title="Active Employees"
          value={formatCount(summary.activeEmployees)}
          hint="Active / onboarding"
        />
        <Card
          title="New Hires"
          value={formatCount(summary.newHires)}
          hint="Last 30 days"
        />
        <Card
          title="Certifications Expiring"
          value={formatCount(summary.certificationsExpiring)}
          hint="Within 90 days"
        />
        <Card
          title="Time-Off Requests"
          value={formatCount(summary.timeOffPending)}
          hint="Pending approval"
        />
        <Card
          title="Performance Reviews"
          value={formatCount(summary.performanceReviewsOpen)}
          hint="Draft / submitted"
        />
        <Card
          title="Professional Development"
          value={formatCount(summary.professionalDevelopmentActive)}
          hint="Assigned / in progress"
        />
        <Card
          title="Compliance Alerts"
          value={formatCount(summary.complianceAlerts)}
          hint="Certs + onboarding"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Compliance Alerts</h3>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No active compliance alerts.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/hr?view=recruiting"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Recruiting
          </Link>
          <Link
            href="/dashboard/hr?view=compliance"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Compliance
          </Link>
          <Link
            href="/dashboard/hr?view=certifications"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Certifications
          </Link>
          <Link
            href="/dashboard/hr?view=employees"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Employees
          </Link>
          {canEdit ? (
            <Link
              href="/dashboard/hr?view=create"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              Add employee
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
