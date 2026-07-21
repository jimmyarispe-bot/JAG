"use client";

import type { SimulationState } from "@/lib/platform/intelligence/digital-twin";

export function ImpactMatrix({ simulations }: { simulations: SimulationState[] }) {
  const sample = simulations[0];
  if (!sample) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Impact matrix</h2>
      <p className="mt-1 text-xs text-slate-500">Sample from {sample.scenarioId}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sample.impacts.map((i) => (
          <div key={i.domain} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
            <p className="text-xs uppercase text-slate-500">{i.domain}</p>
            <p className="font-semibold text-slate-900">
              {i.direction} ({i.delta.toFixed(1)})
            </p>
            <p className="text-xs text-slate-600">{i.narrative}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
