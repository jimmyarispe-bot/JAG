"use client";

import type { SimulationState } from "@/lib/platform/intelligence/digital-twin";

export function SimulationResults({ simulations }: { simulations: SimulationState[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Simulation results</h2>
      <ul className="mt-3 space-y-2">
        {simulations.map((s) => (
          <li key={s.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-slate-900">{s.scenarioId}</span>
              <span className="text-xs text-slate-600">
                {s.valid ? "Valid" : "Invalid"} · {Math.round(s.confidence * 100)}%
              </span>
            </div>
            {!s.valid ? (
              <p className="mt-1 text-xs text-rose-700">{s.invalidReasons.join(" · ")}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
