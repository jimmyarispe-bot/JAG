"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin";

export function ScenarioBuilder({ scenarios }: { scenarios: ScenarioDefinition[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Scenario builder</h2>
      <p className="mt-1 text-xs text-slate-500">Isolated sandbox definitions (no production mutation)</p>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {scenarios.map((s) => (
          <li key={s.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
            <p className="font-medium text-slate-900">{s.label}</p>
            <p className="text-slate-600">{s.description}</p>
            <div className="mt-2">
              <ActionChip size="sm" variant="outline">
                Compare
              </ActionChip>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
