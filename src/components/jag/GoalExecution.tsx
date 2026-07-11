import type { ExecutionGoal, ExecutionProgressSnapshot } from "@/lib/platform/execution/types";
import type { StrategicGoal } from "@/lib/platform/intelligence/domains/strategic/types";

interface GoalExecutionProps {
  strategicGoals: readonly StrategicGoal[];
  executionGoals: readonly ExecutionGoal[];
  progress: readonly ExecutionProgressSnapshot[];
}

export function GoalExecution({ strategicGoals, executionGoals, progress }: GoalExecutionProps) {
  const progressById = new Map(progress.map((p) => [p.subjectId, p]));

  return (
    <section id="goal-execution" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Goal Execution</h2>
      <p className="mt-1 text-sm text-slate-500">
        Strategic goals imported into the Goal Execution Engine.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Strategic Goals</h3>
          {strategicGoals.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No strategic goals in this cycle.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {strategicGoals.map((goal) => (
                <li key={goal.id} id={`goal-${goal.id}`} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{goal.title}</p>
                    <span className="text-xs uppercase text-slate-500">{goal.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{goal.expectedValue}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">Execution Progress</h3>
          {executionGoals.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No execution goals imported yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {executionGoals.map((goal) => {
                const snap = progressById.get(goal.id);
                return (
                  <li key={goal.id} id={`execution-${goal.id}`} className="rounded-xl border border-slate-100 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{goal.title}</p>
                      <span className="text-xs uppercase text-slate-500">{goal.status}</span>
                    </div>
                    {snap && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{snap.healthLabel}</span>
                          <span>{snap.completionPercent}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-600"
                            style={{ width: `${snap.completionPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
