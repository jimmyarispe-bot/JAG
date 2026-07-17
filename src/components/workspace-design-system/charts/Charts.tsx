import type { WdsChartPoint } from "../types";
import { cn, formatPercent } from "../utils";

interface ChartShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartShell({ title, subtitle, children, className }: ChartShellProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BarChart({ points, color = "#6366f1", title }: { points: WdsChartPoint[]; color?: string; title?: string }) {
  const max = Math.max(...points.map((p) => p.value), 1);

  if (!points.length) {
    return <p className="text-sm text-slate-500">No data available.</p>;
  }

  const summary = points.map((p) => `${p.label}: ${p.value}`).join("; ");

  return (
    <div
      className="flex h-36 items-end gap-2"
      role="img"
      aria-label={title ? `${title}. ${summary}` : `Bar chart. ${summary}`}
    >
      <table className="sr-only">
        <caption>{title ?? "Chart data"}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1" aria-hidden>
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(point.value / max) * 100}%`, minHeight: "4px", backgroundColor: color }}
            title={`${point.label}: ${point.value}`}
          />
          <span className="max-w-full truncate text-[10px] text-slate-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ value, color = "#6366f1" }: { value: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-32 w-32" role="img" aria-label={`${clamped} percent`}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" className="fill-slate-900 text-lg font-semibold" fontSize="16">
          {formatPercent(clamped, 0)}
        </text>
      </svg>
    </div>
  );
}

export function MasteryProgressChart({ points, title = "Mastery Progress" }: { points: WdsChartPoint[]; title?: string }) {
  return (
    <ChartShell title={title} subtitle="Level progression over time">
      <BarChart points={points} color="#4f46e5" title={title} />
    </ChartShell>
  );
}

export function EvidenceQualityChart({ points, title = "Evidence Quality" }: { points: WdsChartPoint[]; title?: string }) {
  return (
    <ChartShell title={title} subtitle="Quality scores by artifact type">
      <BarChart points={points} color="#0ea5e9" title={title} />
    </ChartShell>
  );
}

export function CompetencyCompletionChart({ value, title = "Competency Completion" }: { value: number; title?: string }) {
  return (
    <ChartShell title={title} subtitle="Overall competency completion rate">
      <DonutChart value={value} color="#4f46e5" />
    </ChartShell>
  );
}

export function AiConfidenceChart({ points, title = "AI Confidence" }: { points: WdsChartPoint[]; title?: string }) {
  return (
    <ChartShell title={title} subtitle="Model confidence across insight categories">
      <BarChart points={points} color="#8b5cf6" title={title} />
    </ChartShell>
  );
}

/** Backward-compatible alias for progress domain charts */
export function ProgressDomainChart({
  records,
  title,
}: {
  records: { assessment_date: string; current_level: number }[];
  title: string;
}) {
  const points: WdsChartPoint[] = records.map((r) => ({
    label: new Date(r.assessment_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: r.current_level,
  }));
  return <MasteryProgressChart points={points} title={title} />;
}
