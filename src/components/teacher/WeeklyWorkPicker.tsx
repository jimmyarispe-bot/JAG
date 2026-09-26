"use client";

import { useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { setWeeklyWorkAction } from "@/lib/finance/teacher-week-actions";
import { weeklyWorkOptions, type WeeklyWorkKind } from "@/lib/finance/weekly-work";

/**
 * A dropdown for work that is not a class: admin hours, tutoring sessions.
 *
 * Rendered once per kind the teacher actually holds a rate for, which for most
 * of them is none at all. Katie Vetere sees admin hours; Jessica Price sees
 * tutoring sessions; nobody sees the other's.
 *
 * Saved on its own, before submit, so she can change it and watch the money
 * move before she commits to anything.
 */
export function WeeklyWorkPicker({
  weekStart,
  kind,
  quantity,
  rate,
  gross,
}: {
  weekStart: string;
  kind: WeeklyWorkKind;
  quantity: number;
  rate: number;
  gross: number;
}) {
  const [value, setValue] = useState(quantity);

  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const labels = { idle: "Save", loading: "Saving…", success: "✓ Saved" };
  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: `${kind.tileLabel} saved.`,
    errorToast: `Could not save your ${kind.tileLabel.toLowerCase()}.`,
    progressLabel: "Saving…",
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <label className="block">
        <span className="block text-sm font-medium text-slate-900">{kind.question}</span>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <select
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            aria-label={kind.question}
          >
            {weeklyWorkOptions(kind).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <ActionButton
            status={action.status}
            variant="secondary"
            size="sm"
            errorMessage={action.errorMessage}
            labels={labels}
            onClick={() =>
              void action.run(async () => {
                const result = await setWeeklyWorkAction(weekStart, kind.code, value);
                if (result && "error" in result && result.error) {
                  throw new Error(result.error);
                }
                return { success: true };
              })
            }
          />

          <span className="text-sm text-slate-600">
            {value === quantity ? (
              <>
                <span className="font-semibold text-slate-900">{money(gross)}</span> at{" "}
                {money(rate)} a {kind.unitNoun}
              </>
            ) : (
              <>
                Save to add{" "}
                <span className="font-semibold text-slate-900">{money(value * rate)}</span>{" "}
                to your week
              </>
            )}
          </span>
        </div>
      </label>

      <p className="mt-2 text-xs text-slate-500">
        {kind.help} Paid at {money(rate)} a {kind.unitNoun}.
      </p>
    </div>
  );
}
