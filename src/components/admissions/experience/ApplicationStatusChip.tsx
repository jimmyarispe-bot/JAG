import {
  APPLICATION_DASHBOARD_STATUSES,
  toDashboardStatus,
  type ApplicationDashboardStatus,
} from "@/lib/admissions/experience/constants";

const TONE: Record<ApplicationDashboardStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-sky-100 text-sky-800",
  "Under Review": "bg-amber-100 text-amber-900",
  "Assessment Scheduled": "bg-violet-100 text-violet-900",
  "Interview Scheduled": "bg-indigo-100 text-indigo-900",
  Accepted: "bg-emerald-100 text-emerald-900",
  Waitlisted: "bg-orange-100 text-orange-900",
  Declined: "bg-rose-100 text-rose-900",
  Enrolled: "bg-teal-100 text-teal-900",
};

export function ApplicationStatusChip(props: {
  applicationStatus?: string | null;
  pipelineStage?: string | null;
  leadStage?: string | null;
}) {
  const status = toDashboardStatus(props);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONE[status]}`}
    >
      {status}
    </span>
  );
}

export function ApplicationStatusLegend() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs text-slate-600">
      {APPLICATION_DASHBOARD_STATUSES.map((s) => (
        <li key={s} className={`rounded-full px-2 py-0.5 ${TONE[s]}`}>
          {s}
        </li>
      ))}
    </ul>
  );
}
