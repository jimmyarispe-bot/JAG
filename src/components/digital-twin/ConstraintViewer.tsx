"use client";

import type { SimulationState } from "@/lib/platform/intelligence/digital-twin";

export function ConstraintViewer({ simulations }: { simulations: SimulationState[] }) {
  const constraints = simulations.flatMap((s) =>
    s.constraints.filter((c) => c.violated).map((c) => ({ ...c, scenarioId: s.scenarioId }))
  );
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Constraint viewer</h2>
      {constraints.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No violated constraints in current sandbox.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {constraints.map((c) => (
            <li key={`${c.scenarioId}-${c.id}`} className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
              <p className="font-medium text-slate-900">
                {c.label} · {c.scenarioId}
              </p>
              <p className="text-slate-700">{c.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
