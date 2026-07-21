"use client";

import { runEdiScenarioAction } from "@/lib/edi/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { NumberField } from "@/components/edi/panels/shared";

export function ScenarioForm({ schoolId }: { schoolId: string }) {
  const action = useActionFeedback({
    verb: "run",
    labels: { idle: "Run scenario", loading: "Running analysis…", success: "✓ Complete" },
    successToast: "✓ Scenario analysis complete.",
    errorToast: "Unable to run scenario.",
    progressLabel: "Running scenario analysis…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        void action.run(async () => {
          await runEdiScenarioAction(new FormData(form));
          form.reset();
          return { success: true };
        });
      }}
    >
      <h3 className="font-semibold">Custom scenario</h3>
      <input type="hidden" name="school_id" value={schoolId} />
      <input name="name" placeholder="Scenario name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField name="tuition_change_pct" label="Tuition change %" />
        <NumberField name="enrollment_change_pct" label="Enrollment change %" />
        <NumberField name="teacher_hires" label="Teacher hires" />
        <NumberField name="class_size_increase" label="Class size increase %" />
        <NumberField name="sections_added" label="Sections added" />
        <NumberField name="sections_closed" label="Sections closed" />
      </div>
      <ActionButton
        type="submit"
        status={action.status}
        verb="run"
        labels={{ idle: "Run scenario", loading: "Running analysis…", success: "✓ Complete" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
