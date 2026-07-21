"use client";

import { formatCurrency } from "@/lib/format";
import { createGrantAction } from "@/lib/executive/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass, MetricCard } from "./shared";

export function GrantsDashboardPanel({
  data,
  schools,
}: {
  data: {
    grants: Record<string, unknown>[];
    totalAwarded: number;
    totalSpent: number;
    pipelineCount: number;
  };
  schools: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Add grant", loading: "Adding…", success: "✓ Added" },
    successToast: "✓ Grant added.",
    errorToast: "Unable to add grant.",
    progressLabel: "Adding grant…",
  });
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total awarded" value={formatCurrency(data.totalAwarded)} />
        <MetricCard label="Total spent" value={formatCurrency(data.totalSpent)} />
        <MetricCard label="Pipeline" value={String(data.pipelineCount)} />
      </section>
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          void action.run(async () => {
            const result = await createGrantAction(new FormData(form));
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Add grant</h2>
        <select name="school_id" className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="grant_name" placeholder="Grant name" required className={inputClass} />
        <input name="funder_name" placeholder="Funder" className={inputClass} />
        <input name="award_amount" type="number" placeholder="Award amount" className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Add grant", loading: "Adding…", success: "✓ Added" }}
          errorMessage={action.errorMessage}
        />
      </form>
      <ul className="space-y-2 text-sm">
        {data.grants.map((g) => (
          <li key={g.id as string} className="rounded-lg bg-slate-50 px-3 py-2">
            {g.grant_name as string} — {g.pipeline_stage as string} ·{" "}
            {formatCurrency(Number(g.award_amount ?? 0))}
          </li>
        ))}
      </ul>
    </div>
  );
}
