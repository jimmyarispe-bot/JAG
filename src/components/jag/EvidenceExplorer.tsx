import type { DecisionEvidenceItem } from "@/lib/platform/intelligence/decision/types";

interface EvidenceExplorerProps {
  evidence: readonly DecisionEvidenceItem[];
  summary?: string;
}

export function EvidenceExplorer({ evidence, summary }: EvidenceExplorerProps) {
  return (
    <section id="evidence-explorer" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Evidence Explorer</h2>
      {summary && <p className="mt-1 text-sm text-slate-500">{summary}</p>}
      {evidence.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No evidence items in this decision package.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {evidence.map((item) => (
            <li
              key={item.evidenceId}
              id={`evidence-${item.evidenceId}`}
              className="rounded-xl border border-slate-100 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <span className="text-xs text-slate-500">
                  weight {item.weight} · {item.kind}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
              {item.sourceRef && (
                <p className="mt-1 text-xs text-slate-400">Source: {item.sourceRef}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
