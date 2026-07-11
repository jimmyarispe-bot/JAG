import type { JagCollaborationResult } from "@/lib/platform/jag/collaboration/types";

interface AgentActivityProps {
  collaboration: JagCollaborationResult | null;
}

export function AgentActivity({ collaboration }: AgentActivityProps) {
  return (
    <section id="agent-activity" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Agent Activity</h2>
      {!collaboration ? (
        <p className="mt-2 text-sm text-slate-500">No collaboration run for this cycle.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">Consensus</p>
              <p className="text-sm font-medium text-slate-900">{collaboration.consensus.mode}</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="text-sm font-medium text-slate-900">
                {Math.round(collaboration.confidence.score.value * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">Runtime</p>
              <p className="text-sm font-medium text-slate-900">
                {collaboration.telemetry.executionTimeMs}ms
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {collaboration.moderated.responses.map((response) => (
              <li key={response.responseId} className="rounded-xl border border-slate-100 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{response.agentName}</p>
                  <span className="text-xs uppercase text-slate-500">{response.agentRole}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{response.summary}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {response.recommendations.length} recommendations · {response.elapsedMs}ms
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
