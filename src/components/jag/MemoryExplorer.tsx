import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";

interface MemoryExplorerProps {
  memories: readonly IntelligencePersistentMemoryRecord[];
}

export function MemoryExplorer({ memories }: MemoryExplorerProps) {
  return (
    <section id="memory-explorer" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Memory Explorer</h2>
      <p className="mt-1 text-sm text-slate-500">Related persistent intelligence memory for this workspace cycle.</p>
      {memories.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No related memory entries found.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {memories.map((memory) => (
            <li
              key={memory.id}
              id={`memory-${memory.id}`}
              className="rounded-xl border border-slate-100 px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{memory.domain}</p>
                <span className="text-xs uppercase text-slate-500">{memory.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(memory.timestamp).toLocaleString()} · confidence{" "}
                {Math.round(memory.confidence.value * 100)}%
              </p>
              {memory.observations.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                  {memory.observations.slice(0, 3).map((obs) => (
                    <li key={obs}>{obs}</li>
                  ))}
                </ul>
              )}
              {memory.recommendations.length > 0 && (
                <p className="mt-2 text-sm text-slate-700">
                  Recs: {memory.recommendations.slice(0, 2).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
