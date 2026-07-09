import { CardShell } from "../cards/CardShell";
import {
  WDS_EXECUTION_PIPELINE_STEPS,
  type WdsExecutionPipelineOrientation,
  type WdsExecutionStepId,
  type WdsExecutionStepState,
  type WdsExecutionStepStatus,
} from "./execution-steps";
import { cn } from "../utils";

function resolveStepStates(
  currentStepId?: WdsExecutionStepId,
  overrides?: Partial<Record<WdsExecutionStepId, WdsExecutionStepState>>
): WdsExecutionStepState[] {
  const currentIndex = currentStepId
    ? WDS_EXECUTION_PIPELINE_STEPS.findIndex((s) => s.id === currentStepId)
    : -1;

  return WDS_EXECUTION_PIPELINE_STEPS.map((step, index) => {
    const override = overrides?.[step.id];
    if (override) return override;

    let status: WdsExecutionStepStatus = "pending";
    if (currentIndex >= 0) {
      if (index < currentIndex) status = "complete";
      else if (index === currentIndex) status = step.id === "done" ? "complete" : "active";
    }

    return { id: step.id, status };
  });
}

const statusStyles: Record<WdsExecutionStepStatus, { dot: string; text: string; connector: string }> = {
  pending: { dot: "border-slate-300 bg-white", text: "text-slate-400", connector: "bg-slate-200" },
  active: { dot: "border-brand-500 bg-brand-500 ring-4 ring-brand-100", text: "text-brand-700 font-semibold", connector: "bg-brand-200" },
  complete: { dot: "border-emerald-500 bg-emerald-500", text: "text-slate-700", connector: "bg-emerald-300" },
  skipped: { dot: "border-slate-200 bg-slate-100", text: "text-slate-400 line-through", connector: "bg-slate-200" },
  error: { dot: "border-rose-500 bg-rose-500", text: "text-rose-700 font-semibold", connector: "bg-rose-200" },
};

interface ExecutionPipelineProps {
  currentStepId?: WdsExecutionStepId;
  stepStates?: Partial<Record<WdsExecutionStepId, WdsExecutionStepState>>;
  orientation?: WdsExecutionPipelineOrientation;
  compact?: boolean;
  title?: string;
  className?: string;
}

export function ExecutionPipeline({
  currentStepId,
  stepStates,
  orientation = "vertical",
  compact = false,
  title = "Execution Pipeline",
  className,
}: ExecutionPipelineProps) {
  const resolved = resolveStepStates(currentStepId, stepStates);

  if (orientation === "horizontal") {
    return (
      <div className={cn("overflow-x-auto", className)}>
        <ol className="flex min-w-max items-center gap-0" aria-label={title}>
          {WDS_EXECUTION_PIPELINE_STEPS.map((step, index) => {
            const state = resolved[index];
            const styles = statusStyles[state.status];
            const label = compact ? String(index + 1) : step.label;

            return (
              <li key={step.id} className="flex items-center">
                <div className="flex flex-col items-center px-2">
                  <span
                    className={cn("flex h-3 w-3 shrink-0 rounded-full border-2", styles.dot)}
                    aria-hidden
                  />
                  <span className={cn("mt-2 max-w-[5rem] text-center text-[10px] leading-tight", styles.text)}>
                    {label}
                  </span>
                </div>
                {index < WDS_EXECUTION_PIPELINE_STEPS.length - 1 && (
                  <span className={cn("h-0.5 w-6 shrink-0", styles.connector)} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      {title && <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>}
      <ol className="relative space-y-0" aria-label={title}>
        {WDS_EXECUTION_PIPELINE_STEPS.map((step, index) => {
          const state = resolved[index];
          const styles = statusStyles[state.status];
          const isLast = index === WDS_EXECUTION_PIPELINE_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLast && (
                <span
                  className={cn("absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5", styles.connector)}
                  aria-hidden
                />
              )}
              <span
                className={cn("relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", styles.dot)}
                aria-hidden
              >
                {state.status === "complete" && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="currentColor" aria-hidden>
                    <path d="M10.28 2.28a.75.75 0 00-1.06-1.06L4.5 6.84 2.78 5.12a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0">
                <p className={cn("text-sm", styles.text, compact && "text-xs")}>{step.label}</p>
                {state.detail && <p className="mt-0.5 text-xs text-slate-500">{state.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface ExecutionPipelineCardProps extends ExecutionPipelineProps {
  subtitle?: string;
}

export function ExecutionPipelineCard(props: ExecutionPipelineCardProps) {
  const { subtitle, ...pipelineProps } = props;
  return (
    <CardShell padding="md">
      {subtitle && <p className="mb-3 text-xs text-slate-500">{subtitle}</p>}
      <ExecutionPipeline {...pipelineProps} />
    </CardShell>
  );
}

export { WDS_EXECUTION_PIPELINE_STEPS, type WdsExecutionStepId, type WdsExecutionStepState };
