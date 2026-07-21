"use client";

import { useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { generateSessionsAction } from "@/lib/scheduling/actions";

interface GenerateSessionsButtonProps {
  sectionId: string;
  sectionCode: string;
}

export function GenerateSessionsButton({ sectionId, sectionCode }: GenerateSessionsButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "generate",
    labels: {
      idle: `Generate — ${sectionCode}`,
      loading: "Generating…",
      success: "✓ Generated",
    },
    successToast: "✓ Sessions generated.",
    errorToast: "Unable to generate sessions.",
    progressLabel: "Generating sessions…",
  });

  const [dateDefaults] = useState(() => {
    const todayDate = new Date();
    const in30Date = new Date(todayDate);
    in30Date.setDate(in30Date.getDate() + 30);
    return {
      today: todayDate.toISOString().split("T")[0],
      in30: in30Date.toISOString().split("T")[0],
    };
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        void action.run(async () => {
          setMessage(null);
          const result = await generateSessionsAction(formData);
          assertActionResult(result);
          if ("created" in result) {
            setMessage(`Created ${result.created ?? 0} sessions (${result.skipped ?? 0} skipped)`);
          }
          return result;
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      <input type="hidden" name="section_id" value={sectionId} />
      <div>
        <label className="block text-xs font-medium text-slate-500">From</label>
        <input
          type="date"
          name="date_from"
          defaultValue={dateDefaults.today}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">To</label>
        <input
          type="date"
          name="date_to"
          defaultValue={dateDefaults.in30}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          required
        />
      </div>
      <ActionButton
        type="submit"
        status={action.status}
        verb="generate"
        labels={{
          idle: `Generate — ${sectionCode}`,
          loading: "Generating…",
          success: "✓ Generated",
        }}
        errorMessage={action.errorMessage}
      />
      {message && <p className="w-full text-xs text-slate-600">{message}</p>}
    </form>
  );
}
