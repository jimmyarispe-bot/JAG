"use client";

import type { StrategicGoal } from "@/lib/executive/types";
import { createStrategicGoalAction } from "@/lib/executive/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { inputClass } from "./shared";

export function StrategicPlanningPanel({
  goals,
  schools,
}: {
  goals: StrategicGoal[];
  schools: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Create goal", loading: "Creating…", success: "✓ Created" },
    successToast: "✓ Goal created.",
    errorToast: "Unable to create goal.",
    progressLabel: "Creating strategic goal…",
  });
  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          void action.run(async () => {
            const result = await createStrategicGoalAction(new FormData(form));
            assertActionResult(result);
            form.reset();
            return result;
          });
        }}
      >
        <h2 className="font-semibold">Add strategic goal</h2>
        <select name="school_id" className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="title" placeholder="Goal title" required className={inputClass} />
        <textarea name="description" placeholder="Description" className={inputClass} />
        <select name="goal_type" className={inputClass}>
          <option value="organizational">Organizational</option>
          <option value="academic">Academic</option>
          <option value="financial">Financial</option>
          <option value="operational">Operational</option>
          <option value="growth">Growth</option>
        </select>
        <input name="target_date" type="date" className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Create goal", loading: "Creating…", success: "✓ Created" }}
          errorMessage={action.errorMessage}
        />
      </form>
      <ul className="space-y-3">
        {goals.map((g) => (
          <li key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex justify-between">
              <h3 className="font-semibold">{g.title}</h3>
              <span className="text-sm">{g.progress_pct}%</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{g.description}</p>
            {g.initiatives.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-500">
                {g.initiatives.map((i) => (
                  <li key={i.id}>
                    • {i.title} ({i.status})
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
