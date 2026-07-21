"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { EmergingSignal } from "@/lib/platform/intelligence/executive-predictive";
import { cn } from "@/components/workspace-design-system/utils";

export interface SignalTimelineProps {
  signals: EmergingSignal[];
  className?: string;
  onAction?: (actionId: string, signal: EmergingSignal) => void;
}

export function SignalTimeline({
  signals,
  className,
  onAction,
}: SignalTimelineProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Emerging signals</h3>
      {signals.length === 0 ? (
        <p className="text-sm text-slate-500">No weak signals detected in current history.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-slate-200 pl-4">
          {signals.map((signal) => (
            <li key={signal.id} className="relative">
              <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">
                    {signal.firstDetectedAt} · {signal.trend} · strength{" "}
                    {Math.round(signal.strength * 100)}%
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900">{signal.title}</h4>
                  <p className="mt-1 text-sm text-slate-700">{signal.narrative}</p>
                </div>
                <ActionChip
                  size="sm"
                  variant="secondary"
                  onClick={() => onAction?.("open_signal", signal)}
                >
                  Open
                </ActionChip>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
