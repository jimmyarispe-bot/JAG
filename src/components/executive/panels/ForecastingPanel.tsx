"use client";

import { formatCurrency } from "@/lib/format";
import type { ForecastScenario } from "@/lib/executive/types";
import { createForecastScenarioAction } from "@/lib/executive/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, MetricCard } from "./shared";

export function ForecastingPanel({
  baseline,
  scenarios,
  schoolId,
  schools,
}: {
  baseline: Record<string, unknown> | null;
  scenarios: ForecastScenario[];
  schoolId: string;
  schools: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save scenario", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Scenario saved.",
    errorToast: "Unable to save scenario.",
    progressLabel: "Running forecast scenario…",
  });

  return (
    <div className="space-y-6">
      {baseline && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Forecast tuition" value={formatCurrency(Number(baseline.forecast_tuition))} />
          <MetricCard label="Forecast scholarships" value={formatCurrency(Number(baseline.forecast_scholarships))} />
          <MetricCard label="Forecast payroll" value={formatCurrency(Number(baseline.forecast_payroll))} />
        </section>
      )}
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          void action.run(async () => {
            const result = await createForecastScenarioAction(new FormData(form));
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Scenario modeling</h2>
        <select name="school_id" defaultValue={schoolId} className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="scenario_name" placeholder="Scenario name" required className={inputClass} />
        <select name="scenario_type" className={inputClass}>
          <option value="baseline">Baseline</option>
          <option value="optimistic">Optimistic</option>
          <option value="pessimistic">Pessimistic</option>
          <option value="custom">Custom</option>
        </select>
        <input name="enrollment_growth_pct" type="number" placeholder="Enrollment growth %" className={inputClass} />
        <input name="scholarship_growth_pct" type="number" placeholder="Scholarship growth %" className={inputClass} />
        <input name="payroll_growth_pct" type="number" placeholder="Payroll growth %" defaultValue={5} className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="save"
          labels={{ idle: "Save scenario", loading: "Saving…", success: "✓ Saved" }}
          errorMessage={action.errorMessage}
        />
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Saved scenarios</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {scenarios.map((s) => (
            <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium">{s.scenario_name}</span> — {s.scenario_type} · Enrollment{" "}
              {s.forecast_enrollment ?? "—"} · Tuition {formatCurrency(Number(s.forecast_tuition ?? 0))}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
