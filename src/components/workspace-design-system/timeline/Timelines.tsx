import type { WdsTimelineEntry } from "../types";
import { cn } from "../utils";

interface TimelineBaseProps {
  entries: WdsTimelineEntry[];
  className?: string;
  emptyMessage?: string;
}

const statusStyles = {
  complete: "border-emerald-500 bg-emerald-500",
  current: "border-brand-500 bg-brand-500 ring-4 ring-brand-100",
  upcoming: "border-slate-300 bg-white",
  warning: "border-amber-500 bg-amber-500",
};

function TimelineTrack({ entries, className, emptyMessage }: TimelineBaseProps) {
  if (!entries.length) {
    return <p className="text-sm text-slate-500">{emptyMessage ?? "No timeline entries."}</p>;
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < entries.length - 1 && (
            <span className="absolute left-[7px] top-4 h-full w-0.5 bg-slate-200" aria-hidden />
          )}
          <span
            className={cn(
              "relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2",
              statusStyles[entry.status ?? "upcoming"]
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1 pt-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{entry.title}</p>
                {entry.subtitle && <p className="text-sm text-slate-500">{entry.subtitle}</p>}
              </div>
              <time className="shrink-0 text-xs text-slate-400" dateTime={entry.timestamp}>
                {new Date(entry.timestamp).toLocaleDateString()}
              </time>
            </div>
            {entry.meta && <div className="mt-2">{entry.meta}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProgressTimeline(props: TimelineBaseProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Progress Timeline</h3>
      <div className="mt-4">
        <TimelineTrack {...props} emptyMessage={props.emptyMessage ?? "No progress recorded yet."} />
      </div>
    </div>
  );
}

export function EvidenceTimeline(props: TimelineBaseProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Evidence Timeline</h3>
      <div className="mt-4">
        <TimelineTrack {...props} emptyMessage={props.emptyMessage ?? "No evidence collected yet."} />
      </div>
    </div>
  );
}

export function JourneyTimeline(props: TimelineBaseProps) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/40 to-white p-5">
      <h3 className="font-semibold text-slate-900">Journey Timeline</h3>
      <div className="mt-4">
        <TimelineTrack {...props} emptyMessage={props.emptyMessage ?? "Journey has not started yet."} />
      </div>
    </div>
  );
}
